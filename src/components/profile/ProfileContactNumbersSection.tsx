import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import ProfileFormField, {
  fieldError,
  type ProfileFieldErrors,
} from "@/components/profile/ProfileFormField";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type ProfileContactField = "mobile" | "familyContact" | "familyContact2";

interface ProfileContactNumbersSectionProps {
  mobile: string;
  familyContact: string;
  familyContact2: string;
  onChange: (field: ProfileContactField, value: string) => void;
  errors?: ProfileFieldErrors;
}

export default function ProfileContactNumbersSection({
  mobile,
  familyContact,
  familyContact2,
  onChange,
  errors,
}: ProfileContactNumbersSectionProps) {
  const [showSecondary, setShowSecondary] = useState(() => Boolean(familyContact));
  const [showWhatsapp, setShowWhatsapp] = useState(() => Boolean(familyContact2));

  useEffect(() => {
    if (familyContact) setShowSecondary(true);
  }, [familyContact]);

  useEffect(() => {
    if (familyContact2) setShowWhatsapp(true);
  }, [familyContact2]);

  const canAdd = !showSecondary || !showWhatsapp;

  const handleAdd = () => {
    if (!showSecondary) {
      setShowSecondary(true);
      return;
    }
    if (!showWhatsapp) setShowWhatsapp(true);
  };

  const removeSecondary = () => {
    onChange("familyContact", "");
    setShowSecondary(false);
  };

  const removeWhatsapp = () => {
    onChange("familyContact2", "");
    setShowWhatsapp(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="profile-field-mobile">
            Primary Number (Login) *
          </Label>
          {canAdd && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs shrink-0"
              onClick={handleAdd}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
        <PhoneInput
          id="profile-field-mobile"
          value={mobile}
          onChange={(v) => onChange("mobile", v)}
          invalid={Boolean(fieldError(errors, "mobile"))}
        />
        {fieldError(errors, "mobile") && (
          <p className="text-xs text-destructive">{fieldError(errors, "mobile")}</p>
        )}
      </div>

      {showSecondary && (
        <ProfileFormField
          label="Secondary Phone (Optional)"
          error={fieldError(errors, "familyContact")}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <PhoneInput
                id="profile-field-familyContact"
                value={familyContact}
                onChange={(v) => onChange("familyContact", v)}
                invalid={Boolean(fieldError(errors, "familyContact"))}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground"
              onClick={removeSecondary}
              aria-label="Remove secondary phone"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ProfileFormField>
      )}

      {showWhatsapp && (
        <ProfileFormField
          label="Whatsapp Number (Optional)"
          error={fieldError(errors, "familyContact2")}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <PhoneInput
                id="profile-field-familyContact2"
                value={familyContact2}
                onChange={(v) => onChange("familyContact2", v)}
                invalid={Boolean(fieldError(errors, "familyContact2"))}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground"
              onClick={removeWhatsapp}
              aria-label="Remove WhatsApp number"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ProfileFormField>
      )}
    </div>
  );
}
