import { useEffect, useMemo, useState } from "react";
import { getFiles } from "./api";
import { formatFileSize, readUint } from "./hexUtils";
import useChunkCache from "./hooks/useChunkCache";
import FileList from "./components/FileList";
import HexGrid from "./components/HexGrid";
import Toolbar from "./components/Toolbar";

function displayValue(value) {
  return value === null ? "Loading..." : value.toString();
}

function Inspector({ file, selectedOffset, readRange }) {
  const selectedBytes = selectedOffset === null ? [] : readRange(selectedOffset, 8);
  const selectedByte = selectedBytes[0];

  return (
    <aside className="w-72 shrink-0 border-l border-slate-800 bg-[#141227] p-4 text-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-100">Inspector</h2>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">File</dt>
          <dd className="truncate text-right text-slate-200">{file?.name ?? "None"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Size</dt>
          <dd className="text-slate-200">{file ? formatFileSize(file.size) : "-"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Offset</dt>
          <dd className="font-mono text-slate-200">
            {selectedOffset === null ? "-" : `0x${selectedOffset.toString(16)}`}
          </dd>
        </div>
      </dl>

      {selectedOffset !== null && (
        <div className="mt-6 space-y-5 font-mono text-xs">
          <section>
            <h3 className="mb-2 font-sans font-semibold text-slate-300">Selected byte</h3>
            <p className="text-slate-200">
              {selectedByte === null ? "Loading..." : `0x${selectedByte.toString(16).padStart(2, "0")}`}
            </p>
            <p className="mt-1 text-slate-400">
              ASCII: {selectedByte === null ? "Loading..." : selectedByte >= 0x20 && selectedByte <= 0x7e ? String.fromCharCode(selectedByte) : "."}
            </p>
          </section>
          <section>
            <h3 className="mb-2 font-sans font-semibold text-slate-300">Little-endian</h3>
            {[1, 2, 4, 8].map((size) => (
              <p key={size} className="flex justify-between gap-3 text-slate-400">
                <span>uint{size * 8}</span>
                <span className="text-right text-slate-200">{displayValue(readUint(selectedBytes, size, "le"))}</span>
              </p>
            ))}
          </section>
          <section>
            <h3 className="mb-2 font-sans font-semibold text-slate-300">Big-endian</h3>
            {[1, 2, 4, 8].map((size) => (
              <p key={size} className="flex justify-between gap-3 text-slate-400">
                <span>uint{size * 8}</span>
                <span className="text-right text-slate-200">{displayValue(readUint(selectedBytes, size, "be"))}</span>
              </p>
            ))}
          </section>
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [bytesPerRow, setBytesPerRow] = useState(16);
  const [selection, setSelection] = useState(null);
  const [jumpTarget, setJumpTarget] = useState(null);
  const [error, setError] = useState("");
  const { readRange } = useChunkCache(file?.id);

  useEffect(() => {
    getFiles().then(setFiles).catch((err) => setError(err.message));
  }, []);

  const selectedFile = useMemo(
    () => files.find((entry) => entry.id === file?.id) ?? file,
    [files, file],
  );

  const handleFileSelect = (nextFile) => {
    setFile(nextFile);
    setSelection(null);
    setJumpTarget(null);
    setError("");
  };

  const handleJump = (offset) => {
    if (!selectedFile) return;
    const safeOffset = Math.min(offset, Math.max(0, selectedFile.size - 1));
    setJumpTarget({ offset: safeOffset, nonce: Date.now() });
  };

  return (
    <main className="min-h-screen bg-[#0f0d1d] text-slate-200">
      <header className="border-b border-slate-800 px-5 py-4">
        <h1 className="text-xl font-semibold text-white">Hex viewer</h1>
        <p className="mt-1 text-xs text-slate-500">Inspect raw bytes without loading the whole file.</p>
      </header>
      <div className="flex min-h-[calc(100vh-81px)]">
        <FileList files={files} selectedFileId={file?.id} onSelect={handleFileSelect} />
        <section className="min-w-0 flex-1">
          {error && <p className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
          {!selectedFile ? (
            <div className="p-8 text-sm text-slate-500">Select a file to begin.</div>
          ) : (
            <>
              <Toolbar
                bytesPerRow={bytesPerRow}
                onBytesPerRowChange={setBytesPerRow}
                onJump={handleJump}
                fileName={selectedFile.name}
              />
              <div className="p-4">
                <HexGrid
                  fileSize={selectedFile.size}
                  bytesPerRow={bytesPerRow}
                  readRange={readRange}
                  selection={selection}
                  onSelectionChange={setSelection}
                  jumpTarget={jumpTarget}
                />
              </div>
            </>
          )}
        </section>
        <Inspector file={selectedFile} selectedOffset={selection?.start ?? null} readRange={readRange} />
      </div>
    </main>
  );
}