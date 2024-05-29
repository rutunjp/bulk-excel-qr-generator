import {
  createWriteStream,
  writeFileSync,
  createReadStream,
  writeFile,
} from "fs";
import { join } from "path";
import { toDataURL } from "qrcode";
import XLSX from "xlsx"; // Using default import for xlsx

import { PDFDocument, rgb } from "pdf-lib";
import archiver from "archiver";

export async function generateQRCodes(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const participants = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const zipFilePath = join("public", "qrcodes.zip");
  const output = createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 2 } });

  archive.pipe(output);

  for (const [index, participant] of participants.entries()) {
    const qrText = JSON.stringify({ id: index + 1, ...participant });
    const qrImageData = await toDataURL(qrText);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([200, 200]);
    const qrImage = await pdfDoc.embedPng(qrImageData);
    const qrDims = qrImage.scale(0.5);

    page.drawImage(qrImage, {
      x: page.getWidth() / 2 - qrDims.width / 2,
      y: page.getHeight() / 2 - qrDims.height / 2,
      width: qrDims.width,
      height: qrDims.height,
    });

    page.drawText(`Name: ${participant.Name}`, {
      x: 20,
      y: page.getHeight() - 180,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Name2:Name-${index}`, {
      x: 20,
      y: page.getHeight() - 200,
      size: 12,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Pass No: ${index + 1}`, {
      x: 20,
      y: page.getHeight() - 220,
      size: 12,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const fileName = `QR_${index + 1}.pdf`;
    const filePath = join("public", fileName);

    writeFileSync(filePath, pdfBytes);
    writeFile("public/", pdfBytes);
    archive.on("error", function (err) {
      throw err;
    });
    archive.append(createReadStream(filePath), { name: fileName });
  }

  await archive.finalize();
  return zipFilePath;
}
