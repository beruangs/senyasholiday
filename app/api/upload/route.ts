import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { file, folder, filename } = body;

        if (!file || !folder) {
            return NextResponse.json({ error: 'File and folder are required' }, { status: 400 });
        }

        // Logic split: receipts go to Vercel Blob, others to Cloudinary
        if (folder === 'receipts') {
            // Vercel Blob Implementation
            // We expect the 'file' here to be a base64 string from the client
            const base64Data = file.split(',')[1] || file;
            const buffer = Buffer.from(base64Data, 'base64');

            const blob = await put(`senyasdaddy/receipts/${filename || 'receipt.jpg'}`, buffer, {
                access: 'public',
                contentType: file.split(';')[0].split(':')[1] || 'image/jpeg',
            });

            return NextResponse.json({ url: blob.url });
        } else {
            // Cloudinary Implementation for banners, logos, profiles
            const imageUrl = await uploadToCloudinary(file, folder as any);
            return NextResponse.json({ url: imageUrl });
        }
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
