import sharp from "sharp";
import { PDFDocument, PDFName } from "pdf-lib";
import path from "path";
import os from "os";
import { writeFile, readFile, unlink, rm, copyFile } from "fs/promises";
import { mkdirSync, existsSync, createWriteStream } from "fs";
import { randomUUID } from "crypto";
import archiver from "archiver";
import extract from "extract-zip";
import { spawn } from "child_process";
import { NextResponse } from "next/server";
const ffmpegPath = eval("require('ffmpeg-static')");

async function compressVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            "-i",
            inputPath,
            "-vcodec",
            "libx264",
            "-crf",
            "28",
            "-preset",
            "fast",
            "-acodec",
            "aac",
            "-b:a",
            "128k",
            outputPath,
        ]);

        ffmpeg.stderr.on("data", (data) => {
            console.error(`ffmpeg stderr: ${data}`);
        });

        ffmpeg.on("error", async (err) => {
            if (err.code === "ENOENT") {
                console.error("ffmpeg not found. Skipping compression.");
                try {
                    await copyFile(inputPath, outputPath);
                    resolve();
                } catch (copyErr) {
                    reject(copyErr);
                }
            } else {
                reject(err);
            }
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });
    });
}


export async function POST(req) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const tempRoot = path.join(process.cwd(), "temp");

    if (!existsSync(tempRoot)) mkdirSync(tempRoot);

    let finalBuffer;

    try {
        if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
            // Image compression
            const image = sharp(buffer);

            if (extension === "png") {
                finalBuffer = await image.png({ quality: 60 }).toBuffer();
            } else {
                finalBuffer = await image.jpeg({ quality: 50 }).toBuffer();
            }
        } else if (["mp4", "mov", "mkv", "avi"].includes(extension)) {
            const tempInputPath = path.join(tempRoot, `${randomUUID()}.${extension}`);
            const tempOutputPath = path.join(
                tempRoot,
                `${randomUUID()}-compressed.${extension}`
            );

            await writeFile(tempInputPath, buffer);

            try {
                await compressVideo(tempInputPath, tempOutputPath);
                finalBuffer = await readFile(tempOutputPath);
            } catch (e) {
                console.error("Video processing failed:", e);
                finalBuffer = buffer;
            } finally {
                await Promise.allSettled([
                    unlink(tempInputPath).catch(console.error),
                    unlink(tempOutputPath).catch(console.error),
                ]);
            }
        } else if (extension === "pdf") {
            // PDF compression by re-embedding images at lower quality
            const pdfDoc = await PDFDocument.load(buffer);
            const pages = pdfDoc.getPages();

            for (const page of pages) {
                const xObject = page.node.Resources()?.lookup(PDFName.of("XObject"));
                if (xObject) {
                    for (const key of xObject.keys()) {
                        const imgRef = xObject.get(key);
                        if (!imgRef?.dict) continue;

                        const filter = imgRef.dict.lookup(PDFName.of("Filter"));
                        if (!filter) continue;

                        // Extract raw image data
                        const imgData = imgRef.contents;

                        if (!imgData) continue;

                        // Compress image data via sharp
                        try {
                            const compressedImgBuffer = await sharp(imgData).jpeg({ quality: 50 }).toBuffer();
                            const embeddedImage = await pdfDoc.embedJpg(compressedImgBuffer);
                            page.drawImage(embeddedImage, {
                                x: 0,
                                y: 0,
                                width: page.getWidth(),
                                height: page.getHeight(),
                            });
                        } catch (e) {
                            // ignore image compress errors to avoid breaking entire PDF compression
                            console.warn("Failed compressing image in PDF page:", e);
                        }
                    }
                }
            }

            finalBuffer = Buffer.from(await pdfDoc.save());

        } else if (extension === "zip") {
            // ZIP: save to disk → extract → recompress → read back → cleanup

            // Create temp paths
            const tempFolder = path.join(tempRoot, randomUUID());
            const tempUploadedZipPath = path.join(tempRoot, `${randomUUID()}.zip`);
            const recompressedZipPath = path.join(tempRoot, `${randomUUID()}-compressed.zip`);

            // Save uploaded ZIP
            await writeFile(tempUploadedZipPath, buffer);

            // Extract ZIP
            await extract(tempUploadedZipPath, { dir: tempFolder });

            // Recompress extracted folder
            await new Promise((resolve, reject) => {
                const output = createWriteStream(recompressedZipPath);
                const archive = archiver("zip", { zlib: { level: 9 } });

                output.on("close", resolve);
                archive.on("error", reject);

                archive.pipe(output);
                archive.directory(tempFolder, false);
                archive.finalize();
            });

            // Read recompressed zip
            finalBuffer = await readFile(recompressedZipPath);

            // Cleanup
            await unlink(tempUploadedZipPath);
            await unlink(recompressedZipPath);
            await rm(tempFolder, { recursive: true, force: true });

        } else {
            // Other unsupported file types
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        // Prepare MIME type for response
        const mimeType =
            extension === "zip"
                ? "application/zip"
                : extension === "pdf"
                    ? "application/pdf"
                    : ["png"].includes(extension)
                        ? "image/png"
                        : ["jpg", "jpeg", "webp"].includes(extension)
                            ? "image/jpeg"
                            : "application/octet-stream";

        // Return compressed file buffer as response with correct headers
        return new NextResponse(finalBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename=compressed-${file.name}`,
            },
        });
    } catch (error) {
        console.error("Compression error:", error);
        return NextResponse.json({ error: "Failed to compress file" }, { status: 500 });
    }
}
