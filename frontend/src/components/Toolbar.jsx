import { useState } from "react";

export default function Toolbar({
  bytesPerRow,
  onBytesPerRowChange,
  onJump,
  fileName,
}) {
  const [jumpValue, setJumpValue] = useState("");

  const handleJump = (e) => {
    e.preventDefault();
    // Accept plain decimal or 0x-prefixed hex.
    const parsed = jumpValue.trim().toLowerCase().startsWith("0x")
      ? parseInt(jumpValue, 16)
      : parseInt(jumpValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) onJump(parsed);
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-slate-800 bg-[#141227] text-sm">
      <span className="font-mono text-slate-300 truncate">
        {fileName ?? "No file selected"}
      </span>

      <div className="flex items-center gap-4">
        <form onSubmit={handleJump} className="flex items-center gap-2">
          <label className="text-slate-400">Go to offset</label>
          <input
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder="0x1000 or 4096"
            className="w-32 bg-[#0f0d1d] border border-slate-700 rounded px-2 py-1 font-mono text-xs text-slate-200 outline-none focus:border-themeColor"
          />
        </form>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Bytes/row</label>
          {[8, 16, 32].map((n) => (
            <button
              key={n}
              onClick={() => onBytesPerRowChange(n)}
              className={`px-2 py-1 rounded font-mono text-xs border ${
                bytesPerRow === n
                  ? "bg-themeColor border-themeColor text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
