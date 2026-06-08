"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UsersRound,
  Pencil,
  Minus,
  Plus,
  Heart,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FamilyDetailsStep from "@/components/signup/steps/FamilyDetailsStep";

const defaultFamilyData = {
  familyType: "Nuclear",
  fathersName: "Rajesh Kumar",
  fathersOccupation: "Government Employee",
  mothersName: "Lakshmi",
  mothersOccupation: "Homemaker",
  familyStatus: "Middle Class",
  numberOfBrothers: "1",
  numberOfMarriedBrothers: "0",
  numberOfSisters: "1",
  numberOfMarriedSisters: "0",
  aboutMyFamily: "We are a close-knit family with traditional values.",
};

const FIELD_LABELS: Record<string, string> = {
  familyType: "Family Type",
  fathersName: "Father's Name",
  fathersOccupation: "Father's Occupation",
  mothersName: "Mother's Name",
  mothersOccupation: "Mother's Occupation",
  familyStatus: "Family Status",
  numberOfBrothers: "No. of Brothers",
  numberOfMarriedBrothers: "No. of Married Brothers",
  numberOfSisters: "No. of Sisters",
  numberOfMarriedSisters: "No. of Married Sisters",
  aboutMyFamily: "About My Family",
};

const VIEW_GROUPS: {
  title: string;
  icon: typeof Heart;
  keys: (keyof typeof FIELD_LABELS)[];
}[] = [
  {
    title: "Family overview",
    icon: Sparkles,
    keys: ["familyType", "familyStatus"],
  },
  {
    title: "Parents",
    icon: Heart,
    keys: [
      "fathersName",
      "fathersOccupation",
      "mothersName",
      "mothersOccupation",
    ],
  },
  {
    title: "Siblings",
    icon: Users,
    keys: [
      "numberOfBrothers",
      "numberOfMarriedBrothers",
      "numberOfSisters",
      "numberOfMarriedSisters",
    ],
  },
  { title: "About my family", icon: UsersRound, keys: ["aboutMyFamily"] },
];

const FamilyDetailsPage = () => {
  const [formData, setFormData] = useState(defaultFamilyData);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const displayValue = (key: string) => {
    const v = formData[key as keyof typeof formData];
    return v != null && String(v).trim() !== "" ? String(v) : "—";
  };

  return (
    <div className="space-y-8">
        {/* Page title with gradient accent */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-soft"
              style={{ background: "var(--gradient-gold)" }}
            >
              <UsersRound className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">
                Family Details
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your family information for your profile
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main card with gradient header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-3xl overflow-hidden shadow-elevated bg-card border border-primary/10"
        >
          <div
            className="flex items-center justify-between px-6 py-4 text-white"
            style={{ background: "var(--gradient-gold)" }}
          >
            <span className="font-semibold text-lg tracking-tight">
              Family Details
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditing((e) => !e)}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
                aria-label={isEditing ? "Cancel edit" : "Edit"}
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed((c) => !c)}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <Plus className="w-5 h-5" />
                ) : (
                  <Minus className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="border-t border-primary/10"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(340 60% 99%) 0%, hsl(0 0% 100%) 100%)",
                }}
              >
                <div className="p-6 md:p-8">
                  {isEditing ? (
                    <div className="space-y-6 max-w-xl">
                      <FamilyDetailsStep
                        formData={formData}
                        onChange={handleChange}
                        hideTitle
                      />
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="hero"
                          onClick={() => setIsEditing(false)}
                          className="shadow-soft"
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="border-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {VIEW_GROUPS.map((group, gi) => (
                        <motion.section
                          key={group.title}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.05, duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 text-primary">
                            <group.icon className="w-5 h-5" />
                            <h2 className="font-semibold text-sm uppercase tracking-wider text-foreground/80">
                              {group.title}
                            </h2>
                          </div>
                          <div
                            className={
                              group.keys.length === 1 &&
                              group.keys[0] === "aboutMyFamily"
                                ? "grid grid-cols-1 gap-4"
                                : "grid grid-cols-1 sm:grid-cols-2 gap-4"
                            }
                          >
                            {group.keys.map((key) => (
                              <div
                                key={key}
                                className={`rounded-xl bg-white/80 border border-primary/5 px-4 py-3 shadow-sm ${
                                  key === "aboutMyFamily" ? "min-h-[4rem]" : ""
                                }`}
                              >
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  {FIELD_LABELS[key]}
                                </p>
                                <p
                                  className={`text-sm font-medium ${
                                    displayValue(key) === "—"
                                      ? "text-muted-foreground/70 italic"
                                      : "text-foreground"
                                  } ${key === "aboutMyFamily" ? "whitespace-pre-wrap" : ""}`}
                                >
                                  {displayValue(key)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.section>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
    </div>
  );
};

export default FamilyDetailsPage;
