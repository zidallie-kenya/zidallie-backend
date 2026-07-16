import { Injectable } from '@nestjs/common';
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
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async uploadIfPresent(
    files: Express.Multer.File[] | undefined,
    folder: string,
  ): Promise<string | null> {
    const file = files?.[0];
    return file ? this.uploadFile(file, folder) : null;
  }
}
