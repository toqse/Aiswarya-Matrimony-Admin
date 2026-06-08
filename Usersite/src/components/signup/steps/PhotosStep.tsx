"use client";

import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { Image as ImageIcon, IdCard, Smartphone, Users, PlusCircle, Check, FileImage } from "lucide-react";
import { toast } from "sonner";
import PhotoCropDialog, {
  type PhotoCropDialogState,
} from "@/components/signup/steps/PhotoCropDialog";
import { cn } from "@/lib/utils";

/** width / height for each slot (used by cropper and mismatch detection). */
const SLOTS = [
  {
    key: "full",
    label: "Full Photo",
    required: true,
    ratioLabel: "1 : 1",
    aspect: 1,
    aspectClass: "aspect-square",
    icon: ImageIcon,
  },
  {
    key: "passport",
    label: "Passport Photo",
    required: true,
    ratioLabel: "4 : 5",
    aspect: 4 / 5,
    aspectClass: "aspect-[4/5]",
    icon: IdCard,
  },
  {
    key: "selfie",
    label: "Selfie",
    required: false,
    ratioLabel: "1 : 1",
    aspect: 1,
    aspectClass: "aspect-square",
    icon: Smartphone,
  },
  {
    key: "family",
    label: "Family Photo",
    required: false,
    ratioLabel: "20 : 9",
    aspect: 20 / 9,
    aspectClass: "aspect-[20/9]",
    icon: Users,
  },
] as const;

const AADHAAR_SLOTS = [
  { key: "aadhaar_front", label: "Aadhaar Front", required: false, icon: FileImage },
  { key: "aadhaar_back", label: "Aadhaar Back", required: false, icon: FileImage },
] as const;

export interface PhotoSlotValue {
  file: File;
  previewUrl: string;
}

interface Props {
  photos: Record<string, PhotoSlotValue>;
  setPhotos: Dispatch<SetStateAction<Record<string, PhotoSlotValue>>>;
  onSkipOrCompleteLater?: () => void;
}

const PhotosStep = ({
  photos,
  setPhotos,
  onSkipOrCompleteLater,
}: Props) => {
  const [cropState, setCropState] = useState<PhotoCropDialogState | null>(null);
  const cropLoadRequestId = useRef(0);

  const updateSlot = useCallback(
    (key: string, file: File) => {
      setPhotos((prev) => {
        const next = { ...prev };
        const existing = next[key];
        if (existing?.previewUrl) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        const previewUrl = URL.createObjectURL(file);
        next[key] = { file, previewUrl };
        return next;
      });
    },
    [setPhotos],
  );

  const removeSlot = useCallback(
    (key: string) => {
      setPhotos((prev) => {
        const next = { ...prev };
        const existing = next[key];
        if (existing?.previewUrl) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        delete next[key];
        return next;
      });
    },
    [setPhotos],
  );

  const dismissCrop = useCallback(() => {
    setCropState((s) => {
      if (s?.src) URL.revokeObjectURL(s.src);
      return null;
    });
  }, []);

  const handleApplyCropped = useCallback(
    (slotKey: string, file: File) => {
      setCropState((s) => {
        if (s?.src) URL.revokeObjectURL(s.src);
        return null;
      });
      updateSlot(slotKey, file);
    },
    [updateSlot],
  );

  const processMainSlotFile = useCallback(
    (
      slot: (typeof SLOTS)[number],
      file: File,
    ) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      const requestId = ++cropLoadRequestId.current;
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        if (requestId !== cropLoadRequestId.current) {
          URL.revokeObjectURL(url);
          return;
        }
        // Always open cropper for main slots so behavior is consistent
        // across repeated uploads and devices.
        setCropState((prev) => {
          if (prev?.src) URL.revokeObjectURL(prev.src);
          return {
            src: url,
            aspect: slot.aspect,
            slotKey: slot.key,
            fileName: file.name,
            label: slot.label,
          };
        });
      };
      img.onerror = () => {
        if (requestId !== cropLoadRequestId.current) {
          URL.revokeObjectURL(url);
          return;
        }
        URL.revokeObjectURL(url);
        toast.error("Could not read this image.");
      };
      img.src = url;
    },
    [updateSlot],
  );

  return (
    <>
      <PhotoCropDialog
        state={cropState}
        onClose={dismissCrop}
        onApplyCropped={handleApplyCropped}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-1 text-left">Add Photos</h1>
          <p className="text-muted-foreground text-sm text-left">
            Photos improve your match rate. If a photo doesn&apos;t match the suggested shape, you can crop it to fit.
          </p>
        </div>
        {onSkipOrCompleteLater && (
          <button
            type="button"
            onClick={onSkipOrCompleteLater}
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            Skip / Complete later
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {SLOTS.map(({ key, label, required, ratioLabel, aspectClass, icon: Icon }) => (
          <label
            key={key}
            className={cn(
              "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer",
              aspectClass,
              "min-h-[120px] max-h-[280px]",
              photos[key]
                ? "border-primary/30 bg-primary/5"
                : "border-primary/20 bg-white hover:border-primary/40 hover:bg-accent-rose/30",
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                const slot = SLOTS.find((s) => s.key === key);
                if (file && slot) processMainSlotFile(slot, file);
                e.target.value = "";
              }}
            />
            {photos[key] ? (
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img src={photos[key].previewUrl} alt={label} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    removeSlot(key);
                  }}
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm text-white hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-1 flex-col items-center justify-center px-4 py-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-center text-sm font-semibold text-foreground">
                    {label}
                    {required ? " *" : ""}
                  </span>
                  <span className="mt-0.5 text-center text-xs text-muted-foreground">{ratioLabel}</span>
                  <span className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    <PlusCircle className="h-4 w-4" /> Add photo
                  </span>
                </div>
              </>
            )}
          </label>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-primary/10 bg-white p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="font-serif text-lg font-bold text-foreground">ID Verification (Aadhaar)</h2>
          <span className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
            OPTIONAL
          </span>
        </div>
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-foreground">
          Aadhaar front &amp; back photo
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AADHAAR_SLOTS.map(({ key, label, required, icon: Icon }) => (
            <label
              key={key}
              className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer ${
                photos[key]
                  ? "border-primary/30 bg-primary/5"
                  : "border-primary/20 bg-white hover:border-primary/40 hover:bg-accent-rose/30"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please choose an image file.");
                    } else {
                      updateSlot(key, file);
                    }
                  }
                  e.target.value = "";
                }}
              />
              {photos[key] ? (
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <img src={photos[key].previewUrl} alt={label} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeSlot(key);
                    }}
                    className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm text-white hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-center text-sm font-semibold text-foreground">
                    {label}
                    {required ? " *" : ""}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                    <PlusCircle className="h-4 w-4" /> Upload photo
                  </span>
                </>
              )}
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
          <p className="text-sm text-muted-foreground">
            Verified badge shown on your profile. Stored securely in app memory.
          </p>
        </div>
      </div>
    </>
  );
};

export default PhotosStep;
