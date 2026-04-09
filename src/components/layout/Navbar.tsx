import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, Image, FolderOpen, Crown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { path: "/", label: "Home", icon: Zap },
  { path: "/create", label: "Create", icon: Image },
  { path: "/my-ads", label: "My Ads", icon: FolderOpen },
  { path: "/upgrade", label: "Upgrade", icon: Crown },
  { path: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold tracking-tight text-foreground">
              Ads<span className="text-muted-foreground">Genie</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs uppercase tracking-wider"
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs font-medium truncate max-w-[150px]">
                    {user.displayName || user.email}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="gradient" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start text-xs uppercase tracking-wider"
                    >
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {user ? (
                <div className="flex flex-col gap-2 mt-4">
                  <div className="px-2 text-sm text-muted-foreground font-medium">
                    {user.displayName || user.email}
                  </div>
                  <Button variant="outline" className="w-full" onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="gradient" className="w-full mt-4">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
