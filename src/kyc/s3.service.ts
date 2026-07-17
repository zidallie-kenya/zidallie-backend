import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileKey = `${folder}/${uuidv4()}-${file.originalname}`;

    console.log(
      `[S3] Attempting upload: ${file.originalname} (${file.mimetype}) to ${fileKey}`,
    );

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ContentDisposition: 'inline' allows browsers to view PDFs instead of downloading
          ContentDisposition: 'inline',
        }),
      );

      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      console.log(`[S3] Upload Success: ${url}`);
      return url;
    } catch (error) {
      // Detailed error logging
      console.error(`[S3] Upload Failed for file: ${file.originalname}`);
      console.error(`[S3] Error Message: ${error.message}`);
      console.error(`[S3] AWS Request ID: ${error.$metadata?.requestId}`);

      // Console log the full error for deep debugging if needed
      console.error('Full S3 Error Object:', error);

      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${error.message}`,
      );
    }
  }

  async uploadIfPresent(
    files: Express.Multer.File[] | undefined,
    folder: string,
  ): Promise<string | null> {
    // 1. Debug log to check if files actually reached the service
    if (!files || files.length === 0) {
      console.log(
        `[S3] Skipping upload for ${folder}: No file provided in the request.`,
      );
      return null;
    }

    const file = files[0];
    console.log(
      `[S3] File detected for ${folder}. Starting upload sequence...`,
    );

    return this.uploadFile(file, folder);
  }
}
