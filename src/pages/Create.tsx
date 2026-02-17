import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, X, Loader2, Download, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const adStyles = [
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "elegant", label: "Elegant" },
  { id: "playful", label: "Playful" },
];

const platforms = [
  { id: "instagram", label: "Instagram", size: "1080×1080" },
  { id: "facebook", label: "Facebook", size: "1200×628" },
  { id: "story", label: "Story", size: "1080×1920" },
  { id: "twitter", label: "Twitter/X", size: "1200×675" },
];

export default function Create() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedAdIndex, setSelectedAdIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setGeneratedAds([]);
        setVideoUrl(null);
        setSelectedAdIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
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
    setVideoUrl(null);
    setSelectedAdIndex(null);

    try {
      const { functions } = await import("@/lib/firebase");
      const { httpsCallable } = await import("firebase/functions");
      const generateAds = httpsCallable(functions, 'generateAds');

      const result = await generateAds({
        imageBase64: image,
        description,
        style: selectedStyle,
        platform: selectedPlatform,
      });

      const data = result.data as any;

      if (data?.images?.length > 0) {
        setGeneratedAds(data.images);
        toast.success(`${data.images.length} ad variations generated!`);
      } else {
        toast.error("No images were generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate ads");
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
      const { functions } = await import("@/lib/firebase");
      const { httpsCallable } = await import("firebase/functions");
      const animateAd = httpsCallable(functions, 'animateAd');

      const result = await animateAd({
        imageBase64: adImage,
        description: `Animate this ${selectedStyle} advertisement: ${description}`,
      });

      const data = result.data as any;

      if (data?.videoUrl) {
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
                    onClick={() => { setImage(null); setGeneratedAds([]); setVideoUrl(null); }}
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

            {/* Style Selection */}
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Style
              </h3>
              <div className="flex flex-wrap gap-2">
                {adStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all border ${selectedStyle === style.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                      }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="border border-border rounded-md p-6 bg-card">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                Platform
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-3 rounded-md text-left transition-all border ${selectedPlatform === platform.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border hover:border-muted-foreground"
                      }`}
                  >
                    <p className="font-medium text-xs uppercase tracking-wider">{platform.label}</p>
                    <p className={`text-xs mt-0.5 ${selectedPlatform === platform.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {platform.size}
                    </p>
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
                "Generate 4 Ad Variations"
              )}
            </Button>
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
                  <p className="text-muted-foreground text-sm">AI is generating your ad variations...</p>
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
                      <p className="text-muted-foreground text-sm">Creating 5-second video...</p>
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
