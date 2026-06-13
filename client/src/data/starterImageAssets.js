/** Bundled starter WebP URLs — resolved by Vite at build time (works on Vercel /assets/). */

const modules = import.meta.glob("../assets/starter-images/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** @type {Record<string, string>} keys like `house-party/cover.webp` */
export const STARTER_IMAGE_URLS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.replace("../assets/starter-images/", ""),
    url,
  ]),
);

export function bundledStarterImageUrl(relativePath) {
  return STARTER_IMAGE_URLS[relativePath] ?? null;
}
