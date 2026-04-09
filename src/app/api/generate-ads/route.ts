import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "dummy",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "dummy",
});

function toImageBlob(imageBase64: string): Blob {
  const isDataUrl = imageBase64.startsWith("data:");
  const mimeType = isDataUrl
    ? imageBase64.slice(imageBase64.indexOf(":") + 1, imageBase64.indexOf(";"))
    : "image/png";
  const b64 = isDataUrl ? imageBase64.split(",")[1] : imageBase64;
  const buffer = Buffer.from(b64, "base64");
  return new Blob([buffer], { type: mimeType || "image/png" });
}

export async function POST(request: Request) {
  try {
    const { imageBase64, description, size } = await request.json();

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }
    if (!imageBase64 || !description) {
      return NextResponse.json({ error: "Image and description are required" }, { status: 400 });
    }

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json({ error: "ImageKit config missing" }, { status: 500 });
    }

    const sourceUpload = await imageKit.upload({
      file: imageBase64,
      fileName: `source-product-${Date.now()}.png`,
      folder: "/ads-genie/source/",
    });

    const sourceImageUrl = sourceUpload?.url;
    if (!sourceImageUrl) {
      return NextResponse.json({ error: "Failed to upload source image to ImageKit" }, { status: 500 });
    }

    const openAiSizeMap: Record<string, string> = {
      "1:1": "1024x1024",
      "16:9": "1792x1024",
      "9:16": "1024x1792",
    };
    const imageSize = openAiSizeMap[size] || "1024x1024";
    const prompt = `Create a professional product ad image. Product details: ${description}. Keep the same product identity as this reference image URL: ${sourceImageUrl}. Output should follow aspect ratio ${size || "1:1"} with clean marketing layout and ad-ready visual quality.`;

    const images: string[] = [];
    for (let i = 0; i < 2; i++) {
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("prompt", `${prompt} Variation ${i + 1}. Keep the same product identity as the input image.`);
      form.append("size", imageSize);
      form.append("response_format", "b64_json");
      form.append("image", toImageBlob(imageBase64), `source-${i + 1}.png`);

      const openAiRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: form,
      });

      if (!openAiRes.ok) {
        const errorText = await openAiRes.text();
        throw new Error(errorText || "OpenAI image edit request failed");
      }

      const response = await openAiRes.json();

      const b64Image = response?.data?.[0]?.b64_json;
      if (!b64Image) {
        continue;
      }

      const generatedUpload = await imageKit.upload({
        file: b64Image,
        fileName: `generated-ad-${Date.now()}-${i + 1}.png`,
        folder: "/ads-genie/generated/",
      });

      if (generatedUpload?.url) {
        images.push(generatedUpload.url);
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Failed to generate images" }, { status: 500 });
    }

    return NextResponse.json({
      images,
      sourceImageUrl,
    });
  } catch (error: any) {
    console.error("Error generating ad image:", error?.response?.data || error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to generate ad image" }, { status: 500 });
  }
}
