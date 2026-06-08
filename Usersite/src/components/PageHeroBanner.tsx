import { LucideIcon } from "lucide-react";

interface PageHeroBannerProps {
  tagLabel: string;
  TagIcon: LucideIcon;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  backgroundImage?: string;
}

const PageHeroBanner = ({
  tagLabel,
  TagIcon,
  titlePart1,
  titleHighlight,
  description,
  backgroundImage = "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1920&h=800&fit=crop",
}: PageHeroBannerProps) => {
  return (
    <section className="pt-28 pb-20 relative overflow-hidden min-h-[400px] flex items-center">
      {/* Full visible background image */}
      <div className="absolute inset-0">
        <img src={backgroundImage} alt="" className="w-full h-full object-cover" />
        {/* Light scrim so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/35" />
      </div>
      <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
          <TagIcon className="w-4 h-4 text-secondary animate-sparkle" />
          <span className="text-sm font-medium text-primary">{tagLabel}</span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.1s" }}>
          {titlePart1} <span className="text-[#FCD34D] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{titleHighlight}</span>
        </h1>
        <p className="text-white/95 max-w-2xl mx-auto text-lg animate-fade-in-up drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.2s" }}>
          {description}
        </p>
      </div>
    </section>
  );
};

export default PageHeroBanner;
