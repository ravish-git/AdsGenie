import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Download, Video, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

type AdItem = {
  id: string;
  description?: string;
  aspectRatio?: string;
  imageUrl?: string;
  videoUrl?: string | null;
};

export default function MyAds() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAds = async () => {
      if (!user) {
        setAds([]);
        setLoading(false);
        return;
      }

      try {
        const adsQuery = query(
          collection(db, "users", user.uid, "ads"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(adsQuery);
        const rows: AdItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AdItem, "id">),
        }));
        setAds(rows);
      } finally {
        setLoading(false);
      }
    };

    void loadAds();
  }, [user]);

  const filteredAds = ads.filter((ad) => {
    const text = `${ad.description || ""} ${ad.aspectRatio || ""}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">My Ads</h1>
          <p className="text-muted-foreground text-sm">Your generated ads from Firebase.</p>
        </motion.div>

        <div className="relative flex-1 mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {loading ? (
          <div className="border border-border rounded-md p-10 bg-card text-sm text-muted-foreground">
            Loading ads...
          </div>
        ) : filteredAds.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="group border border-border rounded-md overflow-hidden bg-card">
                <div className="relative aspect-square overflow-hidden">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.description || "Generated ad"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-display font-semibold text-sm truncate">
                    {ad.description || "Generated Ad"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Aspect ratio: {(ad.aspectRatio || "1:1").toUpperCase()}
                  </p>
                  <div className="flex gap-2">
                    {ad.imageUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={ad.imageUrl} target="_blank" rel="noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {ad.videoUrl && (
                      <Button size="sm" variant="default" asChild>
                        <a href={ad.videoUrl} target="_blank" rel="noreferrer">
                          <Video className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-md p-16 text-center bg-card">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">No ads found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {searchQuery ? "Try a different search term" : "Start creating your first ad!"}
            </p>
            <Button variant="gradient" asChild>
              <a href="/create">Create Your First Ad</a>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
