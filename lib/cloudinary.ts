import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Helper to upload Base64 to Cloudinary
 */
export const uploadToCloudinary = async (
    fileStr: string,
    folder: 'banners' | 'logos' | 'profiles'
) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            folder: `senyasdaddy/${folder}`,
            // Automatic optimization
            transformation: [
                { quality: "auto", fetch_format: "webp" }
            ]
        });
        return uploadResponse.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Gagal mengupload file ke Cloudinary');
    }
};
