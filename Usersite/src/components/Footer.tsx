"use client";

import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Youtube, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Thanks for subscribing! 💕", {
      description: "You'll receive our latest updates and tips.",
    });
    setEmail("");
  };

  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Services", href: "/services" },
      { name: "Membership", href: "/membership" },
      { name: "Contact", href: "/contact" },
    ],
    services: [
      { name: "Matrimony Services", href: "/search" },
      { name: "Wedding Services", href: "/" },
      { name: "Astrology Match", href: "/" },
      { name: "Premium Matchmaking", href: "/membership" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
  ];

  return (
    <footer className="bg-gradient-to-b from-accent-rose to-accent-pink relative overflow-hidden">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

      {/* Floating Sparkles */}
      {[...Array(4)].map((_, i) => (
        <Sparkles
          key={i}
          className="absolute text-secondary/20 animate-sparkle"
          style={{
            left: `${20 + i * 20}%`,
            top: `${20 + (i % 2) * 30}%`,
            width: `${16 + i * 4}px`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Newsletter Section */}
      <div className="bg-primary py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMTggMCAxMC45NCA4LjA2IDE4IDE4IDE4IDkuOTQgMCAxOC04LjA2IDE4LTE4IDAtOS45NC04LjA2LTE4LTE4LTE4eiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
        
        {/* Floating Hearts */}
        {[...Array(3)].map((_, i) => (
          <Heart
            key={i}
            className="absolute text-white/10 fill-white/10 animate-float"
            style={{
              left: `${15 + i * 30}%`,
              top: `${20 + (i % 2) * 40}%`,
              width: `${24 + i * 8}px`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                Get Marriage Tips & Updates
              </h3>
              <p className="text-primary-foreground/80">
                Subscribe to receive relationship advice and exclusive offers
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full sm:w-72 pl-12 pr-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-secondary"
                />
              </div>
              <Button type="submit" variant="gold" size="lg" className="gap-2 group">
                Subscribe
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-4 pt-10 sm:pt-16 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="relative">
                <Heart className="w-8 h-8 text-primary fill-primary group-hover:animate-heart-beat" />
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-secondary animate-sparkle" />
              </div>
              <span className="font-serif text-2xl font-bold text-primary">
                Toqse <span className="text-secondary">Matrimony</span>
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed mb-5">
              India's most trusted matrimony service helping millions find their perfect life partner. 
              Begin your beautiful journey towards forever love.
            </p>
            {/* Download Our App - below brand content, layout like reference image */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
              <span className="font-serif text-lg font-bold text-foreground">Download Our App:</span>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors hover-lift">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-tight">Download on</div>
                    <div className="text-xs font-semibold leading-tight">App Store</div>
                  </div>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors hover-lift">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35l9.64 9.85-9.64 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-4.61L5.3 22.18l8.56-8.56 2.95 2.27zm1.94-11.78c.34.18.58.51.58.89v14c0 .38-.24.71-.58.89l-7.49-7.5 7.49-7.5zM5.3 1.82L16.81 8.1l-2.95 2.27L5.3 1.82z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-tight">Get it on</div>
                    <div className="text-xs font-semibold leading-tight">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-serif text-lg font-bold text-foreground mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-bold text-foreground mb-5">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-bold text-foreground mb-5">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:+917907240062" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  7907240062, 6282857276
                </a>
              </li>
              <li>
                <a href="mailto:aiswarya@aiswaryamatrimonials.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  aiswarya@aiswaryamatrimonials.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Toqse Marriage Bureau,<br />
                  Near Private Bus Stand,<br />
                  Cherthala – 688524
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Follow Us */}
        <div className="border-t border-primary/10 mt-6 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-1 font-bold">
              © 2026 Toqse Matrimony. All rights reserved.
            </p>
            <Link href="/terms-conditions" className="font-medium text-foreground hover:text-primary transition-colors">
              Terms and Conditions
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-foreground font-medium">Follow Us:</span>
              <div className="flex gap-2">
                {socialLinks.map((social, i) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
