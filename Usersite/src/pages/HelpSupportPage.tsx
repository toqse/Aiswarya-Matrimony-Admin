"use client";

import { motion } from "framer-motion";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  FileText,
  Shield,
  Clock,
} from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "How do I upgrade my plan?",
    a: "Go to Plans and Pricing from the sidebar, choose your desired plan, and complete payment. Your plan will activate instantly.",
  },
  {
    q: "How can I hide my profile temporarily?",
    a: "Go to Settings → Privacy and toggle 'Hide Profile'. Your profile will be invisible to other members until you turn it back on.",
  },
  {
    q: "What happens when someone sends me an interest?",
    a: "You'll receive a notification and can view it under Interests → Received. You can accept, decline, or shortlist the profile.",
  },
  {
    q: "How do I contact a match?",
    a: "If you're on a Gold or Diamond plan, contact details are visible. Otherwise, upgrade your plan to unlock phone numbers and emails.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund requests can be made within 7 days of purchase if you haven't used premium features. Contact support for processing.",
  },
  {
    q: "How is my data protected?",
    a: "We use end-to-end encryption and follow strict privacy policies. Your data is never shared with third parties without consent.",
  },
];

const HelpSupportPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-secondary">
          Help & Support
        </h1>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Phone,
              label: "Call Us",
              value: "+91 123 456 7890",
              color: "from-primary/10 to-accent-rose",
            },
            {
              icon: Mail,
              label: "Email Us",
              value: "support@aiswarya.com",
              color: "from-secondary/10 to-accent-gold/30",
            },
            {
              icon: Clock,
              label: "Working Hours",
              value: "Mon-Sat, 9AM-6PM",
              color: "from-green-50 to-emerald-50",
            },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 border border-primary/10 text-center`}
            >
              <c.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="font-semibold text-foreground text-sm mt-1">
                {c.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: FileText, label: "User Guide" },
            { icon: Shield, label: "Safety Tips" },
            { icon: MessageCircle, label: "Live Chat" },
            { icon: HelpCircle, label: "Report Issue" },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-primary/10 hover:border-secondary/40 hover:shadow-card transition-all hover-lift"
            >
              <item.icon className="w-6 h-6 text-secondary" />
              <span className="text-xs font-medium text-foreground">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-card rounded-3xl shadow-card border border-primary/10 overflow-hidden">
          <div className="p-5 border-b border-primary/10">
            <h2 className="font-serif text-lg font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-primary/5">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent-rose/20 transition-colors text-left"
                >
                  <span className="font-medium text-foreground text-sm">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-4 pb-4 text-sm text-muted-foreground"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default HelpSupportPage;
