import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadAvatar(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ secureUrl: string }> {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-hub/avatars',
            public_id: fileName,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed.'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { secureUrl: result.secure_url };
  }

  async uploadCover(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ secureUrl: string }> {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-hub/covers',
            public_id: fileName,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed.'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { secureUrl: result.secure_url };
  }

  async uploadReviewMedia(
    buffer: Buffer,
    fileName: string,
    type: 'IMAGE' | 'VIDEO',
  ): Promise<{ secureUrl: string }> {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-hub/reviews',
            public_id: fileName,
            resource_type: type === 'VIDEO' ? 'video' : 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed.'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { secureUrl: result.secure_url };
  }

  async uploadClaimDocument(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ secureUrl: string }> {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-hub/claims',
            public_id: fileName,
            resource_type: 'auto',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed.'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { secureUrl: result.secure_url };
  }

  async uploadPostImage(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ secureUrl: string }> {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'travel-hub/posts',
            public_id: fileName,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed.'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );

        uploadStream.end(buffer);
      },
    );

    return { secureUrl: result.secure_url };
  }
}
