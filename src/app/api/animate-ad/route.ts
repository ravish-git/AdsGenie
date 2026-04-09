import { NextResponse } from "next/server";
import axios from "axios";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "dummy",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "dummy",
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const { imageBase64, description } = await request.json();

    const REPLICATE_API_KEY = process.env.REPLICATE_API_TOKEN;
    const REPLICATE_MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION;

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json({ error: "ImageKit config missing" }, { status: 500 });
    }
    if (!REPLICATE_API_KEY) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured" }, { status: 500 });
    }
    if (!REPLICATE_MODEL_VERSION) {
      return NextResponse.json({ error: "REPLICATE_MODEL_VERSION is not configured" }, { status: 500 });
    }

    let sourceImageUrl = imageBase64;
    if (typeof imageBase64 === "string" && !imageBase64.startsWith("http")) {
      const uploadResponse = await imageKit.upload({
        file: imageBase64,
        fileName: `ad-${Date.now()}.png`,
        folder: "/ads-genie/source/",
      });
      sourceImageUrl = uploadResponse.url;
    }

    if (!sourceImageUrl || !sourceImageUrl.startsWith("http")) {
      return NextResponse.json({ error: "Valid source image URL is required for video generation" }, { status: 400 });
    }

    const createPredictionRes = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: REPLICATE_MODEL_VERSION,
        input: {
          image: sourceImageUrl,
          prompt: description || "Create a smooth animated advertisement video with subtle motion effects",
        },
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let prediction = createPredictionRes.data;
    const maxTries = 24;
    for (let i = 0; i < maxTries; i++) {
      if (
        prediction?.status === "succeeded" ||
        prediction?.status === "failed" ||
        prediction?.status === "canceled"
      ) {
        break;
      }
      await sleep(5000);
      const pollRes = await axios.get(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${REPLICATE_API_KEY}` },
      });
      prediction = pollRes.data;
    }

    const output = prediction?.output;
    const replicateVideoUrl = Array.isArray(output) ? output[0] : output;
    const status = prediction?.status || "processing";
    if (!replicateVideoUrl || status !== "succeeded") {
      return NextResponse.json(
        { error: `Replicate video generation did not succeed (status: ${status})` },
        { status: 500 }
      );
    }

    let finalVideoUrl = replicateVideoUrl;
    if (typeof replicateVideoUrl === "string" && replicateVideoUrl.startsWith("http")) {
      const videoBufferRes = await axios.get(replicateVideoUrl, { responseType: "arraybuffer" });
      const videoBase64 = Buffer.from(videoBufferRes.data, "binary").toString("base64");
      const uploadedVideo = await imageKit.upload({
        file: videoBase64,
        fileName: `generated-video-${Date.now()}.mp4`,
        folder: "/ads-genie/videos/",
      });
      if (uploadedVideo?.url) {
        finalVideoUrl = uploadedVideo.url;
      }
    }

    return NextResponse.json({
      taskId: prediction.id,
      status,
      videoUrl: finalVideoUrl,
    });
  } catch (error: any) {
    console.error("animateAd error:", error?.response?.data || error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to animate ad" }, { status: 500 });
  }
}
