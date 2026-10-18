import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ALLOWED_MIME, MAX_FILE_SIZE } from "./constants";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Format file harus JPG atau PNG, maksimal 5MB" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Format file harus JPG atau PNG, maksimal 5MB" };
  }
  return { ok: true };
}

export async function saveUpload(file: File): Promise<string> {
  ensureUploadDir();
  const ext = file.type === "image/png" ? ".png" : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filepath, buffer);
  return filename;
}

export function getUploadPath(filename: string): string {
  // Prevent path traversal
  const safe = path.basename(filename);
  return path.join(UPLOAD_DIR, safe);
}
