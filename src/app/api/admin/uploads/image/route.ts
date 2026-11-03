import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const maxImageSize = 5 * 1024 * 1024;
const multipartOverheadLimit = 64 * 1024;

function getImageType(bytes: Buffer) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  if (
    bytes.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))
  ) {
    return { extension: "gif", contentType: "image/gif" };
  }

  return null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > maxImageSize + multipartOverheadLimit
  ) {
    return Response.json(
      { error: "Görsel boyutu en fazla 5 MB olabilir." },
      { status: 413 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Yüklenecek bir görsel seçin." }, { status: 400 });
  }
  if (file.size > maxImageSize) {
    return Response.json(
      { error: "Görsel boyutu en fazla 5 MB olabilir." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const imageType = getImageType(bytes);
  if (!imageType) {
    return Response.json(
      { error: "PNG, JPEG, WebP veya GIF biçiminde geçerli bir görsel yükleyin." },
      { status: 415 },
    );
  }

  const fileName = `${randomUUID()}.${imageType.extension}`;
  const uploadDirectory = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(join(uploadDirectory, fileName), bytes, {
    flag: "wx",
    mode: 0o644,
  });

  return Response.json(
    {
      imageUrl: `/uploads/${fileName}`,
      contentType: imageType.contentType,
    },
    { status: 201 },
  );
}
