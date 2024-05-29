import express from "express";
import multer from "multer";
import path from "path";
import { generateQRCodes } from "./qrGenerator.mjs";

import { fileURLToPath } from "url";

const app = express();

const upload = multer({ dest: "uploads/" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const zipPath = await generateQRCodes(filePath);
  res.download(zipPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
