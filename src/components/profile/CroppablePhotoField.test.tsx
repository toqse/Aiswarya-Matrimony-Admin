import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePhotosSection, {
  type ProfilePhotoKey,
} from "@/components/profile/CroppablePhotoField";

vi.mock("react-easy-crop", () => ({
  default: () => <div data-testid="cropper" />,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const emptyFiles: Record<ProfilePhotoKey, File | null> = {
  full_photo: null,
  passport_photo: null,
  profile_photo: null,
  selfie_photo: null,
  family_photo: null,
  aadhaar_front: null,
  aadhaar_back: null,
};

describe("ProfilePhotosSection", () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        addEventListener(type: string, cb: () => void) {
          if (type === "load") this.onload = cb;
        }
        set src(_url: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
  });

  it("marks profile and full photo as required", () => {
    render(
      <ProfilePhotosSection
        files={emptyFiles}
        requirePhotos
        onFileChange={() => {}}
      />,
    );
    expect(screen.getByText(/Profile Photo/)).toHaveTextContent("*");
    expect(screen.getByText(/Full Photo/)).toHaveTextContent("*");
    expect(screen.getByText(/Selfie Photo/)).not.toHaveTextContent("*");
    expect(screen.getAllByText("Crop to 1 : 1")).toHaveLength(2);
    expect(screen.getByText("Crop to 4 : 5")).toBeInTheDocument();
  });

  it("opens the crop dialog when a required photo is chosen", async () => {
    render(
      <ProfilePhotosSection
        files={emptyFiles}
        requirePhotos
        onFileChange={() => {}}
      />,
    );
    const input = document.getElementById("profile-field-profile_photo") as HTMLInputElement;
    const file = new File(["fake"], "face.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Adjust crop — Profile Photo/)).toBeInTheDocument();
    });
    expect(screen.getByTestId("cropper")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use photo/i })).toBeInTheDocument();
  });
});
