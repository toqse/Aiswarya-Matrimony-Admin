import { motion } from "framer-motion";
import { Heart, MapPin, Briefcase, GraduationCap, Star, Eye, MessageCircle, Shield, Crown, Check, X, Clock, Sparkles, Send } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Profile } from "./FeaturedProfiles";
import { InterestStatus } from "@/stores/interestStore";

interface GlassProfileCardProps {
  profile: Profile;
  index?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  interestStatus?: InterestStatus | null;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onSendInterest?: () => void;
  onMessage?: () => void;
  /** When set, View Profile opens this callback (e.g. modal) instead of navigating. */
  onViewProfile?: () => void;
  canChat?: boolean;
  /** Show Horoscope badge (for Hindu users). */
  showHoroscopeBadge?: boolean;
}

const StatusChip = ({ status }: { status: InterestStatus }) => {
  const config = {
    pending: { 
      label: 'Pending', 
      className: 'bg-secondary/20 text-secondary-dark border-secondary/30',
      icon: Clock
    },
    accepted: { 
      label: 'Accepted', 
      className: 'bg-green-500/20 text-green-700 border-green-500/30',
      icon: Check
    },
    rejected: { 
      label: 'Declined', 
      className: 'bg-red-500/20 text-red-700 border-red-500/30',
      icon: X
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </motion.span>
  );
};

const GlassProfileCard = ({
  profile,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
  interestStatus,
  showActions = true,
  onAccept,
  onReject,
  onSendInterest,
  onMessage,
  onViewProfile,
  canChat = false,
  showHoroscopeBadge = false,
}: GlassProfileCardProps) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-full flex flex-col"
    >
      {/* Glassmorphism Card */}
      <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/70 border border-white/40 shadow-xl transition-all duration-500 flex flex-col h-full ${
        profile.isPremium ? "ring-2 ring-secondary/50" : ""
      }`}>
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-rose/30 via-white/50 to-accent-gold/30 opacity-50" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

        {/* Image Container */}
        <div className="relative h-64 overflow-hidden">
          <motion.img
            src={profile.image}
            alt={profile.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {profile.isPremium && (
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-3 py-1.5 bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground text-xs font-bold rounded-full flex items-center gap-1 shadow-gold"
              >
                <Crown className="w-3 h-3" /> Premium
              </motion.span>
            )}
            {profile.isVerified && (
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-3 py-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1"
              >
                <Shield className="w-3 h-3" /> Verified
              </motion.span>
            )}
          </div>

          {/* Status Chip */}
          {interestStatus && (
            <div className="absolute top-4 right-4">
              <StatusChip status={interestStatus} />
            </div>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              whileTap={{ scale: 0.85 }}
              className={`absolute ${interestStatus ? 'top-14' : 'top-4'} right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
                isFavorite
                  ? "bg-primary shadow-soft"
                  : "bg-white/80 hover:bg-white"
              }`}
            >
              <motion.div
                animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 transition-all ${
                    isFavorite ? "text-white fill-white" : "text-primary"
                  }`}
                />
              </motion.div>
            </motion.button>
          )}

          {/* Compatibility Score */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-soft"
          >
            <span className="text-sm font-bold text-gradient-primary">{profile.compatibility}% Match</span>
          </motion.div>
          {showHoroscopeBadge && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 left-4 px-2.5 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-primary-foreground text-xs font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Horoscope
            </motion.span>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative p-5 z-10 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 
                className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                onClick={() => {
                  window.scrollTo(0, 0);
                  router.push(`/profile/${profile.id}`);
                }}
              >
                {profile.name}
              </h3>
              <p className="text-muted-foreground">{profile.age} years</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Star className="w-5 h-5 text-secondary fill-secondary" />
              </motion.div>
              {/* Online Status */}
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{profile.profession}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 flex items-center justify-center text-primary flex-shrink-0 text-xs font-bold">⚥</span>
              <span className="truncate">{profile.age >= 28 ? 'Never Married' : 'Single'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{profile.education}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 flex items-center justify-center text-primary flex-shrink-0 text-xs">📏</span>
              <span className="truncate">5'6" / 168 cm</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 flex items-center justify-center text-primary flex-shrink-0 text-xs">🏠</span>
              <span className="truncate">Hindu, Brahmin</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 flex-wrap mt-auto">
              {onAccept && onReject && interestStatus === 'pending' && (
                <>
                  <Button
                    variant="hero"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept();
                    }}
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject();
                    }}
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </Button>
                </>
              )}

              {onSendInterest && !interestStatus && (
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendInterest();
                  }}
                >
                  <Heart className="w-4 h-4" />
                  Send Interest
                </Button>
              )}

              {interestStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/interests/sent");
                  }}
                >
                  <Send className="w-4 h-4" />
                  Sent Request
                </Button>
              )}

              {canChat && (
                <Button
                  variant="gold"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage?.();
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Now
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) {
                    onViewProfile();
                  } else {
                    window.scrollTo(0, 0);
                    router.push(`/profile/${profile.id}`);
                  }
                }}
              >
                <Eye className="w-4 h-4" />
                View Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GlassProfileCard;
