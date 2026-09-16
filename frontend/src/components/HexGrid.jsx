import { useEffect, useRef, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import HexRow from "./HexRow";

const ROW_HEIGHT = 20;
const VIEWPORT_HEIGHT = 560;
const OVERSCAN_ROWS = 12;

export default function HexGrid({
  fileSize,
  bytesPerRow,
  readRange,
  selection,
  onSelectionChange,
  jumpTarget, // { offset, nonce } - nonce so the same offset can be jumped to twice
}) {
  const listRef = useRef(null);
  const totalRows = Math.max(1, Math.ceil(fileSize / bytesPerRow));

  const [hoveredOffset, setHoveredOffset] = useState(null);
  const draggingRef = useRef(false);
  const dragAnchorRef = useRef(null);

  const handleByteDown = (offset) => {
    draggingRef.current = true;
    dragAnchorRef.current = offset;
    onSelectionChange({ start: offset, end: offset });
  };

  const handleByteEnter = (offset) => {
    setHoveredOffset(offset);
    if (draggingRef.current && dragAnchorRef.current !== null) {
      const anchor = dragAnchorRef.current;
      onSelectionChange({
        start: Math.min(anchor, offset),
        end: Math.max(anchor, offset),
      });
    }
  };

  useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  // Programmatic jumps use react-window's full virtual list coordinate space.
  useEffect(() => {
    if (!jumpTarget || !listRef.current) return;
    const targetRow = Math.floor(jumpTarget.offset / bytesPerRow);
    listRef.current.scrollToItem(targetRow, "center");
    onSelectionChange({ start: jumpTarget.offset, end: jumpTarget.offset });
  }, [jumpTarget, bytesPerRow, onSelectionChange]);

  const handleLeave = useCallback(() => setHoveredOffset(null), []);

  return (
    <div onMouseLeave={handleLeave} className="hexScroll overflow-hidden rounded border border-slate-800 bg-[#0f0d1d]">
      <List
        ref={listRef}
        height={VIEWPORT_HEIGHT}
        itemCount={totalRows}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={OVERSCAN_ROWS}
        itemData={{ bytesPerRow, fileSize, readRange, hoveredOffset, selection, onByteEnter: handleByteEnter, onByteDown: handleByteDown }}
        itemKey={(row) => row}
      >
        {({ index, style, data }) => {
          const rowOffset = index * data.bytesPerRow;
          return (
            <HexRow
              style={style}
              rowOffset={rowOffset}
              bytes={data.readRange(rowOffset, Math.min(data.bytesPerRow, data.fileSize - rowOffset))}
              hoveredOffset={data.hoveredOffset}
              selection={data.selection}
              onByteEnter={data.onByteEnter}
              onByteDown={data.onByteDown}
            />
          );
        }}
      </List>
    </div>
  );
}
