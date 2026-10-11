"use client";

import { getBrowserSupabase } from "./supabase/client";

const BUCKET = "product-images";
const MAX_SIDE = 1600;

/** Resizes a phone photo (often 4–8MB) to a web-friendly JPEG before upload. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  if (file.size > 25 * 1024 * 1024) throw new Error("TOO_LARGE");
  const blob = await compress(file);
  const path = `products/${crypto.randomUUID()}.jpg`;
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Deletes an uploaded image from storage. Bundled images (/products/...) are left alone. */
export async function removeStoredImage(url: string | null) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  await getBrowserSupabase().storage.from(BUCKET).remove([url.slice(i + marker.length)]);
}
