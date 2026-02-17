import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try AdsGenie basics",
    features: [
      "5 ad generations / month",
      "Basic styles",
      "Standard resolution",
      "Watermarked exports",
    ],
    cta: "Current Plan",
    popular: false,
    disabled: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For growing businesses",
    features: [
      "100 ad generations / month",
      "All premium styles",
      "HD resolution exports",
      "No watermarks",
      "Priority support",
      "Brand kit storage",
      "A/B variant generation",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    disabled: false,
  },
  {
    name: "Enterprise",
    price: "$79",
    period: "per month",
    description: "For agencies and teams",
    features: [
      "Unlimited generations",
      "Custom AI training",
      "4K resolution exports",
      "Team collaboration",
      "API access",
      "Dedicated account manager",
      "White-label option",
    ],
    cta: "Contact Sales",
    popular: false,
    disabled: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function Upgrade() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground text-xs uppercase tracking-widest mb-8">
            Pricing
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start free, upgrade as you grow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-px bg-border max-w-4xl mx-auto rounded-md overflow-hidden"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={`relative bg-card p-8 ${plan.popular ? "bg-secondary" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-px bg-foreground" />
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-display font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "gradient" : "outline"}
                className="w-full"
                disabled={plan.disabled}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 max-w-2xl mx-auto"
        >
          <h2 className="text-xl font-display font-bold text-center mb-8 uppercase tracking-wider">
            FAQ
          </h2>
          <div className="divide-y divide-border">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes, cancel anytime. Access continues until end of billing period.",
              },
              {
                q: "What payment methods?",
                a: "All major credit cards, PayPal, and bank transfers for Enterprise.",
              },
              {
                q: "Do unused generations roll over?",
                a: "No. Pro and Enterprise plans have generous monthly limits.",
              },
              {
                q: "Free trial for Pro?",
                a: "Start with Free plan, then upgrade when ready.",
              },
            ].map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="font-display font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
