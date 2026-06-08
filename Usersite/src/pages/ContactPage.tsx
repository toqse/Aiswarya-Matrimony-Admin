"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Send, Sparkles } from "lucide-react";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill in all required fields"); return; }
    toast.success("Message sent successfully! 💕", { description: "We'll get back to you shortly." });
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Head Office",
      details: [
        "Toqse Marriage Bureau",
        "Near Private Bus Stand",
        "Cherthala – 688524",
        "Customer Care: 7907240062",
      ],
    },
    {
      icon: Mail,
      title: "Email",
      details: ["aiswarya@aiswaryamatrimonials.com"],
    },
    {
      icon: MapPin,
      title: "Branch Office",
      details: [
        "Pothanicad",
        "Moovattupuzha, Ernakulam",
        "Branch Contact: 6282857276",
      ],
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: ["Mon - Sat: 9:00 AM - 5:00 PM", "Sunday: Closed"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with wedding background */}
      <section className="pt-28 pb-20 relative overflow-hidden min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img src="/images/banner.png" alt="Wedding couple" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        </div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
            <span className="text-sm font-medium text-primary">Get In Touch</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" style={{ animationDelay: "0.1s" }}>
            Contact <span className="text-[#FCD34D] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">Us</span>
          </h1>
          <p className="text-white max-w-2xl mx-auto text-lg animate-fade-in-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ animationDelay: "0.2s" }}>
            Have questions? We'd love to hear from you. Send us a message!
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <motion.div key={info.title} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-card hover-lift flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-gold flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-foreground mb-1">{info.title}</h4>
                    {info.details.map((d, j) => <p key={j} className="text-sm text-muted-foreground">{d}</p>)}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2 bg-white rounded-3xl shadow-card p-8">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-6">Send us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Your Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white" />
                  <input type="email" placeholder="Your Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white" />
                  <input type="text" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white" />
                </div>
                <textarea placeholder="Your Message *" value={form.message} rows={5} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white resize-none" />
                <Button type="submit" variant="hero" size="lg" className="gap-2 group">
                  <Send className="w-5 h-5" /> Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location Map */}
      <section className="py-16 bg-accent-rose/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Our <span className="text-gradient-gold">Location</span></h2>
            <p className="text-muted-foreground">Visit us at our office in Cherthala, Alappuzha, Kerala</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl overflow-hidden shadow-elevated border-4 border-card">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31524.66884302874!2d76.32!3d9.68!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0882cd0a0a0a0b%3A0x3b0882cd0a0a0a0b!2sCherthala%2C%20Kerala!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Toqse Matrimony Location" />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
