const router = require("express").Router();
const {
  getAllFiles,
  getFileMeta,
  getFileChunk,
} = require("../controllers/filesController");

router.get("/", getAllFiles);
router.get("/:id/meta", getFileMeta);
router.get("/:id/chunk", getFileChunk);

module.exports = router;