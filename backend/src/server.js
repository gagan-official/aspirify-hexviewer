const express = require("express");
const cors = require("cors");
const filesRoutes = require("./routes/filesRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/files", filesRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Hex viewer backend running on port", PORT);
  });
}

module.exports = app;