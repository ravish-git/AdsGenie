import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Bell, Shield, Palette, LogOut, Save, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const menuItems = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Palette },
];

export default function Profile() {
  const [activeSection, setActiveSection] = useState("account");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your account settings and preferences.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="border border-border rounded-md bg-card p-2 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm transition-all ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <hr className="my-2 border-border" />
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {activeSection === "account" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Account</h2>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-foreground">
                    JD
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{name}</h3>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Free Plan</p>
                    <Button variant="outline" size="sm" className="mt-2 text-xs">
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border" />
                  </div>
                  <Button variant="gradient" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Notifications</h2>
                <div className="divide-y divide-border">
                  {[
                    { key: "email", title: "Email Notifications", desc: "Ad generation status updates" },
                    { key: "marketing", title: "Marketing Emails", desc: "Tips and promotional content" },
                    { key: "updates", title: "Product Updates", desc: "New features and improvements" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-5">
                      <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Billing</h2>
                <div className="bg-secondary rounded-md p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-sm">Free Plan</h3>
                      <p className="text-xs text-muted-foreground">5 generations / month</p>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-accent rounded-full h-1.5">
                      <div className="bg-foreground h-1.5 rounded-full w-3/5" />
                    </div>
                    <span className="text-xs text-muted-foreground">3/5</span>
                  </div>
                </div>
                <Button variant="gradient" asChild>
                  <a href="/upgrade">Upgrade Plan</a>
                </Button>
              </div>
            )}

            {activeSection === "security" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Security</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Current Password</label>
                    <Input type="password" className="bg-background border-border" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">New Password</label>
                    <Input type="password" className="bg-background border-border" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Confirm Password</label>
                    <Input type="password" className="bg-background border-border" placeholder="••••••••" />
                  </div>
                  <Button variant="gradient">
                    Update Password
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "preferences" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Preferences</h2>
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between py-5">
                    <div>
                      <h3 className="font-medium text-sm">Default Ad Style</h3>
                      <p className="text-xs text-muted-foreground">Your preferred style</p>
                    </div>
                    <select className="bg-background border border-border rounded-md px-3 py-2 text-xs">
                      <option>Modern</option>
                      <option>Minimal</option>
                      <option>Bold</option>
                      <option>Elegant</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-5">
                    <div>
                      <h3 className="font-medium text-sm">Default Platform</h3>
                      <p className="text-xs text-muted-foreground">Your preferred platform</p>
                    </div>
                    <select className="bg-background border border-border rounded-md px-3 py-2 text-xs">
                      <option>Instagram</option>
                      <option>Facebook</option>
                      <option>Story</option>
                      <option>Twitter</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
