import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Target, BarChart3, Palette, Clock, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate professional ads in seconds, not hours.",
  },
  {
    icon: Target,
    title: "Targeted Designs",
    description: "AI-powered designs optimized for your audience.",
  },
  {
    icon: BarChart3,
    title: "High Conversion",
    description: "Ads designed with proven marketing principles.",
  },
  {
    icon: Palette,
    title: "Brand Consistent",
    description: "Maintain your brand identity across all ads.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Focus on strategy while AI handles the creative.",
  },
  {
    icon: Shield,
    title: "Commercial Ready",
    description: "All content is ready for commercial use.",
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

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground text-xs uppercase tracking-widest mb-10"
            >
              AI-Powered Ad Generation
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-8 leading-[0.9] tracking-tight">
              Create Ads
              <br />
              <span className="text-muted-foreground">That Convert</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
              Transform product images into scroll-stopping advertisements. 
              No design skills needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create">
                <Button variant="gradient" size="xl">
                  Start Creating
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/my-ads">
                <Button variant="outline" size="xl">
                  View Examples
                </Button>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-12 mt-20"
            >
              {[
                { value: "10K+", label: "Ads Generated" },
                { value: "500+", label: "Users" },
                { value: "4.9", label: "Rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why AdsGenie
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Everything you need to create professional advertisements.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border max-w-4xl mx-auto"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-background p-8 group"
              >
                <feature.icon className="w-5 h-5 text-muted-foreground mb-4 group-hover:text-foreground transition-colors" />
                <h3 className="text-sm font-display font-semibold mb-2 uppercase tracking-wider">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">
              Ready to Start?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              Join thousands creating professional ads with AI.
            </p>
            <Link to="/create">
              <Button variant="gradient" size="xl">
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
