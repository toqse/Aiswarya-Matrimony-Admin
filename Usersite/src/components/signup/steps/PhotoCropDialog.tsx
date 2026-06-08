"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/cropImage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface PhotoCropDialogState {
  src: string;
  aspect: number;
  slotKey: string;
  fileName: string;
  label: string;
}

interface PhotoCropDialogProps {
  state: PhotoCropDialogState | null;
  onClose: () => void;
  onApplyCropped: (slotKey: string, file: File) => void;
}

const PhotoCropDialog = ({ state, onClose, onApplyCropped }: PhotoCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (state?.src) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [state?.src]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!state?.src || !croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedImageBlob(state.src, croppedAreaPixels);
      const base =
        state.fileName.replace(/\.[^.]+$/, "") || `photo-${state.slotKey}`;
      const file = new File([blob], `${base}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      onApplyCropped(state.slotKey, file);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-xl" hideCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-serif text-left">
            Adjust crop — {state?.label ?? "Photo"}
          </DialogTitle>
          <p className="text-left text-sm text-muted-foreground">
            Drag to position and use the slider to zoom so your photo fits the frame.
          </p>
        </DialogHeader>

        {state?.src ? (
          <>
            <div className="relative h-[min(50vh,360px)] w-full overflow-hidden rounded-xl bg-black">
              <Cropper
                key={state.src}
                image={state.src}
                crop={crop}
                zoom={zoom}
                aspect={state.aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
              />
            </div>
            <div className="space-y-2 px-1">
              <p className="text-xs font-medium text-muted-foreground">Zoom</p>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
                min={1}
                max={3}
                step={0.01}
              />
            </div>
          </>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!croppedAreaPixels || applying}
          >
            {applying ? "Saving…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCropDialog;
