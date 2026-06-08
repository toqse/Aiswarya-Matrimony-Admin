import { useState, useRef, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Heart, ChevronLeft, ChevronRight, Calendar, MapPin, Star, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatWeddingDateDisplay,
  getWebsiteSuccessStories,
  resolveSuccessStoryPhotoUrl,
} from "@/lib/successStoriesApi";

export interface Story {
  id: number;
  couple: string;
  image: string;
  quote: string;
  location: string;
  marriedDate: string;
  yearsOnPlatform: string;
}

export const storiesData: Story[] = [
  {
    id: 1,
    couple: "Rahul & Priya",
    image: "/images/download11.jpg",
    quote: "We found each other on Toqse Matrimony and knew instantly that this was meant to be.",
    location: "Mumbai, India",
    marriedDate: "December 2023",
    yearsOnPlatform: "6 months",
  },
  {
    id: 2,
    couple: "Arjun & Sneha",
    image: "/images/12.jpg",
    quote: "The compatibility matching was spot on! We share the same values and dreams.",
    location: "Delhi NCR",
    marriedDate: "February 2024",
    yearsOnPlatform: "8 months",
  },
  {
    id: 3,
    couple: "Karthik & Meera",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop",
    quote: "From the first message to our wedding day, every moment has been magical.",
    location: "Chennai, India",
    marriedDate: "January 2024",
    yearsOnPlatform: "1 year",
  },
  {
    id: 4,
    couple: "Vikram & Ananya",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop",
    quote: "Toqse Matrimony brought us together across continents. Now we're inseparable.",
    location: "Bangalore, India",
    marriedDate: "March 2024",
    yearsOnPlatform: "4 months",
  },
  {
    id: 5,
    couple: "Aditya & Kavya",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
    quote: "Our love story started with a simple hello. Now we're building a life together.",
    location: "Hyderabad, India",
    marriedDate: "November 2023",
    yearsOnPlatform: "10 months",
  },
];

// Flower Bouquet SVG Component
const FlowerBouquet = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left flower cluster */}
    <g className="animate-float" style={{ animationDelay: "0s" }}>
      <circle cx="25" cy="25" r="8" fill="#FFB020" opacity="0.9" />
      <circle cx="18" cy="20" r="6" fill="#F8E0E6" />
      <circle cx="32" cy="20" r="6" fill="#FFE4E1" />
      <circle cx="20" cy="30" r="5" fill="#8B2252" opacity="0.7" />
      <circle cx="30" cy="32" r="5" fill="#FFB020" opacity="0.8" />
    </g>
    
    {/* Center flowers */}
    <g className="animate-float" style={{ animationDelay: "0.3s" }}>
      <circle cx="60" cy="20" r="10" fill="#8B2252" opacity="0.9" />
      <circle cx="50" cy="15" r="7" fill="#FFB020" />
      <circle cx="70" cy="15" r="7" fill="#F8E0E6" />
      <circle cx="55" cy="28" r="6" fill="#FFE4E1" />
      <circle cx="65" cy="28" r="6" fill="#FFB020" opacity="0.8" />
    </g>
    
    {/* Right flower cluster */}
    <g className="animate-float" style={{ animationDelay: "0.6s" }}>
      <circle cx="95" cy="25" r="8" fill="#F8E0E6" />
      <circle cx="88" cy="20" r="6" fill="#FFB020" />
      <circle cx="102" cy="20" r="6" fill="#8B2252" opacity="0.8" />
      <circle cx="90" cy="32" r="5" fill="#FFE4E1" />
      <circle cx="100" cy="30" r="5" fill="#FFB020" opacity="0.7" />
    </g>
    
    {/* Small accent flowers */}
    <circle cx="40" cy="35" r="4" fill="#FFB020" opacity="0.6" className="animate-pulse-soft" />
    <circle cx="80" cy="35" r="4" fill="#8B2252" opacity="0.5" className="animate-pulse-soft" />
    
    {/* Leaves */}
    <ellipse cx="35" cy="50" rx="8" ry="4" fill="#4a7c59" opacity="0.7" transform="rotate(-30 35 50)" />
    <ellipse cx="85" cy="50" rx="8" ry="4" fill="#4a7c59" opacity="0.7" transform="rotate(30 85 50)" />
    <ellipse cx="60" cy="55" rx="10" ry="5" fill="#5a8f69" opacity="0.6" />
    
    {/* Sparkles */}
    <circle cx="15" cy="10" r="2" fill="#FFB020" className="animate-sparkle" />
    <circle cx="105" cy="10" r="2" fill="#FFB020" className="animate-sparkle" style={{ animationDelay: "0.5s" }} />
    <circle cx="60" cy="5" r="2.5" fill="#8B2252" className="animate-sparkle" style={{ animationDelay: "1s" }} />
  </svg>
);

