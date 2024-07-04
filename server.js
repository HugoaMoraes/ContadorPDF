const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const csv = require("fast-csv");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.use(express.static(__dirname)); // Para servir arquivos estáticos como o CSV

async function getPdfPageCount(filePath) {
  const data = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(data);
  return pdfDoc.getPageCount();
}

app.post("/upload", upload.array("pdfs", 10), async (req, res) => {
  const files = req.files;
  const results = [];
  let totalPageCount = 0;

  for (const file of files) {
    const pageCount = await getPdfPageCount(file.path);
    results.push({ fileName: file.originalname, pageCount });
    totalPageCount += pageCount;
  }

  const csvPath = path.join(__dirname, "pdf_page_counts.csv");
  const ws = fs.createWriteStream(csvPath, { encoding: "utf8" });

  // Write BOM to ensure UTF-8 encoding is recognized
  ws.write("\uFEFF");

  csv.write(results, { headers: true }).pipe(ws);

  ws.on("finish", () => {
    res.json({
      totalPdfs: results.length,
      totalPageCount,
      csvPath: "/pdf_page_counts.csv",
    });
    files.forEach((file) => fs.remove(file.path));
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});
