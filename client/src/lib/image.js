// Turn an uploaded image File into a compact base64 data URL. We downscale via
// canvas so a 4MB phone photo doesn't bloat the in-memory quiz / socket payload.
// Returns a data: URL string ready to store inline on the question.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image couldn't be loaded."));
    img.src = src;
  });
}

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB — reject before the FileReader allocates

export async function fileToDataURL(file, { maxDim = 1200, quality = 0.82 } = {}) {
  if (!file) throw new Error("No file selected.");
  if (!file.type?.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That image is too large — pick a file under 20 MB.");
  }

  const original = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("Couldn't read that file."));
    fr.readAsDataURL(file);
  });

  const img = await loadImage(original);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));

  // Small enough already — keep as-is (preserves PNG transparency, etc.).
  if (scale >= 1 && original.length < 350_000) return original;

  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
