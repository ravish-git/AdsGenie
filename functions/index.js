const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const ImageKit = require("imagekit");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Initialize ImageKit
// Note: We will read these from Firebase Config (functions.config().imagekit.*)
// or Environment Variables. For now, we'll try to read from process.env if set, 
// but in production they should be set via `firebase functions:config:set` 
// or Secret Manager.
const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "dummy",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "dummy"
});

exports.generateAds = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { imageBase64, description, style, platform } = data;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

    if (!LOVABLE_API_KEY) {
        throw new functions.https.HttpsError("internal", "LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64 || !description) {
        throw new functions.https.HttpsError("invalid-argument", "Image and description are required");
    }

    const variations = [
        `Create a professional ${style} advertisement for ${platform}. Product: ${description}. Make it eye-catching with bold typography and clean layout. Variation 1: focus on the product hero shot.`,
        `Create a professional ${style} advertisement for ${platform}. Product: ${description}. Make it eye-catching with lifestyle context. Variation 2: show the product in use.`,
        `Create a professional ${style} advertisement for ${platform}. Product: ${description}. Make it eye-catching with minimalist design. Variation 3: focus on brand aesthetics.`,
        `Create a professional ${style} advertisement for ${platform}. Product: ${description}. Make it eye-catching with promotional text. Variation 4: highlight key features and benefits.`,
    ];

    const results = [];

    for (const prompt of variations) {
        try {
            const response = await axios.post(
                "https://ai.gateway.lovable.dev/v1/chat/completions",
                {
                    model: "google/gemini-2.5-flash-image",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: { url: imageBase64 },
                                },
                            ],
                        },
                    ],
                    modalities: ["image", "text"],
                },
                {
                    headers: {
                        Authorization: `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const imageUrl = response.data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) {
                results.push(imageUrl);
            }
        } catch (err) {
            console.error("Error generating variation:", err.response?.data || err.message);
        }
    }

    if (results.length === 0) {
        throw new functions.https.HttpsError("internal", "Failed to generate any ad images. Please try again.");
    }

    return { images: results };
});

exports.animateAd = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { imageBase64, description } = data;

    // These should be environment variables
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
        throw new functions.https.HttpsError("internal", "ImageKit config missing");
    }

    try {
        // Step 1: Upload to ImageKit
        const uploadResponse = await imageKit.upload({
            file: imageBase64, // ImageKit SDK handles base64
            fileName: `ad-${Date.now()}.png`,
            folder: "/ads-genie/",
        });

        const fileId = uploadResponse.fileId;
        const imageUrl = uploadResponse.url;

        // Step 2: Generate Video
        // ImageKit Node SDK might not have generateVideo method exposed directly if it's new,
        // so we use axios for the specific API call if needed, or check SDK docs.
        // The previous implementation used raw fetch to https://api.imagekit.io/v1/generateVideo
        // Let's stick to axios for this specific endpoint to match the previous logic exactly.

        const authHeader = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

        const videoRes = await axios.post(
            "https://api.imagekit.io/v1/generateVideo",
            {
                input: {
                    type: "image",
                    url: imageUrl,
                },
                transformation: {
                    prompt: description || "Create a smooth animated advertisement video with subtle motion effects",
                    duration: 5,
                },
            },
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const videoData = videoRes.data;

        return {
            taskId: videoData.id || videoData.taskId,
            status: videoData.status || "processing",
            videoUrl: videoData.output?.url || null,
            fileId,
        };

    } catch (err) {
        console.error("animateAd error:", err.response?.data || err.message);
        throw new functions.https.HttpsError("internal", err.message || "Failed to animate ad");
    }
});
