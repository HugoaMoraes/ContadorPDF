const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const csv = require("fast-csv");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { files: 100 }, // Limite de 100 arquivos
});

app.use(express.static("public"));
app.use(express.static(__dirname)); // Para servir arquivos estáticos como o CSV

async function getPdfPageCount(filePath) {
  const data = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(data);
  return pdfDoc.getPageCount();
}

// Middleware para verificar o número de arquivos
function checkFileCount(req, res, next) {
  if (req.files && req.files.length > 100) {
    return res
      .status(400)
      .json({ error: "Número máximo de 100 PDFs excedido" });
  }
  next();
}

app.post(
  "/upload",
  upload.array("pdfs", 100),
  checkFileCount,
  async (req, res) => {
    const files = req.files;

    // Processamento dos arquivos em paralelo
    const results = await Promise.all(
      files.map(async (file) => {
        const pageCount = await getPdfPageCount(file.path);
        return { fileName: file.originalname, pageCount };
      })
    );

    const totalPageCount = results.reduce(
      (acc, result) => acc + result.pageCount,
      0
    );

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

      // Remover arquivos temporários em paralelo
      Promise.all(files.map((file) => fs.remove(file.path))).catch((err) =>
        console.error("Erro ao remover arquivos temporários", err)
      );
    });
  }
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});
