import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Camera } from "lucide-react";

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop", category: "wedding" },
  { src: "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=400&h=500&fit=crop", category: "couple" },
  { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop", category: "wedding" },
  { src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop", category: "ceremony" },
  { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop", category: "couple" },
  { src: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop", category: "wedding" },
  { src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop", category: "ceremony" },
  { src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop", category: "couple" },
];

const PhotoGallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { ref: revealRef, inView } = useScrollReveal();

  return (
    <section ref={revealRef} className="py-12 sm:py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
            <Camera className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary">Gallery</span>
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Photo <span className="text-gradient-gold">Gallery</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Beautiful moments captured from our successful couples
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 max-w-6xl mx-auto">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.08 }}
              className="mb-4 break-inside-avoid group cursor-pointer"
              onClick={() => setSelectedImage(image.src)}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card hover-lift">
                <img
                  src={image.src}
                  alt={`Gallery ${index + 1}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-medium capitalize">{image.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage.replace(/w=\d+&h=\d+/, "w=1200&h=800")} alt="Gallery preview" className="rounded-2xl max-h-[85vh] object-contain" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-elevated flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PhotoGallery;
