export interface ImageRequestValidation {
  ok: boolean;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  error?: string;
  status?: 400 | 415;
}

export function validateImageRequest(contentType: string | undefined, body: unknown): ImageRequestValidation {
  const mimeType = contentType?.split(";")[0].trim().toLowerCase();
  if (mimeType !== "image/jpeg" && mimeType !== "image/png" && mimeType !== "image/webp") {
    return { ok: false, status: 415, error: "Unsupported image format. Use JPEG, PNG, or WebP." };
  }
  if (!Buffer.isBuffer(body) || body.length === 0) {
    return { ok: false, status: 400, error: "The uploaded image is empty. Choose another photo." };
  }

  const validSignature = mimeType === "image/jpeg"
    ? body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff
    : mimeType === "image/png"
      ? body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : body.length >= 12 && body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP";
  if (!validSignature) return { ok: false, status: 400, error: "The file contents do not match the selected image format." };
  return { ok: true, mimeType };
}
