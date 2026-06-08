import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, AlertTriangle, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLOTS = [
  { key: "profile", label: "Profile Photo", required: true, icon: "👤", desc: "Clear face photo" },
  { key: "closeup", label: "Close-up", required: false, icon: "🤳", desc: "Casual close-up" },
  { key: "family", label: "Family", required: false, icon: "👨‍👩‍👧", desc: "Family photo" },
  { key: "fullbody", label: "Full Body", required: false, icon: "🧍", desc: "Full-length photo" },
];

const GUIDELINES_DO = [
  "Use recent, clear photos",
  "Face should be clearly visible",
  "Well-lit, natural lighting preferred",
  "Solo photos for profile picture",
];

const GUIDELINES_DONT = [
  "No sunglasses or face coverings",
  "No group photos as profile",
  "No heavily filtered images",
  "No copyrighted or celebrity photos",
];

const UploadPhotosModal = ({ open, onOpenChange }: Props) => {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const simulateUpload = useCallback((slotKey: string, file: File) => {
    setUploading(slotKey);
    setProgress(0);
    const reader = new FileReader();
    reader.onload = () => {
      const start = Date.now();
      const duration = 1500;
      const tick = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(100, (elapsed / duration) * 100);
        setProgress(p);
        if (p < 100) requestAnimationFrame(tick);
        else {
          setPhotos(prev => ({ ...prev, [slotKey]: reader.result as string }));
          setUploading(null);
          setProgress(0);
          toast.success(`${SLOTS.find(s => s.key === slotKey)?.label} uploaded!`);
        }
      };
      requestAnimationFrame(tick);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (slotKey: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    simulateUpload(slotKey, file);
  };

  const handleDrop = (slotKey: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(slotKey, file);
  };

  const handleRemove = (slotKey: string) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const uploadCount = Object.keys(photos).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border border-primary/20 shadow-elevated bg-background">
        <DialogHeader className="p-6 pb-3 border-b border-primary/10">
          <DialogTitle className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
            <Camera className="w-6 h-6" /> Upload Photos
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Add up to 4 photos to make your profile stand out
          </p>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && activeSlot) handleFileSelect(activeSlot, file);
            e.target.value = "";
          }}
        />

        <div className="p-6 space-y-6">
          {/* Photo Slots */}
          <div className="grid grid-cols-2 gap-4">
            {SLOTS.map((slot) => (
              <motion.div
                key={slot.key}
                layout
                className={`relative rounded-2xl border-2 border-dashed p-4 text-center transition-all min-h-[160px] flex flex-col items-center justify-center cursor-pointer ${
                  dragOver === slot.key
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : photos[slot.key]
                    ? "border-green-400 bg-green-50/50"
                    : "border-primary/20 hover:border-primary/40 bg-card"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(slot.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(slot.key, e)}
                onClick={() => {
                  if (!photos[slot.key] && !uploading) {
                    setActiveSlot(slot.key);
                    fileInputRef.current?.click();
                  }
                }}
              >
                {uploading === slot.key ? (
                  <div className="w-full space-y-2">
                    <Upload className="w-8 h-8 text-primary mx-auto animate-bounce" />
                    <p className="text-sm font-medium text-primary">Uploading...</p>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                  </div>
                ) : photos[slot.key] ? (
                  <>
                    <img
                      src={photos[slot.key]}
                      alt={slot.label}
                      className="w-full h-28 object-cover rounded-xl mb-2"
                    />
                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                      <Check className="w-3 h-3" /> Uploaded
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(slot.key); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2">{slot.icon}</span>
                    <p className="text-sm font-semibold text-foreground">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.desc}</p>
                    {slot.required && (
                      <span className="mt-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Required</span>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">Drag & drop or click to upload</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>

          {/* Guidelines */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-50/50 border border-green-200/50">
              <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                <Check className="w-4 h-4" /> Do&apos;s
              </h4>
              <ul className="space-y-1.5">
                {GUIDELINES_DO.map((g, i) => (
                  <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" /> {g}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/50">
              <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Don&apos;ts
              </h4>
              <ul className="space-y-1.5">
                {GUIDELINES_DONT.map((g, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <X className="w-3 h-3 mt-0.5 flex-shrink-0" /> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary/10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <Image className="w-4 h-4 inline mr-1" />
            {uploadCount} of {SLOTS.length} photos uploaded
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="hero"
              onClick={() => {
                if (!photos.profile) {
                  toast.error("Profile photo is required");
                  return;
                }
                toast.success(`${uploadCount} photo(s) saved!`);
                onOpenChange(false);
              }}
            >
              Save {uploadCount > 0 ? `(${uploadCount} photos)` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPhotosModal;
