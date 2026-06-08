import { motion } from "framer-motion";

const LOADER_IMAGES = {
  boy: "https://rn53themes.net/themes/matrimo/images/loder/1.png",
  lady: "https://rn53themes.net/themes/matrimo/images/loder/2.png",
  heart: "https://rn53themes.net/themes/matrimo/images/loder/3.png",
} as const;

const LoadingAnimation = () => {
  // Matches RN53 Matrimo preloader proportions + motion
  const cycle = 1.6;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-romantic overflow-hidden"
      aria-label="Loading"
      role="status"
    >
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-background/40" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Loader scene (same sizing + positions as reference site) */}
        <div className="relative w-[168px] h-[126px]">
          {/* Boy (slides in from left) */}
          <motion.img
            src={LOADER_IMAGES.boy}
            alt="Matrimo loader boy"
            loading="eager"
            className="absolute left-0 bottom-0 w-[92px] select-none pointer-events-none"
            animate={{
              x: [-55, 0, 0, -55],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: cycle,
              times: [0, 0.35, 0.7, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Lady (slides in from right) */}
          <motion.img
            src={LOADER_IMAGES.lady}
            alt="Matrimo loader lady"
            loading="eager"
            className="absolute right-0 bottom-0 w-[52px] select-none pointer-events-none"
            animate={{
              x: [55, 0, 0, 55],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: cycle,
              times: [0, 0.35, 0.7, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Heart (pops in) */}
          <motion.img
            src={LOADER_IMAGES.heart}
            alt="Matrimo loader heart"
            loading="eager"
            className="absolute left-1/2 top-[6px] -translate-x-1/2 w-[40px] select-none pointer-events-none"
            animate={{
              scale: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: cycle,
              times: [0, 0.25, 0.7, 1],
              repeat: Infinity,
              delay: 0.15,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Loading text */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-lg md:text-xl font-serif text-primary"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Finding Your Perfect Match
          </motion.h2>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className={`w-2 h-2 rounded-full ${i % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
                animate={{ y: [0, -7, 0], scale: [1, 1.15, 1] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingAnimation;

