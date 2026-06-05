/**
 * @file pdfParser.service.ts
 * @description Service zur clientseitigen PDF-Textextraktion.
 * Verwendet pdfjs-dist (browser-kompatibel, kein Node.js erforderlich).
 *
 * @example
 * const text = await extractTextFromPdf(file);
 */

import * as pdfjsLib from "pdfjs-dist";
// Vite resolves ?url to the bundled asset path at build time
// @ts-ignore
import PDFWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorkerUrl;

/**
 * Extrahiert den Volltext aus einer PDF-Datei.
 * @param file - Die vom Nutzer hochgeladene PDF-Datei
 * @returns Der extrahierte Rohtext aller Seiten
 * @throws {Error} Wenn das PDF nicht gelesen werden kann
 */
export async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n");
}

/**
 * Extrahiert den Volltext aus mehreren PDF-Dateien parallel.
 * @param files - Array von PDF-Dateien (max. 3)
 * @returns Array von Dokumenten mit Name und extrahiertem Text
 */
export async function parseMultiplePdfs(
  files: File[]
): Promise<{ name: string; text: string }[]> {
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      text: await parsePdf(file),
    }))
  );
}
