
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, User, Bell, CreditCard, Shield, Palette, Loader2, Camera, Trash2, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const menuItems = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Palette },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("account");

  // Account State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const photoURLInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true,
  });

  const [showPhotoInput, setShowPhotoInput] = useState(false);

  // Initialize state from user object
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(displayName)) {
      toast.error("Username can only contain letters, numbers, underscores, and hyphens (no spaces).");
      return;
    }
    if (displayName.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }

    setLoading(true);
    try {
      // Check if username (displayName) is being updated
      if (displayName !== user.displayName) {
        const usernameRef = doc(db, "usernames", displayName);
        const usernameSnap = await getDoc(usernameRef);

        if (usernameSnap.exists()) {
          throw new Error("Username already taken. Please choose another.");
        }

        // Reserve new username
        await setDoc(usernameRef, { uid: user.uid });

        // Release old username if it existed
        if (user.displayName) {
          const oldUsernameRef = doc(db, "usernames", user.displayName);
          // Only delete if it belongs to the current user (sanity check, though auth rules should handle this)
          const oldUsernameSnap = await getDoc(oldUsernameRef);
          if (oldUsernameSnap.exists() && oldUsernameSnap.data().uid === user.uid) {
            await deleteDoc(oldUsernameRef);
          }
        }
      }

      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });
      toast.success("Profile updated successfully!");
      setShowPhotoInput(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        toast.error("Incorrect current password");
      } else {
        toast.error(err.message || "Failed to update password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-64 space-y-2"
          >
            <div className="border border-border rounded-md bg-card p-2 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${activeSection === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <hr className="my-2 border-border" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            {activeSection === "account" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">My Account</h2>
                  <p className="text-muted-foreground text-sm">Manage your profile information and preferences.</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-8 pb-8 border-b border-border">
                    <div className="w-24 h-24 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-border">
                      {photoURL ? (
                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-foreground opacity-50">
                          {displayName ? displayName[0].toUpperCase() : email ? email[0].toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="text-xl font-semibold">{displayName || "User"}</h3>
                      <div className="flex flex-wrap gap-2">
                        {!showPhotoInput ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setShowPhotoInput(true)}
                            >
                              Change Photo
                            </Button>
                            {photoURL && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => { setPhotoURL(""); handleUpdateProfile(); }}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 w-full max-w-sm">
                            <Input
                              value={photoURL}
                              onChange={(e) => setPhotoURL(e.target.value)}
                              placeholder="https://..."
                              className="h-8 text-xs bg-background"
                              autoFocus
                            />
                            <Button size="sm" className="h-8 px-3" onClick={() => setShowPhotoInput(false)}>
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only JPG, GIF or PNG. Max size of 800K.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Only letters, numbers, underscores, and hyphens allowed.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        value={email}
                        disabled
                        className="bg-muted opacity-70 cursor-not-allowed"
                      />
                    </div>

                    <div className="pt-4">
                      <Button variant="default" onClick={handleUpdateProfile} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="border border-border rounded-md p-8 bg-card flex flex-col items-center justify-center min-h-[300px] text-center">
                <Bell className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-lg font-display font-bold mb-2">Notifications Coming Soon</h2>
                <p className="text-sm text-muted-foreground">We are working on this feature.</p>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="border border-border rounded-md p-8 bg-card flex flex-col items-center justify-center min-h-[300px] text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-lg font-display font-bold mb-2">Billing Dashboard Coming Soon</h2>
                <p className="text-sm text-muted-foreground">Manage your subscription and invoices here.</p>
              </div>
            )}

            {activeSection === "security" && (
              <div className="border border-border rounded-md p-8 bg-card">
                <h2 className="text-lg font-display font-bold mb-6 uppercase tracking-wider">Security</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Current Password</label>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">New Password</label>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Confirm Password</label>
                    <Input
                      type="password"
                      className="bg-background border-border"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button variant="gradient" onClick={handleUpdatePassword} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "preferences" && (
              <div className="border border-border rounded-md p-8 bg-card flex flex-col items-center justify-center min-h-[300px] text-center">
                <Palette className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-lg font-display font-bold mb-2">Preferences Coming Soon</h2>
                <p className="text-sm text-muted-foreground">Customize your experience shortly.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
