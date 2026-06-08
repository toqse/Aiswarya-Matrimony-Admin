"use client";

import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlassProfileCard from "@/components/GlassProfileCard";
import EmptyState from "@/components/EmptyState";
import { useInterestStore } from "@/stores/interestStore";
import { profilesData } from "@/components/FeaturedProfiles";
import { toast } from "sonner";
import { Heart, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

const Favorites = () => {
  const router = useRouter();
  const { favorites, toggleFavorite, sendInterest, getSentInterestStatus, canChat } = useInterestStore();

  const favoriteProfiles = profilesData.filter(p => favorites.includes(p.id));

  const handleToggleFavorite = (profileId: number, profileName: string) => {
    toggleFavorite(profileId);
    if (favorites.includes(profileId)) {
      toast.info(`Removed ${profileName} from favorites`);
    } else {
      toast.success(`Added ${profileName} to favorites! ❤️`);
    }
  };

  const handleSendInterest = (profileId: number, profileName: string) => {
    sendInterest(0, profileId, "Hi! I'd love to connect with you.");
    toast.success(`Interest sent to ${profileName}! 💕`, {
      description: "They'll be notified about your interest.",
    });
  };

  const handleChat = (profileId: number) => {
    router.push(`/chat/${profileId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-gradient-romantic relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
        
        {/* Floating Hearts */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              y: ['100vh', '-20vh'],
              x: [0, (i % 2 === 0 ? 20 : -20)],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.8,
            }}
            style={{ left: `${10 + i * 10}%` }}
          >
            <Heart className={`w-${4 + (i % 3) * 2} h-${4 + (i % 3) * 2} text-primary/30 fill-primary/30`} />
          </motion.div>
        ))}

        {/* Floating Sparkles */}
        {[...Array(5)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-secondary/30 animate-sparkle"
            style={{
              left: `${10 + i * 20}%`,
              top: `${30 + (i % 2) * 20}%`,
              width: `${20 + i * 4}px`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
              >
                <Heart className="w-4 h-4 text-primary fill-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">Your Favorites</span>
              <Star className="w-4 h-4 text-secondary fill-secondary animate-sparkle" />
            </motion.div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Profiles You <span className="text-gradient-gold">Love</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your handpicked collection of profiles that caught your heart
            </p>
            {favoriteProfiles.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-sm text-primary font-medium"
              >
                {favoriteProfiles.length} profile{favoriteProfiles.length !== 1 ? 's' : ''} saved
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Favorites Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {favoriteProfiles.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Start adding profiles to your favorites by clicking the heart icon on any profile you like!"
              actionLabel="Discover Profiles"
              actionPath="/search"
            />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    layout
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                  >
                    <GlassProfileCard
                      profile={profile}
                      index={index}
                      isFavorite={true}
                      onToggleFavorite={() => handleToggleFavorite(profile.id, profile.name)}
                      interestStatus={getSentInterestStatus(profile.id)}
                      onSendInterest={() => handleSendInterest(profile.id, profile.name)}
                      canChat={canChat(profile.id)}
                      onMessage={() => handleChat(profile.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Favorites;
