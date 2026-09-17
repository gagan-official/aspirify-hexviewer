# Large-file hex viewer

A React and Node.js hex viewer for files placed directly in the repository's `./data` directory. The backend serves bounded byte ranges with `fs.createReadStream`; it never reads an entire file into memory.

## Run it

Requirements: Node.js 18 or newer.

```sh
cd backend
npm install
npm start
```

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. Put files directly in `./data` at the repository root. Subdirectories are ignored.

If you want to put a **10GB** file, you can simply run this command in terminal:

```sh
cd data/ && fsutil file createnew test_10gb.dat 10737418240
```

You'll get an instant 10GB like file for testing.

## Architecture

- `backend/src/controllers/filesController.js` lists files and streams requested ranges from disk.
- `frontend/src/hooks/useChunkCache.js` fetches aligned 64 KiB chunks and keeps a bounded 256-chunk LRU cache.
- `react-window` renders only the visible rows plus a small overscan window. Changing bytes per row changes the list's row count without changing the fetch model.
- The inspector reads at most eight bytes around the selected offset and uses `BigInt` for `uint64` values.

The viewer intentionally does not create a whole-file buffer. Failed chunk requests remain unloaded and can be retried when the relevant rows are requested again.

## Scope note

`react-window` owns the scrollable virtual list and keeps the DOM bounded. Its normal browser scroll coordinate space still depends on the browser's maximum element height; a production viewer targeting files large enough to exceed that limit would need a library or custom scroll-coordinate adapter that supports segmented scrolling. The byte fetching and cache remain bounded independently of that UI limitation.
