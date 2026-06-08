"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import { Button } from "@/components/ui/button";
import { Heart, Quote, ChevronLeft, ChevronRight, Play, Calendar, MapPin, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  formatWeddingDateDisplay,
  getWebsiteSuccessStories,
  resolveSuccessStoryPhotoUrl,
  type WebsiteSuccessStory,
  WEBSITE_SUCCESS_STORIES_PAGE_SIZE,
} from "@/lib/successStoriesApi";

type DisplayStory = {
  id: number;
  couple: string;
  image: string;
  quote: string;
  location: string;
  marriedDate: string;
  raw: WebsiteSuccessStory;
};

function toDisplayStory(s: WebsiteSuccessStory): DisplayStory {
  return {
    id: s.id,
    couple: s.couple_names,
    image: resolveSuccessStoryPhotoUrl(s.couple_photo) || "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=600&h=400&fit=crop",
    quote: s.description,
    location: s.location,
    marriedDate: formatWeddingDateDisplay(s.wedding_date),
    raw: s,
  };
}

const SuccessStoriesPage = () => {
  const router = useRouter();
  const [apiPage, setApiPage] = useState(1);
  const [stories, setStories] = useState<DisplayStory[]>([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFoundPage, setNotFoundPage] = useState(false);

  const displayPage = apiPage; // 1-based, matches API
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / WEBSITE_SUCCESS_STORIES_PAGE_SIZE)),
    [count]
  );

  const fetchPage = useCallback(async (page: number) => {
    setLoadState("loading");
    setLoadError(null);
    setNotFoundPage(false);
    try {
      const res = await getWebsiteSuccessStories(page);
      const list = (res.data.stories ?? []).map(toDisplayStory);
      setCount(res.data.count);
      setNextUrl(res.data.next);
      setStories(list);
      if (list.length) {
        if (page === 1) {
          setSelectedId((id) => (id && list.some((s) => s.id === id) ? id : list[0]!.id));
        } else {
          setSelectedId(null);
        }
      } else {
        setSelectedId(null);
      }
      setLoadState("idle");
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 404) {
        setNotFoundPage(true);
        setStories([]);
        setCount(0);
        setNextUrl(null);
        setLoadState("idle");
        return;
      }
      setLoadState("error");
      setLoadError(err.message || "Failed to load success stories");
    }
  }, []);

  useEffect(() => {
    void fetchPage(apiPage);
  }, [apiPage, fetchPage]);

  const selectedStory = useMemo(() => {
    if (apiPage !== 1 || !stories.length) return null;
    const pick = selectedId != null ? stories.find((s) => s.id === selectedId) : null;
    return pick ?? stories[0] ?? null;
  }, [apiPage, stories, selectedId]);

  const canPrev = displayPage > 1;
  const canNext = nextUrl != null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHeroBanner
        tagLabel="Real Love Stories"
        TagIcon={Heart}
        titlePart1="Love Stories That"
        titleHighlight="Inspire"
        description="Every love story is beautiful, but yours will be unique."
        backgroundImage="https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=1920&h=800&fit=crop"
      />

      {loadState === "error" && (
        <section className="py-8 bg-rose-50/80 border-b border-primary/10">
          <div className="container mx-auto px-4 text-center text-sm text-foreground">
            <p className="mb-3">{loadError}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchPage(apiPage)}>
              Try again
            </Button>
          </div>
        </section>
      )}

      {notFoundPage && (
        <section className="py-16 text-center text-muted-foreground">
          <div className="container mx-auto px-4">
            <p className="mb-4">This page does not exist or has no stories.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApiPage(1);
              }}
            >
              First page
            </Button>
          </div>
        </section>
      )}

      {loadState === "loading" && !notFoundPage && (
        <section className="py-16 bg-gradient-romantic">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-white/80 rounded-3xl h-80 animate-pulse border border-primary/5" />
          </div>
        </section>
      )}

      {loadState === "idle" && !notFoundPage && selectedStory && apiPage === 1 && (
        <section className="py-16 bg-gradient-romantic relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto animate-scale-in">
              <div className="bg-white rounded-3xl overflow-hidden shadow-elevated border border-primary/5">
                <div className="grid lg:grid-cols-2">
                  <div className="relative h-80 lg:h-auto min-h-[400px] overflow-hidden group">
                    <img
                      src={selectedStory.image}
                      alt={selectedStory.couple}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <button
                      type="button"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/95 rounded-full flex items-center justify-center shadow-elevated hover:scale-110 transition-all animate-pulse-soft"
                    >
                      <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                    </button>
                    <div className="absolute top-6 right-6 w-14 h-14 bg-secondary rounded-full flex items-center justify-center shadow-gold animate-bounce-soft">
                      <Heart className="w-7 h-7 text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center mb-6 shadow-gold animate-glow">
                      <Quote className="w-7 h-7 text-white" />
                    </div>
                    <blockquote className="font-serif text-xl lg:text-2xl text-foreground leading-relaxed mb-8">
                      &ldquo;{selectedStory.quote}&rdquo;
                    </blockquote>
                    <div className="border-t border-primary/10 pt-6">
                      <h3 className="font-serif text-2xl font-bold text-gradient-primary mb-3 flex items-center gap-2">
                        {selectedStory.couple}
                        <Heart className="w-5 h-5 text-primary fill-primary animate-heart-beat" />
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1.5 text-sm bg-accent-gold/50 text-foreground px-3 py-1.5 rounded-full">
                          <Calendar className="w-4 h-4 text-secondary" />
                          {selectedStory.marriedDate}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm bg-accent-rose/50 text-foreground px-3 py-1.5 rounded-full">
                          <MapPin className="w-4 h-4 text-primary" />
                          {selectedStory.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!notFoundPage && (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
            More <span className="text-gradient-gold">Love Stories</span>
          </h2>

          {loadState === "idle" && !notFoundPage && count === 0 && (
            <p className="text-center text-muted-foreground">No success stories to show yet.</p>
          )}

          {loadState === "idle" && !notFoundPage && stories.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  className={`bg-gradient-card rounded-2xl overflow-hidden shadow-card border border-primary/5 hover-lift cursor-pointer group animate-fade-in-up ${
                    apiPage === 1 && selectedStory && selectedStory.id === story.id
                      ? "ring-2 ring-secondary"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => {
                    if (apiPage === 1) setSelectedId(story.id);
                  }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={story.image}
                      alt={story.couple}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-serif text-xl font-bold text-white">{story.couple}</h3>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Heart className="w-6 h-6 text-white fill-white/50 group-hover:fill-white transition-all" />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {story.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {story.marriedDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadState === "idle" && !notFoundPage && totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setApiPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
                className="p-2 rounded-lg bg-accent-rose hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setApiPage(n)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    displayPage === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent-rose hover:bg-primary/10 text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setApiPage((p) => p + 1)}
                disabled={!canNext}
                className="p-2 rounded-lg bg-accent-rose hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      <section className="py-16 bg-gradient-to-r from-primary to-primary-light relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">Ready to Write Your Own Love Story?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">Join thousands of happy couples who found their soulmate on Toqse Matrimony</p>
          <Button variant="gold" size="xl" className="group" onClick={() => router.push("/auth")}>
            Start Your Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuccessStoriesPage;
