import path from "path";
import fs from "fs/promises";

export function generateNewImageNames(files) {
  let newMainImage = undefined;
  const newGallery = [];

  const timestamp = Date.now();

  if (files?.mainImage?.[0]) {
    newMainImage = `/uploads/events/event_main_${timestamp}.png`;
  }

  if (files?.gallery?.length) {
    for (let i = 0; i < files.gallery.length; i++) {
      const random = Math.floor(Math.random() * 100000);
      const galleryImage = `/uploads/events/event_gallery_${timestamp}_${random}.png`;
      newGallery.push(galleryImage);
    }
  }

  return { newMainImage, newGallery };
}

/**
 * Presunie súbory z TMP do finálnej cesty
 * @param {Array} files - objekt z req.files
 * @param {String} newMainImage - cieľová cesta pre main image (absolútna alebo relatívna)
 * @param {Array} newGallery - zoznam cieľových ciest pre galériu
 */
export async function moveUploadedImages(files, newMainImage, newGallery) {
  const moves = [];

  if (files?.mainImage?.[0] && newMainImage) {
    const tempPath = files.mainImage[0].path;
    const finalPath = path.join(".", newMainImage);
    moves.push(fs.rename(tempPath, finalPath));
  }

  if (files?.gallery?.length && newGallery.length) {
    for (let i = 0; i < files.gallery.length; i++) {
      const tempPath = files.gallery[i].path;
      const finalPath = path.join(".", newGallery[i]);
      moves.push(fs.rename(tempPath, finalPath));
    }
  }

  await Promise.all(moves);
}

export async function deleteFiles(filePaths) {
  if (!Array.isArray(filePaths)) return;

  for (const filePath of filePaths) {
    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }
  }
}
