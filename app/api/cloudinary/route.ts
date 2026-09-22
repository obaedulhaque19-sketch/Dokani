import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dokani_preset';

    return NextResponse.json({
      timestamp,
      cloudName,
      uploadPreset,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Cloudinary signature generation failed' },
      { status: 500 }
    );
  }
}
