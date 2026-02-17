import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Download, Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAds = [
  {
    id: "1",
    name: "Summer Sale Banner",
    platform: "Instagram",
    style: "Modern",
    createdAt: "2024-01-15",
    thumbnail: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    name: "Product Launch",
    platform: "Facebook",
    style: "Bold",
    createdAt: "2024-01-14",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "Holiday Promo",
    platform: "Story",
    style: "Playful",
    createdAt: "2024-01-13",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  },
  {
    id: "4",
    name: "New Collection",
    platform: "Twitter",
    style: "Elegant",
    createdAt: "2024-01-12",
    thumbnail: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function MyAds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredAds = demoAds.filter((ad) =>
    ad.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            My Ads
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage your generated advertisements.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {["all", "instagram", "facebook", "story", "twitter"].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className="capitalize text-xs"
              >
                {filter}
              </Button>
            ))}
          </div>
        </motion.div>

        {filteredAds.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredAds.map((ad) => (
              <motion.div
                key={ad.id}
                variants={itemVariants}
                className="group border border-border rounded-md overflow-hidden bg-card hover:border-muted-foreground transition-colors"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={ad.thumbnail}
                    alt={ad.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="default">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm truncate">{ad.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{ad.platform}</span>
                    <span className="text-xs text-muted-foreground">{ad.style}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ad.createdAt}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-border rounded-md p-16 text-center bg-card"
          >
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
