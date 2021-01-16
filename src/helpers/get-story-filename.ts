export function getStoryFilename(url: string): string {
  return url.split('/').splice(-1)[0] + '.docx';
}
