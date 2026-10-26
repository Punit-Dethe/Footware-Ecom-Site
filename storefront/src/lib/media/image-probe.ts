/**
 * Dependency-free image header probe for JPEG, PNG, WebP and AVIF.
 *
 * Used to validate admin uploads when the native `sharp` module cannot be
 * loaded on the server. It reads only the container headers (format + pixel
 * dimensions); it does not decode pixels.
 */
export type ProbedFormat = "jpeg" | "png" | "webp" | "avif";

export interface ProbedImage {
  format: ProbedFormat;
  width: number;
  height: number;
}

function probePng(buf: Buffer): ProbedImage | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || !sig.every((b, i) => buf[i] === b)) return null;
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { format: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function probeJpeg(buf: Buffer): ProbedImage | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // Padding / standalone markers without a length field.
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { format: "jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

function probeWebp(buf: Buffer): ProbedImage | null {
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      format: "webp",
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { format: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { format: "webp", width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  }
  return null;
}

function probeAvif(buf: Buffer): ProbedImage | null {
  if (buf.length < 16 || buf.toString("ascii", 4, 8) !== "ftyp") return null;
  const ftypSize = buf.readUInt32BE(0);
  const brands = buf.toString("ascii", 8, Math.min(ftypSize, buf.length));
  if (!brands.includes("avif") && !brands.includes("avis")) return null;
  // 'ispe' box: size(4) 'ispe'(4) version/flags(4) width(4) height(4)
  const idx = buf.indexOf("ispe", 0, "ascii");
  if (idx < 4 || idx + 16 > buf.length) return null;
  return { format: "avif", width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) };
}

export function probeImage(buf: Buffer): ProbedImage | null {
  try {
    const result = probePng(buf) ?? probeJpeg(buf) ?? probeWebp(buf) ?? probeAvif(buf);
    if (!result || result.width <= 0 || result.height <= 0) return null;
    return result;
  } catch {
    return null;
  }
}
