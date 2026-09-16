const path = require("path");

// The whole app only ever serves files that live directly inside DATA_DIR.
// This is intentionally hardcoded per the assignment (no CLI flag / env var).
const DATA_DIR = path.join(__dirname, "..", "..", "data");

// We use the file's own name as its "id" (URL-encoded on the way out and
// decoded by Express on the way in). Directory parts are rejected, so a
// request can only address one direct child of DATA_DIR.
function resolveSafePath(id) {
  if (!id || path.basename(id) !== id) return null;
  return path.join(DATA_DIR, id);
}

module.exports = { DATA_DIR, resolveSafePath };