const CoupleCard = ({ story, index }: { story: Story; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <motion.div
      className="relative flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] h-[400px] md:h-[450px] lg:h-[500px] cursor-pointer overflow-hidden group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <motion.img
        src={story.image}
        alt={story.couple}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ 
          scale: isHovered ? 1.1 : 1,
          filter: isHovered ? "brightness(0.7)" : "brightness(1)"
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      
      {/* Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        animate={{ opacity: isHovered ? 1 : 0.3 }}
        transition={{ duration: 0.4 }}
      />

      {/* Hover Content */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Flower Bouquet - Top */}
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-32 md:w-40"
              initial={{ y: -50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <FlowerBouquet className="w-full h-auto drop-shadow-lg" />
            </motion.div>

            {/* Center Content */}
            <motion.div
              className="text-center px-6 z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Couple Name */}
              <motion.h3 
                className="font-serif text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {story.couple}
              </motion.h3>

              {/* Location */}
              <motion.p 
                className="text-white/90 text-sm md:text-base tracking-widest uppercase mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {story.location}
              </motion.p>

              {/* View More Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="gold"
                  size="sm"
                  className="shadow-gold hover:scale-105 transition-transform"
                  onClick={() => router.push("/success-stories")}
                >
                  View More
                </Button>
              </motion.div>
            </motion.div>

            {/* Flower Bouquet - Bottom */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 md:w-40 rotate-180"
              initial={{ y: 50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5, ease: "backOut", delay: 0.1 }}
            >
              <FlowerBouquet className="w-full h-auto drop-shadow-lg" />
            </motion.div>

            {/* Floating Hearts */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  y: [0, -30, -60],
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.5 + i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <Heart className="w-4 h-4 text-secondary fill-secondary" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default State - Bottom Info */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent"
        animate={{ opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-white/80 text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-secondary fill-secondary" />
          {story.marriedDate}
        </p>
      </motion.div>
    </motion.div>
  );
};

const SuccessStories = () => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { ref: revealRef, inView } = useScrollReveal();
  const [homeStories, setHomeStories] = useState<Story[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getWebsiteSuccessStories(1);
        const list = (res.data.stories ?? [])
          .slice(0, 8)
          .map(
            (s): Story => ({
              id: s.id,
              couple: s.couple_names,
              image: resolveSuccessStoryPhotoUrl(s.couple_photo) || "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800&h=600&fit=crop",
              quote: s.description,
              location: s.location,
              marriedDate: formatWeddingDateDisplay(s.wedding_date),
              yearsOnPlatform: "—",
            })
          );
        if (!cancelled && list.length) setHomeStories(list);
      } catch {
        if (!cancelled) setHomeStories(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 380;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="stories" ref={revealRef} className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-pink/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-gold/40 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-rose/30 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      {/* Floating Hearts */}
      {[...Array(5)].map((_, i) => (
        <Heart
          key={i}
          className="absolute text-primary/10 fill-primary/10 animate-float"
          style={{
            left: `${10 + i * 20}%`,
            top: `${15 + (i % 2) * 60}%`,
            width: `${30 + i * 10}px`,
            height: `${30 + i * 10}px`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-rose border border-primary/10 mb-4 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          >
            <Heart className="w-4 h-4 text-primary fill-primary animate-heart-beat" />
            <span className="text-sm font-medium text-primary">Recent Couples</span>
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
          </motion.div>
          <motion.h2 
            className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            Real Love, <span className="text-gradient-primary">Real Stories</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            Hover over our beautiful couples to discover their love stories
          </motion.p>
        </div>

        {/* Couples Carousel */}
        <div className="relative mb-16">
          {/* Navigation Arrows */}
          <motion.button
            onClick={() => scroll("left")}
            className="absolute left-0 md:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-elevated flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all z-20 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-primary group-hover:text-primary-dark" />
          </motion.button>
          <motion.button
            onClick={() => scroll("right")}
            className="absolute right-0 md:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-elevated flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all z-20 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-6 h-6 text-primary group-hover:text-primary-dark" />
          </motion.button>

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth px-8 md:px-12"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {(homeStories ?? storiesData).map((story, index) => (
              <CoupleCard key={story.id} story={story} index={index} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
          {[
            { value: "1M+", label: "Happy Couples", icon: Heart },
            { value: "50+", label: "Daily Weddings", icon: Calendar },
            { value: "98%", label: "Success Rate", icon: Star },
            { value: "4.9★", label: "User Rating", icon: Sparkles },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-5 md:p-6 bg-gradient-card rounded-2xl shadow-card border border-primary/5 hover-lift group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-full bg-accent-rose flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <stat.icon className="w-6 h-6 text-primary fill-primary/50 group-hover:animate-bounce-soft" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-gradient-gold mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        >
          <Button 
            variant="hero" 
            size="lg" 
            className="group"
            onClick={() => router.push("/success-stories")}
          >
            Read All Stories
            <Heart className="w-5 h-5 group-hover:animate-heart-beat" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessStories;
