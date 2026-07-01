import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from './logger';

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured');
} else {
  logger.warn('Cloudinary not configured — avatar uploads will use local disk fallback');
}

export { cloudinary };
