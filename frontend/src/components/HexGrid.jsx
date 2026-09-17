import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { List } from "react-window";
import HexRow from "./HexRow";

const ROW_HEIGHT = 20;
const VIEWPORT_HEIGHT = 560;
const OVERSCAN_COUNT = 12;

export default function HexGrid({
  fileSize,
  bytesPerRow,
  readRange,
  chunkVersion,
  selection,
  onSelectionChange,
  jumpTarget, // { offset, nonce } - nonce so the same offset can be jumped to twice
}) {
  const listRef = useRef(null);
  const totalRows = Math.max(1, Math.ceil(fileSize / bytesPerRow));

  const [hoveredOffset, setHoveredOffset] = useState(null);
  const draggingRef = useRef(false);
  const dragAnchorRef = useRef(null);

  const handleByteDown = useCallback((offset) => {
    draggingRef.current = true;
    dragAnchorRef.current = offset;
    onSelectionChange({ start: offset, end: offset });
  }, [onSelectionChange]);

  const handleByteEnter = useCallback((offset) => {
    setHoveredOffset(offset);
    if (draggingRef.current && dragAnchorRef.current !== null) {
      const anchor = dragAnchorRef.current;
      onSelectionChange({
        start: Math.min(anchor, offset),
        end: Math.max(anchor, offset),
      });
    }
  }, [onSelectionChange]);

  useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  // Programmatic jumps use react-window's row-index coordinate space.
  useEffect(() => {
    if (!jumpTarget || !listRef.current) return;
    const targetRow = Math.floor(jumpTarget.offset / bytesPerRow);
    listRef.current.scrollToRow({ index: targetRow, align: "center" });
    onSelectionChange({ start: jumpTarget.offset, end: jumpTarget.offset });
  }, [jumpTarget, bytesPerRow, onSelectionChange]);

  const handleLeave = useCallback(() => setHoveredOffset(null), []);

  const rowProps = useMemo(
    () => ({
      bytesPerRow,
      fileSize,
      readRange,
      chunkVersion,
      hoveredOffset,
      selection,
      onByteEnter: handleByteEnter,
      onByteDown: handleByteDown,
    }),
    [bytesPerRow, fileSize, readRange, chunkVersion, hoveredOffset, selection, handleByteEnter, handleByteDown]
  );

  return (
    <div onMouseLeave={handleLeave} className="hexScroll overflow-hidden rounded border border-slate-800 bg-[#0f0d1d]">
      <List
        listRef={listRef}
        style={{ height: VIEWPORT_HEIGHT }}
        rowCount={totalRows}
        rowHeight={ROW_HEIGHT}
        rowComponent={HexRow}
        rowProps={rowProps}
        overscanCount={OVERSCAN_COUNT}
      />
    </div>
  );
}