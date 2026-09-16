import { formatOffset, byteToHex, byteToAscii } from "../hexUtils";

function isSelected(offset, selection) {
  return selection && offset >= selection.start && offset <= selection.end;
}

export default function HexRow({
  style,
  rowOffset,
  bytes,
  hoveredOffset,
  selection,
  onByteEnter,
  onByteDown,
}) {
  return (
    <div style={style} className="flex items-center font-mono text-sm leading-5 h-5 whitespace-nowrap select-none">
      <span className="text-slate-500 w-28 shrink-0">
        {formatOffset(rowOffset)}
      </span>

      <span className="flex gap-1 pr-4">
        {bytes.map((byte, i) => {
          const offset = rowOffset + i;
          const hovered = hoveredOffset === offset;
          const selected = isSelected(offset, selection);
          return (
            <span
              key={offset}
              onMouseEnter={() => onByteEnter(offset)}
              onMouseDown={() => onByteDown(offset)}
              className={`w-[1.15rem] text-center cursor-default rounded-sm ${
                selected
                  ? "bg-themeColor text-white"
                  : hovered
                    ? "bg-slate-600 text-white"
                    : "text-slate-300"
              }`}
            >
              {byteToHex(byte)}
            </span>
          );
        })}
      </span>

      <span className="flex text-slate-400">
        {bytes.map((byte, i) => {
          const offset = rowOffset + i;
          const hovered = hoveredOffset === offset;
          const selected = isSelected(offset, selection);
          return (
            <span
              key={offset}
              onMouseEnter={() => onByteEnter(offset)}
              onMouseDown={() => onByteDown(offset)}
              className={`w-[0.65rem] text-center cursor-default rounded-sm ${
                selected
                  ? "bg-themeColor text-white"
                  : hovered
                    ? "bg-slate-600 text-white"
                    : ""
              }`}
            >
              {byteToAscii(byte)}
            </span>
          );
        })}
      </span>
    </div>
  );
}
