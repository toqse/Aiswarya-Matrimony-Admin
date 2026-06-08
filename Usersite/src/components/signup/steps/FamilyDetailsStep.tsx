import { SelectField, inputClass, labelClass } from "../SignupFormFields";

const FAMILY_TYPES = ["Nuclear", "Joint", "Extended", "Other"];
const FAMILY_STATUS_OPTIONS = ["Middle Class", "Upper Middle Class", "Rich", "Affluent", "Other"];

interface Props {
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  /** When true, hide the step title (e.g. when embedded in dashboard Family Details page). */
  hideTitle?: boolean;
}

const FamilyDetailsStep = ({ formData, onChange, hideTitle }: Props) => (
  <>
    {!hideTitle && (
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">Family Details</h1>
        <p className="text-muted-foreground text-sm">Tell us about your family</p>
      </div>
    )}
    <div className="space-y-4">
      <SelectField label="Family Type" name="familyType" options={FAMILY_TYPES} value={formData.familyType} onChange={onChange} />
      <div>
        <label className={labelClass}>Father&apos;s Name</label>
        <input type="text" name="fathersName" value={formData.fathersName} onChange={onChange} placeholder="e.g. Rajesh Kumar" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Father&apos;s Occupation</label>
        <input type="text" name="fathersOccupation" value={formData.fathersOccupation} onChange={onChange} placeholder="e.g. Government Employee" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Mother&apos;s Name</label>
        <input type="text" name="mothersName" value={formData.mothersName} onChange={onChange} placeholder="e.g. Lakshmi" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Mother&apos;s Occupation</label>
        <input type="text" name="mothersOccupation" value={formData.mothersOccupation} onChange={onChange} placeholder="e.g. Homemaker" className={inputClass} />
      </div>
      <SelectField label="Family Status" name="familyStatus" options={FAMILY_STATUS_OPTIONS} value={formData.familyStatus} onChange={onChange} />
      <div>
        <label className={labelClass}>No. of Brothers</label>
        <input type="number" name="numberOfBrothers" value={formData.numberOfBrothers} onChange={onChange} placeholder="0" min={0} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>No. of Married Brothers</label>
        <input type="number" name="numberOfMarriedBrothers" value={formData.numberOfMarriedBrothers} onChange={onChange} placeholder="0" min={0} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>No. of Sisters</label>
        <input type="number" name="numberOfSisters" value={formData.numberOfSisters} onChange={onChange} placeholder="0" min={0} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>No. of Married Sisters</label>
        <input type="number" name="numberOfMarriedSisters" value={formData.numberOfMarriedSisters} onChange={onChange} placeholder="0" min={0} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>About My Family <span className="text-muted-foreground">(Optional)</span></label>
        <textarea
          name="aboutMyFamily"
          value={formData.aboutMyFamily}
          onChange={onChange}
          placeholder="e.g. We are a close-knit family with traditional values."
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white resize-none text-foreground"
        />
      </div>
    </div>
  </>
);

export default FamilyDetailsStep;
