import { Sparkles } from "lucide-react";
import { labelClass } from "../SignupFormFields";

interface Props {
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onHelpMeWrite: () => void;
  onSkip: () => void;
}

const AboutMeStep = ({ formData, onChange, onHelpMeWrite, onSkip }: Props) => (
  <>
    <div className="text-center mb-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-1">About Me</h1>
      <p className="text-muted-foreground text-sm">AI-generated bio, editable. You can skip or get help to write.</p>
    </div>
    <div>
      <label className={labelClass}>About Me</label>
      <textarea
        name="aboutMe"
        value={formData.aboutMe}
        onChange={onChange}
        placeholder="Write about yourself, your interests, hobbies, values, and what you are looking for..."
        rows={8}
        className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white resize-none"
      />
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button
          type="button"
          onClick={onHelpMeWrite}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Help me write this
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Skip
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {formData.aboutMe.length}/500 characters
      </p>
    </div>
  </>
);

export default AboutMeStep;
