export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function generateProductSlug(title: string, brand?: string): string {
  const parts = [brand, title].filter(Boolean).join(" ");
  const base = slugify(parts);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
