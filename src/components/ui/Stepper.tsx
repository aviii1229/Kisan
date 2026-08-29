import React from 'react';

export interface StepItem {
  key: string;
  label: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStageIndex: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStageIndex }) => {
  return (
    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 text-xs">
      {/* Horizontal progress bar for desktop */}
      <div className="absolute left-[18px] top-4 bottom-4 md:left-0 md:right-0 md:top-[18px] md:bottom-auto h-[70%] md:h-1 bg-slate-200 z-0 rounded-full" />
      <div
        className="absolute left-[18px] top-4 md:left-0 md:top-[18px] md:bottom-auto h-1 bg-agri-600 z-0 transition-all duration-500 hidden md:block rounded-full"
        style={{ width: `${(currentStageIndex / Math.max(1, steps.length - 1)) * 100}%` }}
      />

      {steps.map((stage, idx) => {
        const isCompleted = idx < currentStageIndex;
        const isActive = idx === currentStageIndex;

        return (
          <div key={stage.key} className="flex md:flex-col items-center gap-4 md:gap-2.5 z-10 w-full md:text-center">
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold font-mono transition-all duration-300 shadow-xs ${
                isCompleted
                  ? 'bg-agri-600 border-agri-700 text-white'
                  : isActive
                  ? 'bg-amber-500 border-amber-600 text-white scale-110 shadow-md ring-4 ring-amber-50 animate-pulse'
                  : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>
            <span
              className={`text-[11px] transition-all duration-300 ${
                isActive
                  ? 'text-slate-900 font-extrabold'
                  : isCompleted
                  ? 'text-slate-700 font-bold'
                  : 'text-slate-400 font-bold'
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
export default Stepper;
