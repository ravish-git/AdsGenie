import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, X, Loader2, Download, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";

const sizeOptions = [
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
];

async function parseApiResponse(response: Response) {
  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (data?.rawText ? `${response.status} ${response.statusText}: ${data.rawText}` : `${response.status} ${response.statusText}`);
    throw new Error(message);
  }

  if (!data) {
    throw new Error("Empty response from API route. Ensure Next.js API is running.");
  }

  return data;
}

export default function Create() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedSize, setSelectedSize] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [generatedAdIds, setGeneratedAdIds] = useState<string[]>([]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedAdIndex, setSelectedAdIndex] = useState<number | null>(null);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState<number>(4);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPlanUsage = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          plan: "free",
          freeGenerationsLeft: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setFreeGenerationsLeft(4);
        return;
      }
      const left = snap.data()?.freeGenerationsLeft;
      setFreeGenerationsLeft(typeof left === "number" ? left : 4);
    } catch (error) {
      console.error("Failed to load plan usage:", error);
      setFreeGenerationsLeft(4);
    }
  };

  useEffect(() => {
    if (user) {
      void loadPlanUsage();
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setGeneratedAds([]);
        setGeneratedAdIds([]);
        setVideoUrl(null);
        setSelectedAdIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please log in to generate ads");
      navigate("/auth");
      return;
    }
    if (!image) {
      toast.error("Please upload a product image");
      return;
    }
    if (!description.trim()) {
      toast.error("Please add a product description");
      return;
    }
    setIsGenerating(true);
    setGeneratedAds([]);
    setGeneratedAdIds([]);
    setVideoUrl(null);
    setSelectedAdIndex(null);

    try {
      const userRef = doc(db, "users", user.uid);
      const nextLeft = await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const current = userSnap.exists() ? (userSnap.data()?.freeGenerationsLeft ?? 4) : 4;
        if (current <= 0) {
          throw new Error("No free generations left");
        }
        const updated = current - 1;
        tx.set(userRef, { freeGenerationsLeft: updated, updatedAt: Date.now() }, { merge: true });
        return updated;
      });
      setFreeGenerationsLeft(nextLeft);

      const response = await fetch("/api/generate-ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        imageBase64: image,
        description,
        size: selectedSize,
        }),
      });
      const data = await parseApiResponse(response);

      if (data?.images?.length > 0) {
        const userAdsRef = collection(db, "users", user.uid, "ads");
        const adIds: string[] = [];
        for (const imageUrl of data.images) {
          const adRef = doc(userAdsRef);
          await setDoc(adRef, {
            id: adRef.id,
            uid: user.uid,
            description,
            aspectRatio: selectedSize,
            sourceImageUrl: data?.sourceImageUrl || image,
            imageUrl,
            videoUrl: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          adIds.push(adRef.id);
        }

        setGeneratedAds(data.images);
        setGeneratedAdIds(adIds);
        toast.success(`${data.images.length} AI product images created!`);
      } else {
        toast.error("No images were generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      if (err.message === "No free generations left") {
        setFreeGenerationsLeft(0);
        toast.error("Free plan limit reached. Upgrade to continue.");
      } else {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          await runTransaction(db, async (tx) => {
            const userSnap = await tx.get(userRef);
            const current = userSnap.exists() ? (userSnap.data()?.freeGenerationsLeft ?? 0) : 0;
            tx.set(userRef, { freeGenerationsLeft: current + 1, updatedAt: Date.now() }, { merge: true });
          });
          await loadPlanUsage();
        }
        toast.error(err.message || "Failed to generate ads");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnimate = async (index: number) => {
    const adImage = generatedAds[index];
    if (!adImage) return;

    setAnimatingIndex(index);
    setSelectedAdIndex(index);
    setVideoUrl(null);

    try {
      const response = await fetch("/api/animate-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        imageBase64: adImage,
        description: `Animate this product advertisement: ${description}`,
        }),
      });
      const data = await parseApiResponse(response);

      if (data?.videoUrl) {
        const adId = generatedAdIds[index];
        if (adId) {
          await setDoc(
            doc(db, "users", user!.uid, "ads", adId),
            {
              videoUrl: data.videoUrl,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
        setVideoUrl(data.videoUrl);
        toast.success("Video generated!");
      } else if (data?.taskId) {
        // Fallback if the function returns a taskId (though our implementation awaits)
        toast.info("Video processing started...");
      }
    } catch (err: any) {
      console.error("Animation error:", err);
      toast.error(err.message || "Failed to animate ad");
    } finally {
      setAnimatingIndex(null);
    }
  };

  // Removed polling logic as Cloud Functions can await the result directly


  const handleDownload = (url: string, type: "image" | "video") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `ad-${Date.now()}.${type === "video" ? "mp4" : "png"}`;
    link.click();
    toast.success(`${type === "video" ? "Video" : "Image"} downloaded!`);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            Create Ad
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Upload your product image, describe it, and AI will generate professional ad variations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Image Upload */}
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Product Image
              </h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Product" className="w-full h-64 object-cover rounded-md" />
                  <button
                    onClick={() => { setImage(null); setGeneratedAds([]); setGeneratedAdIds([]); setVideoUrl(null); }}
                    className="absolute top-2 right-2 p-2 bg-background/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border border-dashed border-border rounded-md flex flex-col items-center justify-center gap-3 hover:border-muted-foreground transition-colors cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                  </div>
                </button>
              )}
            </div>

            {/* Description */}
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Description
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product... What is it? What makes it special?"
                className="min-h-32 resize-none bg-background border-border"
              />
            </div>

            {/* Size Selection */}
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all border ${selectedSize === size.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                      }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating || !image || !description.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Ads...
                </>
              ) : (
                "Create AI Product Image"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Free plan generations left: {freeGenerationsLeft}
            </p>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Generated Ads
              </h3>

              {isGenerating ? (
                <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">AI is generating your product ad image...</p>
                  <p className="text-muted-foreground text-xs">This may take up to a minute</p>
                </div>
              ) : generatedAds.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {generatedAds.map((ad, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative group rounded-md overflow-hidden border-2 transition-all cursor-pointer ${selectedAdIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                        }`}
                      onClick={() => setSelectedAdIndex(index)}
                    >
                      <img
                        src={ad}
                        alt={`Ad variation ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      {selectedAdIndex === index && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnimate(index);
                          }}
                          disabled={animatingIndex !== null}
                        >
                          {animatingIndex === index ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Animate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(ad, "image");
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1">
                        <p className="text-xs font-medium text-center">Variation {index + 1}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Your generated ads will appear here</p>
                </div>
              )}
            </div>

            {/* Video Preview */}
            <AnimatePresence>
              {(videoUrl || animatingIndex !== null) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border border-border rounded-md p-6 bg-card"
                >
                  <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                    Animated Video
                  </h3>
                  {animatingIndex !== null && !videoUrl ? (
                    <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Creating video...</p>
                    </div>
                  ) : videoUrl ? (
                    <div className="space-y-3">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full rounded-md"
                      />
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleDownload(videoUrl, "video")}
                      >
                        <Download className="w-4 h-4" />
                        Download Video
                      </Button>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
