export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(ext);
}

export function getFileName(path: string): string {
  return path.split('/').pop() || '';
}

export function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}
