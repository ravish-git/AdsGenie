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
  const b64 = isDataUrl ? imageBase64.split(",")[1] : imageBase64;
  const buffer = Buffer.from(b64, "base64");
  return new Blob([buffer], { type: "image/png" });
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
    const sourcePngUrl = `${sourceImageUrl}${sourceImageUrl.includes("?") ? "&" : "?"}tr=f-png`;

    const openAiSizeMap: Record<string, string> = {
      "1:1": "1024x1024",
      "16:9": "1792x1024",
      "9:16": "1024x1792",
    };
    const imageSize = openAiSizeMap[size] || "1024x1024";

    // const prompt = `Create a professional product ad image sequence for a slideshow. Product details: ${description}. Keep the same product identity, same product colors/logo, and same overall visual style across all frames. Output should follow aspect ratio ${size || "1:1"} with clean marketing layout and ad-ready visual quality.`;
    // const sequenceSteps = [
    //   "Frame 1 (Hook): clean hero product intro with minimal text and strong focus on the product and include brand name",
    //   "Frame 2 (Feature): same scene style, highlight one key product benefit with subtle composition change with one feature given in description",
    //   "Frame 3 (Lifestyle/Use): same product and visual style, show contextual usage while keeping brand consistency.",
    //   "Frame 4 (CTA): same style and product identity, end frame with promotional call-to-action and offer emphasis with discount given in description",
    // ];


    const prompt = `Create a professional product ad image sequence for a slideshow. Product details: ${description}. Keep the same product identity, same product colors/logo, and same overall visual style across all frames. Output should follow aspect ratio ${size || "1:1"} with clean marketing layout and ad-ready visual quality.`;
    const sequenceSteps = [
      "Frame 1 (Hook): clean hero product intro with minimal text and strong focus on the product and include brand name given in description",
      "Frame 2 (Feature): same scene style, highlight one key product benefit with subtle composition change with one feature given in description",
      "Frame 3 (Lifestyle/Use): Same product shown in a realistic lifestyle setting: modern lifestyle scene.Natural lighting, cinematic depth of field. No text,focus on real-world usage",
      "Frame 4 (CTA): same style and product identity, end frame with promotional call-to-action and offer emphasis with discount given in description",
    ];




    const images: string[] = [];
    for (let i = 0; i < 4; i++) {
      let sourceBlob = toImageBlob(imageBase64);
      try {
        const pngRes = await fetch(sourcePngUrl);
        if (pngRes.ok) {
          const pngBuffer = Buffer.from(await pngRes.arrayBuffer());
          sourceBlob = new Blob([pngBuffer], { type: "image/png" });
        }
      } catch (e) {
        console.warn("Falling back to base64 image blob for OpenAI edit:", e);
      }

      const form = new FormData();
      form.append("model", "dall-e-2");
      form.append(
        "prompt",
        `${prompt} ${sequenceSteps[i] || sequenceSteps[sequenceSteps.length - 1]} Ensure this frame transitions naturally from the previous frame and is optimized for slideshow continuity.`
      );
      form.append("size", imageSize);
      form.append("response_format", "b64_json");
      form.append("image", sourceBlob, `source-${i + 1}.png`);

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
