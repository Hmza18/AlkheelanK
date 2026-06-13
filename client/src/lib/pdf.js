// Lazy in-browser PDF text extraction. pdfjs-dist is heavy (~1 MB) and only
// needed when a host actually imports a PDF, so it's dynamically imported here
// to keep it out of the main bundle.

const MAX_PAGES = 40;
const MAX_CHARS = 25000;

let workerReady = false;

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerReady) {
    // Vite bundles the worker and gives us a URL for it.
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    workerReady = true;
  }
  return pdfjsLib;
}

/** Extract plain text from a PDF File/Blob. Caps pages + length for sanity. */
export async function extractPdfText(file) {
  const pdfjsLib = await loadPdfjs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = Math.min(pdf.numPages, MAX_PAGES);
  let text = "";
  for (let i = 1; i <= pages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
    if (text.length >= MAX_CHARS) break;
  }
  return text.trim();
}
