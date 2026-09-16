const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { DATA_DIR, resolveSafePath } = require("../pathSafety");

// GET /api/files
// Lists every plain file directly inside ./data (no walking into subfolders,
// per the task). We stat each one just to grab its size for the list -
// that's a handful of cheap syscalls, nothing to do with file content.
const getAllFiles = async (req, res) => {
  try {
    const entries = await fsp.readdir(DATA_DIR, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const stat = await fsp.stat(path.join(DATA_DIR, entry.name));
          return {
            id: encodeURIComponent(entry.name),
            name: entry.name,
            size: stat.size,
          };
        })
    );
    res.json(files);
  } catch (error) {
    // If ./data doesn't exist yet, don't blow up - just say "nothing here".
    if (error.code === "ENOENT") return res.json([]);
    console.error(error);
    res.status(500).send("Could not read the data directory.");
  }
};

// GET /api/files/:id/meta
const getFileMeta = async (req, res) => {
  const filePath = resolveSafePath(req.params.id);
  if (!filePath) return res.status(400).send("Invalid file id.");
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return res.status(404).send("Not a file.");
    res.json({ name: path.basename(filePath), size: stat.size });
  } catch (error) {
    if (error.code === "ENOENT") return res.status(404).send("File not found.");
    console.error(error);
    res.status(500).send("Could not read file metadata.");
  }
};

// GET /api/files/:id/chunk?offset=&length=
// The one endpoint that actually matters for the "10GB must be as fast as
// 10KB" requirement. We never call fs.readFile here - fs.createReadStream
// with {start, end} asks the OS to hand us just that byte range, and we
// pipe it straight to the response. Memory used is roughly the size of the
// stream's internal buffer (a few dozen KB), not the size of the chunk,
// and definitely not the size of the file.
const getFileChunk = async (req, res) => {
  const filePath = resolveSafePath(req.params.id);
  if (!filePath) return res.status(400).send("Invalid file id.");
  const offset = Number(req.query.offset);
  const requestedLength = Number(req.query.length);

  if (!Number.isInteger(offset) || offset < 0) {
    return res.status(400).send("offset must be a non-negative integer.");
  }
  if (!Number.isInteger(requestedLength) || requestedLength <= 0) {
    return res.status(400).send("length must be a positive integer.");
  }

  try {
    const stat = await fsp.stat(filePath);
    if (offset >= stat.size) {
      // Asking past end of file isn't an error, it's just an empty read.
      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Length", "0");
      return res.end();
    }

    // Clamp so a chunk request can never read past the end of the file.
    const clampedLength = Math.min(requestedLength, stat.size - offset);
    const end = offset + clampedLength - 1; // createReadStream's `end` is inclusive

    res.set("Content-Type", "application/octet-stream");
    res.set("Content-Length", String(clampedLength));

    const stream = fs.createReadStream(filePath, { start: offset, end });
    stream.on("error", (err) => {
      console.error(err);
      if (!res.headersSent) res.status(500);
      res.end();
    });
    stream.pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") return res.status(404).send("File not found.");
    console.error(error);
    res.status(500).send("Could not read the requested byte range.");
  }
};

module.exports = { getAllFiles, getFileMeta, getFileChunk };