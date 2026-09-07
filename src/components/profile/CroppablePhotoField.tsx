import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import ProfileFormField, {
  fieldError,
  invalidInputClass,
  type ProfileFieldErrors,
} from "@/components/profile/ProfileFormField";
import PhotoCropDialog, {
  type PhotoCropDialogState,
} from "@/components/profile/PhotoCropDialog";

export type ProfilePhotoKey =
  | "full_photo"
  | "passport_photo"
  | "profile_photo"
  | "selfie_photo"
  | "family_photo"
  | "aadhaar_front"
  | "aadhaar_back";

const CROP_SLOTS = [
  {
    key: "profile_photo",
    label: "Profile Photo",
    required: true,
    ratioLabel: "1 : 1",
    aspect: 1,
  },
  {
    key: "full_photo",
    label: "Full Photo",
    required: true,
    ratioLabel: "4 : 5",
    aspect: 4 / 5,
  },
  {
    key: "selfie_photo",
    label: "Selfie Photo",
    required: false,
    ratioLabel: "1 : 1",
    aspect: 1,
  },
  {
    key: "family_photo",
    label: "Family Photo",
    required: false,
    ratioLabel: "20 : 9",
    aspect: 20 / 9,
  },
] as const;

const PLAIN_SLOTS: { key: ProfilePhotoKey; label: string; fullWidth?: boolean }[] = [
  { key: "passport_photo", label: "Passport Photo" },
  { key: "aadhaar_front", label: "Aadhaar Front" },
  { key: "aadhaar_back", label: "Aadhaar Back", fullWidth: true },
];

type CropSlot = (typeof CROP_SLOTS)[number];

function PhotoPreview({
  file,
  existingUrl,
  label,
}: {
  file: File | null;
  existingUrl?: string | null;
  label: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const shownUrl = preview ?? existingUrl ?? null;

  if (shownUrl) {
    return (
      <a href={shownUrl} target="_blank" rel="noreferrer" className="shrink-0">
        <img
          src={shownUrl}
          alt={label}
          className="h-20 w-20 rounded-md border object-cover"
        />
      </a>
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed text-center text-[10px] text-muted-foreground">
      No image
    </div>
  );
}

function CroppablePhotoField({
  slot,
  file,
  existingUrl,
  required,
  error,
  onPick,
}: {
  slot: CropSlot;
  file: File | null;
  existingUrl?: string | null;
  required: boolean;
  error?: string;
  onPick: (slot: CropSlot, file: File) => void;
}) {
  return (
    <ProfileFormField
      label={slot.label}
      required={required}
      error={error}
    >
      <p className="text-xs text-muted-foreground">Crop to {slot.ratioLabel}</p>
      <div className="mt-1 flex items-start gap-3">
        <PhotoPreview file={file} existingUrl={existingUrl} label={slot.label} />
        <div className="flex-1">
          <Input
            id={`profile-field-${slot.key}`}
            type="file"
            accept="image/*"
            className={invalidInputClass(error)}
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              const next = e.target.files?.[0];
              if (next) onPick(slot, next);
              e.target.value = "";
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {file ? "New image selected" : existingUrl ? "Current image" : "No image uploaded"}
          </p>
        </div>
      </div>
    </ProfileFormField>
  );
}

function PlainPhotoField({
  photoKey,
  label,
  file,
  existingUrl,
  onSelect,
}: {
  photoKey: ProfilePhotoKey;
  label: string;
  file: File | null;
  existingUrl?: string | null;
  onSelect: (file: File | null) => void;
}) {
  return (
    <ProfileFormField label={label}>
      <div className="mt-1 flex items-start gap-3">
        <PhotoPreview file={file} existingUrl={existingUrl} label={label} />
        <div className="flex-1">
          <Input
            id={`profile-field-${photoKey}`}
            type="file"
            accept="image/*"
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {file ? "New image selected" : existingUrl ? "Current image" : "No image uploaded"}
          </p>
        </div>
      </div>
    </ProfileFormField>
  );
}

export interface ProfilePhotosSectionProps {
  files: Record<ProfilePhotoKey, File | null>;
  existingUrls?: Partial<Record<ProfilePhotoKey, string | null>>;
  errors?: ProfileFieldErrors;
  requirePhotos?: boolean;
  onFileChange: (key: ProfilePhotoKey, file: File | null) => void;
  onCroppingChange?: (cropping: boolean) => void;
}

export default function ProfilePhotosSection({
  files,
  existingUrls,
  errors,
  requirePhotos = false,
  onFileChange,
  onCroppingChange,
}: ProfilePhotosSectionProps) {
  const [cropState, setCropState] = useState<PhotoCropDialogState | null>(null);
  const cropLoadRequestId = useRef(0);

  useEffect(() => {
    onCroppingChange?.(!!cropState);
  }, [cropState, onCroppingChange]);

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
      onFileChange(slotKey as ProfilePhotoKey, file);
    },
    [onFileChange],
  );

  const processCropSlotFile = useCallback((slot: CropSlot, file: File) => {
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
  }, []);

  return (
    <>
      <PhotoCropDialog
        state={cropState}
        onClose={dismissCrop}
        onApplyCropped={handleApplyCropped}
      />

      <div>
        <p className="mb-3 text-sm font-medium">Photos &amp; Documents</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CROP_SLOTS.map((slot) => (
            <CroppablePhotoField
              key={slot.key}
              slot={slot}
              file={files[slot.key]}
              existingUrl={existingUrls?.[slot.key]}
              required={Boolean(slot.required && requirePhotos)}
              error={fieldError(errors, slot.key)}
              onPick={processCropSlotFile}
            />
          ))}
          {PLAIN_SLOTS.map(({ key, label, fullWidth }) => (
            <div key={key} className={fullWidth ? "sm:col-span-2" : undefined}>
              <PlainPhotoField
                photoKey={key}
                label={label}
                file={files[key]}
                existingUrl={existingUrls?.[key]}
                onSelect={(file) => onFileChange(key, file)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
