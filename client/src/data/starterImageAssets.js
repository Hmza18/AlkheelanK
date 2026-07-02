/** Starter WebP images bundled at build time → /assets/*.webp (no query string). */

const modules = import.meta.glob("../assets/starter-images/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** @type {Record<string, string>} keys like `house-party/0.webp` */
export const STARTER_IMAGE_URLS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.replace("../assets/starter-images/", ""),
    String(url).split("?")[0],
  ]),
);

export const STARTER_IMAGE_COUNT = Object.keys(STARTER_IMAGE_URLS).length;

export function bundledStarterImageUrl(relativePath) {
  return STARTER_IMAGE_URLS[relativePath] ?? null;
}
