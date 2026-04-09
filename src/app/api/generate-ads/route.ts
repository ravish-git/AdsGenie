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
    const imageSizeMap: Record<string, string> = {
      "1:1": "1024x1024",
      "16:9": "1792x1024",
      "9:16": "1024x1792",
    };
    const requestedSize = imageSizeMap[size] || "1024x1024";
    const imageKitRatioTransform: Record<string, string> = {
      "1:1": "ar-1-1",
      "16:9": "ar-16-9",
      "9:16": "ar-9-16",
    };
    const ratioTransform = imageKitRatioTransform[size] || "ar-1-1";


    const prompt = `Create a premium, professional product advertisement image using this product reference image URL: ${sourceImageUrl}. Product details: ${description}. Keep the same product identity (same item, brand/logo, and recognizable design), but generate a NEW ad creative: new commercial background, new composition, studio-grade lighting, modern typography regions, and campaign-ready visual hierarchy. Do not recreate the original photo framing or plain background. Make it look like a polished paid social media ad.`;



    const images: string[] = [];
    let selectedModel = "gpt-image-1";
    let imageSize = requestedSize;

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let j = 0; j < bytes.length; j++) binary += String.fromCharCode(bytes[j]);
      return btoa(binary);
    };

    for (let i = 0; i < 4; i++) {
      const payload = {
        model: selectedModel,
        prompt: `${prompt} Create one distinct professional ad variation (${i + 1}/4).`,
        size: imageSize,
      };

      const openAiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      let response: any;
      if (!openAiRes.ok) {
        const errorText = await openAiRes.text();
        const unsupportedModel = errorText.includes("Value must be 'dall-e-2'") || errorText.includes("\"param\": \"model\"");
        if (selectedModel === "gpt-image-1" && unsupportedModel) {
          // Account/key fallback: retry this frame with dall-e-2 constraints.
          selectedModel = "dall-e-2";
          imageSize = "1024x1024";
          const retryRes = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: selectedModel,
              prompt: `${prompt} Create one distinct professional ad variation (${i + 1}/4).`,
              size: imageSize,
            }),
          });
          if (!retryRes.ok) {
            const retryText = await retryRes.text();
            throw new Error(retryText || "OpenAI image edit request failed");
          }
          response = await retryRes.json();
        } else {
          throw new Error(errorText || "OpenAI image edit request failed");
        }
      } else {
        response = await openAiRes.json();
      }

      const resultItem = response?.data?.[0];
      let imageFileBase64: string | null = resultItem?.b64_json || null;
      if (!imageFileBase64 && resultItem?.url) {
        const imgRes = await fetch(resultItem.url);
        if (imgRes.ok) {
          imageFileBase64 = arrayBufferToBase64(await imgRes.arrayBuffer());
        }
      }

      if (!imageFileBase64) {
        continue;
      }

      const generatedUpload = await imageKit.upload({
        file: imageFileBase64,
        fileName: `generated-ad-${Date.now()}-${i + 1}.png`,
        folder: "/ads-genie/generated/",
      });

      if (generatedUpload?.url) {
        const ratioUrl = `${generatedUpload.url}${generatedUpload.url.includes("?") ? "&" : "?"}tr=${ratioTransform},c-at_max`;
        images.push(ratioUrl);
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
