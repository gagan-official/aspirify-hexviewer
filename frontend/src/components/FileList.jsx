import { formatFileSize } from "../hexUtils";

export default function FileList({
  files,
  selectedFileId,
  onSelect,
  loading,
  error,
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#141227] flex flex-col">
      <h2 className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-800">
        Files in ./data
      </h2>

      {loading && (
        <p className="px-4 py-3 text-sm text-slate-500">Loading...</p>
      )}
      {error && <p className="px-4 py-3 text-sm text-red-400">{error}</p>}
      {!loading && !error && files.length === 0 && (
        <p className="px-4 py-3 text-sm text-slate-500">
          No files found. Drop something into the backend's ./data folder.
        </p>
      )}

      <ul className="overflow-y-auto">
        {files.map((file) => (
          <li key={file.id}>
            <button
              onClick={() => onSelect(file)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800/60 transition-colors hover:bg-themeColor/10 ${
                selectedFileId === file.id
                  ? "bg-themeColor/20 text-white"
                  : "text-slate-300"
              }`}
            >
              <div className="truncate font-mono text-sm">{file.name}</div>
              <div className="text-xs text-slate-500">
                {formatFileSize(file.size)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
