"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
  index?: number;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}

const StepperContext = React.createContext<{
  activeStep: number;
  orientation: "horizontal" | "vertical";
}>({
  activeStep: 0,
  orientation: "horizontal",
});

export function Stepper({
  activeStep,
  orientation = "horizontal",
  className,
  children,
  ...props
}: StepperProps) {
  return (
    <StepperContext.Provider value={{ activeStep, orientation }}>
      <div
        className={cn(
          "flex w-full",
          orientation === "vertical" 
            ? "flex-col gap-1" 
            : "flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-2 lg:gap-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
}

export function Step({
  title,
  description,
  completed,
  active,
  className,
  icon,
  index = 0,
  ...props
}: StepProps) {
  const { activeStep, orientation } = React.useContext(StepperContext);
  const isActive = active !== undefined ? active : activeStep === index;
  const isCompleted = completed !== undefined ? completed : activeStep > index;

  return (
    <div
      className={cn(
        "flex gap-2 min-w-0",
        orientation === "vertical" 
          ? "flex-col" 
          : "flex-1 flex-col md:items-center md:text-center lg:items-start lg:text-left",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 md:hidden">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors shrink-0",
            isCompleted
              ? "border-[#028eab] bg-[#028eab] text-white"
              : isActive
              ? "border-[#028eab] text-[#028eab]"
              : "border-gray-300 text-gray-400"
          )}
        >
          {isCompleted ? <Check className="h-3 w-3" /> : icon || index + 1}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={cn(
              "font-medium text-sm truncate",
              isCompleted || isActive ? "text-gray-900" : "text-gray-500"
            )}
          >
            {title}
          </span>
          {description && (
            <span
              className={cn(
                "text-xs leading-tight mt-0.5",
                isCompleted || isActive ? "text-gray-600" : "text-gray-400"
              )}
            >
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="hidden md:flex lg:hidden flex-col items-center text-center gap-2">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors shrink-0",
            isCompleted
              ? "border-[#028eab] bg-[#028eab] text-white"
              : isActive
              ? "border-[#028eab] text-[#028eab]"
              : "border-gray-300 text-gray-400"
          )}
        >
          {isCompleted ? <Check className="h-4 w-4" /> : icon || index + 1}
        </div>
        <div className="flex flex-col items-center min-w-0 max-w-[120px]">
          <span
            className={cn(
              "font-medium text-sm text-center leading-tight",
              isCompleted || isActive ? "text-gray-900" : "text-gray-500"
            )}
          >
            {title}
          </span>
          {description && (
            <span
              className={cn(
                "text-xs leading-tight text-center mt-1",
                isCompleted || isActive ? "text-gray-600" : "text-gray-400"
              )}
            >
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors shrink-0",
            isCompleted
              ? "border-[#028eab] bg-[#028eab] text-white"
              : isActive
              ? "border-[#028eab] text-[#028eab]"
              : "border-gray-300 text-gray-400"
          )}
        >
          {isCompleted ? <Check className="h-4 w-4" /> : icon || index + 1}
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-medium text-sm",
              isCompleted || isActive ? "text-gray-900" : "text-gray-500"
            )}
          >
            {title}
          </span>
          {description && (
            <span
              className={cn(
                "text-xs leading-tight mt-0.5",
                isCompleted || isActive ? "text-gray-600" : "text-gray-400"
              )}
            >
              {description}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex md:hidden mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 ease-in-out bg-[#028eab]",
          )}
          style={{ 
            width: isCompleted ? '100%' : isActive ? '50%' : '0%' 
          }}
        />
      </div>

      {orientation === "horizontal" && index < 5 && (
        <div className="hidden md:flex h-[2px] flex-1 bg-gray-200 mt-5 mx-2 lg:mx-4" />
      )}
    </div>
  );
}

export function StepperContent({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const { activeStep } = React.useContext(StepperContext);
  
  if (activeStep !== step) {
    return null;
  }
  
  return (
    <div className="mt-4 md:mt-6 px-2 md:px-0">
      {children}
    </div>
  );
}