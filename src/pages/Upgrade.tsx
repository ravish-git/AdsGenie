import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function Upgrade() {
  return (
    <div className="min-h-screen py-20 flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">Pro Plans Coming Soon</h1>
          <p className="text-muted-foreground text-lg mb-8">
            We're working hard to bring you advanced features and AI capabilities. Stay tuned!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
