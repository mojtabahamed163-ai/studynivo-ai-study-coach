export type MaterialKind = "pdf" | "docx" | "image" | "audio";

export const MAX_MATERIAL_BYTES = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

export function sanitizeMaterialName(name: string) {
  const leaf = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const normalized = leaf.normalize("NFKC");
  const safe = normalized
    .replace(/[^\p{L}\p{N}._() -]/gu, "_")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 160);
  if (!safe || safe === "." || safe === "..")
    throw new Error("INVALID_FILE_NAME");
  return safe;
}

export function decodeBase64Payload(
  payload: string,
  kind: MaterialKind,
  mimeType: string
) {
  let clean = payload;
  const dataUrl = /^data:([^;,]+);base64,(.*)$/s.exec(payload);
  if (payload.startsWith("data:") && !dataUrl)
    throw new Error("INVALID_BASE64_PAYLOAD");
  if (dataUrl) {
    if (dataUrl[1].toLowerCase() !== mimeType.toLowerCase())
      throw new Error("FILE_MIME_MISMATCH");
    clean = dataUrl[2];
  }
  const validBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!clean || clean.length % 4 !== 0 || !validBase64.test(clean))
    throw new Error("INVALID_BASE64_PAYLOAD");
  const data = Buffer.from(clean, "base64");
  const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_MATERIAL_BYTES;
  if (!data.length || data.length > maxBytes)
    throw new Error("FILE_TOO_LARGE_OR_EMPTY");
  if (data.toString("base64") !== clean)
    throw new Error("INVALID_BASE64_PAYLOAD");
  return data;
}

export function hasExpectedSignature(
  data: Buffer,
  kind: MaterialKind,
  mimeType: string
) {
  if (kind === "pdf") return data.subarray(0, 5).toString("ascii") === "%PDF-";
  if (kind === "docx") return data.subarray(0, 4).toString("hex") === "504b0304";
  if (kind === "image") {
    if (mimeType === "image/png")
      return data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    if (mimeType === "image/jpeg")
      return data.subarray(0, 3).toString("hex") === "ffd8ff";
    if (mimeType === "image/webp")
      return (
        data.subarray(0, 4).toString("ascii") === "RIFF" &&
        data.subarray(8, 12).toString("ascii") === "WEBP"
      );
    return false;
  }
  if (kind === "audio") {
    if (mimeType === "audio/mpeg")
      return (
        data.subarray(0, 3).toString("ascii") === "ID3" ||
        (data.length > 1 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0)
      );
    if (mimeType === "audio/wav")
      return (
        data.subarray(0, 4).toString("ascii") === "RIFF" &&
        data.subarray(8, 12).toString("ascii") === "WAVE"
      );
    if (mimeType === "audio/ogg")
      return data.subarray(0, 4).toString("ascii") === "OggS";
    if (mimeType === "audio/webm")
      return data.subarray(0, 4).toString("hex") === "1a45dfa3";
    if (mimeType === "audio/mp4")
      return data.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return false;
}
