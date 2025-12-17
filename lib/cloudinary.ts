const CLOUDINARY_URL = process.env.NEXT_PUBLIC_CLOUDINARY_URL;

export function getCloudinaryUrl(fileName: string, fileType: string) {
  return `${CLOUDINARY_URL}/${fileType}/upload/${fileName}`;
}