import { motion } from "framer-motion";
import { LucideIcon, Heart, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionPath }: EmptyStateProps) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Animated Icon Container */}
      <motion.div
        className="relative mb-8"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-3xl scale-150" />
        
        {/* Icon Circle */}
        <motion.div
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-accent-rose to-accent-gold flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className="w-16 h-16 text-primary" />
          
          {/* Floating Hearts */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                y: [-20, -60],
                x: [(i - 1) * 20, (i - 1) * 30],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <Heart className="w-4 h-4 text-primary fill-primary" />
            </motion.div>
          ))}

          {/* Sparkles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                top: `${20 + (i % 2) * 60}%`,
                left: `${10 + i * 25}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              <Sparkles className="w-4 h-4 text-secondary" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-2xl font-bold text-foreground mb-3 text-center"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md mb-6"
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {actionLabel && actionPath && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="hero" onClick={() => router.push(actionPath)}>
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
