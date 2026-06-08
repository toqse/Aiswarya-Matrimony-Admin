import { motion } from "framer-motion";

const SIGNUP_STEPS = [
  "Profile For",
  "Registration",
  "Location",
  "Religious",
  "Personal",
  "Education",
  "About Me",
  "Photos",
];

interface Props {
  currentStep: number;
}

const SignupStepIndicator = ({ currentStep }: Props) => {
  const progress = ((currentStep + 1) / SIGNUP_STEPS.length) * 100;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Step {currentStep + 1} of {SIGNUP_STEPS.length}
        </span>
        <span className="text-xs font-semibold text-primary truncate text-right">
          {SIGNUP_STEPS[currentStep]}
        </span>
      </div>
      <div className="w-full h-2 bg-accent-rose rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--gradient-primary)" }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between gap-0.5 sm:gap-1 mt-2">
        {SIGNUP_STEPS.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-primary/15"
            }`}
            initial={false}
            animate={i === currentStep ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};

export default SignupStepIndicator;
export { SIGNUP_STEPS };
