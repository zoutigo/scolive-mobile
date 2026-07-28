export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function extractImageUrls(html: string): string[] {
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    if (match[1]) {
      urls.push(match[1]);
    }
    match = regex.exec(html);
  }
  return urls;
}
