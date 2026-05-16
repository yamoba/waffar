import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { config } from "../config";
import { authenticate } from "../middleware/auth";
import { AppError } from "../middleware/error";

export const uploadRouter = Router();

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
  forcePathStyle: true,
});

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(400, "Only JPEG, PNG, WebP, and GIF images are allowed") as any);
  },
});

uploadRouter.post("/image", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, "No file provided");

  const buffer = await sharp(req.file.buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `uploads/${uuid()}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: "image/webp",
  }));

  const url = `${config.s3.endpoint}/${config.s3.bucket}/${key}`;
  res.json({ url, key });
});

uploadRouter.post("/receipt", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, "No file provided");

  const buffer = await sharp(req.file.buffer)
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const key = `receipts/${req.user!.id}/${uuid()}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: "image/webp",
  }));

  const url = `${config.s3.endpoint}/${config.s3.bucket}/${key}`;

  try {
    const ocrResponse = await fetch(`${config.ai.serviceUrl}/api/ocr-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const ocrResult = await ocrResponse.json();
    res.json({ url, key, analysis: ocrResult });
  } catch {
    res.json({ url, key, analysis: null });
  }
});
