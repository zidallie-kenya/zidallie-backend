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

  /**
   * Cleans filenames to prevent URL encoding issues (like the %20 vs %2520 bug).
   * Replaces spaces with hyphens and removes special characters.
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^a-z0-9.\-_]/g, '') // Remove everything except letters, numbers, dots, hyphens, underscores
      .replace(/-+/g, '-'); // Prevent double hyphens --
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // 1. Sanitize the original name before creating the S3 Key
    const cleanFileName = this.sanitizeFilename(file.originalname);

    // 2. Generate the key (path in S3)
    const fileKey = `${folder}/${uuidv4()}-${cleanFileName}`;

    console.log(
      `[S3] Attempting upload: ${file.originalname} -> ${cleanFileName} to ${fileKey}`,
    );

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: 'inline',
        }),
      );

      // 3. Construct the final URL.
      // Since fileKey is now "clean", this URL will never have encoding issues.
      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      console.log(`[S3] Upload Success: ${url}`);
      return url;
    } catch (error) {
      console.error(`[S3] Upload Failed for file: ${file.originalname}`);
      console.error(`[S3] Error Message: ${error.message}`);

      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${error.message}`,
      );
    }
  }

  async uploadIfPresent(
    files: Express.Multer.File[] | undefined,
    folder: string,
  ): Promise<string | null> {
    if (!files || files.length === 0) {
      return null;
    }

    const file = files[0];
    return this.uploadFile(file, folder);
  }
}
