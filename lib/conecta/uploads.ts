import { z } from "zod"

const MiB = 1024 * 1024
export const uploadTotalLimit = 50 * MiB
export const uploadLimits = {
  "image/jpeg": 10 * MiB, "image/png": 10 * MiB, "image/webp": 10 * MiB,
  "application/pdf": 15 * MiB, "video/mp4": 50 * MiB, "video/webm": 50 * MiB,
} as const
export const uploadMime = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "video/webm"])
export type UploadMime = z.infer<typeof uploadMime>
export function evidenceMetadata(file: { name: string; type: string; size: number }) {
  const extensions: Record<string, UploadMime> = {
    pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", mp4: "video/mp4", webm: "video/webm",
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return { mime: !file.type || file.type === "application/octet-stream" ? extensions[extension] ?? file.type : file.type, bytes: file.size }
}
const fileSchema = z.object({ mime: uploadMime, bytes: z.number().int().positive() })
  .refine(file => file.bytes <= uploadLimits[file.mime], "Comprovante acima do limite.")
export const uploadRequestSchema = z.object({
  files: z.array(fileSchema).max(5).refine(files => files.reduce((sum, file) => sum + file.bytes, 0) <= uploadTotalLimit, "Os comprovantes excedem 50 MB no total."),
}).strict()
export const uploadManifestSchema = z.array(z.object({ id: z.string().uuid(), path: z.string(), mime: uploadMime, bytes: z.number().int().positive() })).max(5)
  .refine(files => files.reduce((sum, file) => sum + file.bytes, 0) <= uploadTotalLimit, "Os comprovantes excedem 50 MB no total.")

export function matchesUploadSignature(mime: UploadMime, bytes: Uint8Array) {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte)
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  switch (mime) {
    case "image/jpeg": return starts(255,216,255)
    case "image/png": return starts(137,80,78,71,13,10,26,10)
    case "image/webp": return ascii(0,4) === "RIFF" && ascii(8,12) === "WEBP"
    case "application/pdf": return ascii(0,5) === "%PDF-"
    case "video/mp4": return ascii(4,8) === "ftyp"
    case "video/webm": return starts(26,69,223,163) && ascii(0,Math.min(bytes.length,4096)).includes("webm")
  }
}
