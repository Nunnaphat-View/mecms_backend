/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const s3Endpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9002';
    const accessKey =
      this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretKey =
      this.configService.get<string>('S3_SECRET_KEY') || 'minioadminpassword';
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') || 'calibration';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const forcePathStyleVal = this.configService.get<string>(
      'S3_FORCE_PATH_STYLE',
    );
    const forcePathStyle =
      forcePathStyleVal === 'true' || forcePathStyleVal === undefined;

    this.endpoint = s3Endpoint;

    this.s3Client = new S3Client({
      endpoint: s3Endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucketExistsAndIsPublic();
    } catch (error) {
      this.logger.error(
        `Failed to initialize S3/MinIO bucket policy: ${error.message}`,
      );
    }
  }

  private async ensureBucketExistsAndIsPublic() {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`Bucket "${this.bucketName}" already exists.`);
    } catch (error: any) {
      // If bucket does not exist, create it
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(
          `Bucket "${this.bucketName}" not found. Creating it...`,
        );
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
      } else {
        throw error;
      }
    }

    // Set bucket policy to public read
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(policy),
        }),
      );
      this.logger.log(
        `Bucket "${this.bucketName}" policy set to Public Read automatically.`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Could not set bucket policy to public automatically: ${error.message}`,
      );
    }
  }

  /**
   * Upload a file to S3/MinIO bucket.
   * @param file Express.Multer.File object (from memoryStorage)
   * @param folder Target folder inside the bucket (e.g. 'certs', 'hospitals', 'profiles')
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${folder}-${uniqueSuffix}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(`Uploaded file successfully: ${fileName}`);

      // Return the direct URL to access the file
      // If a public domain or CDN URL is configured, use it. Otherwise construct default path-style url.
      const publicBaseUrl = this.configService.get<string>('S3_PUBLIC_URL');
      if (publicBaseUrl) {
        return `${publicBaseUrl}/${fileName}`;
      }
      return `${this.endpoint}/${this.bucketName}/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from S3/MinIO bucket.
   * @param fileUrl The URL of the file stored in the database
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the key from the url
      // E.g., URL = http://localhost:9000/calibration/certs/certs-1234.pdf
      // Key should be "certs/certs-1234.pdf"
      const urlParts = fileUrl.split(`/${this.bucketName}/`);
      if (urlParts.length < 2) {
        this.logger.warn(`Could not extract S3 key from URL: ${fileUrl}`);
        return;
      }
      const key = urlParts[1];

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log(`Deleted file successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`);
      throw error;
    }
  }
}
