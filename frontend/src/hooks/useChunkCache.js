import { useRef, useCallback, useState } from "react";
import { fetchChunk } from "../api";

// 64KB chunks: big enough that scrolling through a few hundred rows doesn't
// fire a request per row, small enough that we're never pulling megabytes
// just to draw one screen of hex. All chunk requests are aligned to this
// size, so two rows that fall in the same chunk share one fetch.
export const CHUNK_SIZE = 64 * 1024;

// Cap on how many chunks we keep around at once. 256 * 64KB = 16MB - flat,
// regardless of whether the file is 10KB or 10GB. When we go over this, we
// drop the least-recently-touched chunk first.
const MAX_CACHED_CHUNKS = 256;

export default function useChunkCache(fileId) {
  const cache = useRef(new Map()); // chunkIndex -> Uint8Array
  const pending = useRef(new Set()); // chunkIndex currently in flight

  // Bumped every time the file changes. Captured by each in-flight fetch at
  // request time so that, if its response lands *after* we've already moved
  // on to another file, we can tell it's stale and throw it away instead of
  // writing another file's bytes into the (now-reused) chunkIndex slot.
  const generationRef = useRef(0);
  const prevFileIdRef = useRef(fileId);

  // We store bytes in refs (not React state) so reading them doesn't
  // trigger re-renders. This little counter is the only thing that does -
  // it bumps once a chunk we were waiting on actually arrives, which tells
  // whatever's rendering "some of your nulls might be real bytes now".
  const [chunkVersion, forceRerender] = useState(0);

  // Switching files invalidates everything we've cached. This has to happen
  // synchronously during render (not in a useEffect) - an effect only runs
  // *after* this render has already committed, which means the very first
  // readRange() call for the new file would still see the old file's chunks
  // sitting in the cache and return them as if they were valid, non-null
  // bytes. Since those bytes wouldn't be null, nothing would queue a fetch
  // or trigger a re-render afterwards, so the stale content would just
  // stick around indefinitely. Clearing here, before any reads happen this
  // render, guarantees the new file starts from a clean cache.
  if (prevFileIdRef.current !== fileId) {
    prevFileIdRef.current = fileId;
    generationRef.current += 1;
    cache.current.clear();
    pending.current.clear();
  }

  const touch = (chunkIndex) => {
    // Map keeps insertion order, so deleting + re-adding on every access
    // turns it into a cheap LRU: whatever's least recently touched sits
    // at the front, which is exactly what we evict below.
    const bytes = cache.current.get(chunkIndex);
    cache.current.delete(chunkIndex);
    cache.current.set(chunkIndex, bytes);
  };

  const evictIfNeeded = () => {
    while (cache.current.size > MAX_CACHED_CHUNKS) {
      const oldestKey = cache.current.keys().next().value;
      cache.current.delete(oldestKey);
    }
  };

  const ensureChunk = useCallback(
    (chunkIndex) => {
      if (!fileId) return;
      if (cache.current.has(chunkIndex) || pending.current.has(chunkIndex)) return;

      pending.current.add(chunkIndex);
      const generation = generationRef.current;
      fetchChunk(fileId, chunkIndex * CHUNK_SIZE, CHUNK_SIZE)
        .then((bytes) => {
          if (generation !== generationRef.current) return; // stale: we've since switched files
          cache.current.set(chunkIndex, bytes);
          evictIfNeeded();
        })
        .catch((err) => {
          if (generation !== generationRef.current) return;
          // A failed chunk just stays "unknown" - the row will keep
          // showing placeholders and we'll retry next time it's requested.
          console.error(`Chunk ${chunkIndex} failed to load:`, err);
        })
        .finally(() => {
          if (generation !== generationRef.current) return; // don't touch the new file's pending set
          pending.current.delete(chunkIndex);
          forceRerender((n) => n + 1);
        });
    },
    [fileId]
  );

  // Reads `length` bytes starting at `offset`. Any byte whose chunk hasn't
  // arrived yet comes back as null (and its chunk gets queued for fetch),
  // so callers can render a placeholder instead of waiting.
  const readRange = useCallback(
    (offset, length) => {
      const result = new Array(length).fill(null);
      const firstChunk = Math.floor(offset / CHUNK_SIZE);
      const lastChunk = Math.floor((offset + length - 1) / CHUNK_SIZE);

      for (let c = firstChunk; c <= lastChunk; c++) {
        const bytes = cache.current.get(c);
        if (!bytes) {
          ensureChunk(c);
          continue;
        }
        touch(c);

        const chunkStart = c * CHUNK_SIZE;
        const overlapStart = Math.max(offset, chunkStart);
        const overlapEnd = Math.min(offset + length, chunkStart + bytes.length);
        for (let g = overlapStart; g < overlapEnd; g++) {
          result[g - offset] = bytes[g - chunkStart];
        }
      }
      return result;
    },
    [ensureChunk]
  );

  return { readRange, chunkVersion };
}