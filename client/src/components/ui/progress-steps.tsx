import { cn } from "@/lib/utils";
import { Check, User, IdCard } from "lucide-react";

interface ProgressStepsProps {
  currentStep: number;
  steps: {
    label: string;
    icon: React.ReactNode;
  }[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="w-full flex items-center">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full",
                  index < currentStep
                    ? "bg-secondary text-white"
                    : index === currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium",
                  index < currentStep
                    ? "text-secondary"
                    : index === currentStep
                    ? "text-primary"
                    : "text-gray-500"
                )}
              >
                {step.label}
              </span>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-grow h-0.5 mx-2 w-16",
                    index < currentStep
                      ? "bg-secondary"
                      : index === currentStep
                      ? "bg-primary"
                      : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
