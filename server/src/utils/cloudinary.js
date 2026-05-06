import { v2 as cloudinary } from 'cloudinary';

export function configureCloudinary() {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

export async function uploadBuffer(buffer, folder = 'eduhealth') {
  const configured = configureCloudinary();
  if (!configured) {
    return { url: '', publicId: '', skipped: true };
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'auto' }, (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}
