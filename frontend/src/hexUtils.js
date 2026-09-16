export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatOffset(offset) {
  return offset.toString(16).padStart(10, "0");
}

export function byteToHex(byte) {
  return byte === null || byte === undefined
    ? ".."
    : byte.toString(16).padStart(2, "0");
}

export function byteToAscii(byte) {
  if (byte === null || byte === undefined) return " ";
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : ".";
}

// Reads an unsigned integer of `byteCount` bytes out of `bytes` (an array
// that may contain nulls for not-yet-loaded data) starting at index 0,
// in the given endianness. Returns null if any needed byte is missing.
export function readUint(bytes, byteCount, endianness) {
  if (bytes.length < byteCount) return null;
  const slice = bytes.slice(0, byteCount);
  if (slice.some((b) => b === null || b === undefined)) return null;

  const ordered = endianness === "le" ? [...slice].reverse() : slice;
  // BigInt keeps this correct for uint64, which overflows a normal Number.
  let value = 0n;
  for (const byte of ordered) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}