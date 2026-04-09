import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "dummy",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "dummy",
});

export async function POST(request: Request) {
  try {
    const { videoBase64 } = await request.json();

    if (!videoBase64 || typeof videoBase64 !== "string") {
      return NextResponse.json({ error: "videoBase64 is required" }, { status: 400 });
    }

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json({ error: "ImageKit config missing" }, { status: 500 });
    }

    const upload = await imageKit.upload({
      file: videoBase64,
      fileName: `slideshow-${Date.now()}.webm`,
      folder: "/ads-genie/videos/",
    });

    if (!upload?.url) {
      return NextResponse.json({ error: "Failed to upload slideshow video" }, { status: 500 });
    }

    return NextResponse.json({ videoUrl: upload.url });
  } catch (error: any) {
    console.error("upload-slideshow error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to upload slideshow video" }, { status: 500 });
  }
}
