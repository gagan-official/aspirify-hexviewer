const API_BASE = "/api/files";

export async function getFiles() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Could not load the file list.");
  return res.json();
}

export async function getFileMeta(fileId) {
  const res = await fetch(`${API_BASE}/${fileId}/meta`);
  if (!res.ok) throw new Error("Could not load file metadata.");
  return res.json();
}

// Returns a Uint8Array of raw bytes - this is the only call that touches
// actual file content, and it always asks for a bounded range.
export async function fetchChunk(fileId, offset, length) {
  const res = await fetch(
    `${API_BASE}/${fileId}/chunk?offset=${offset}&length=${length}`
  );
  if (!res.ok) throw new Error("Could not load a chunk of the file.");
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}