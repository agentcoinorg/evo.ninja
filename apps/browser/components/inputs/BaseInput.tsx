import clsx from "clsx";
import { ReactNode } from "react";

export interface BaseInputProps {
  label?: string;
  error?: string;
  leftAdornment?: ReactNode;
  leftAdornmentClassnames?: string;
  rightAdornment?: ReactNode;
  rightAdornmentClassnames?: string;
  className?: string;
  children?: ReactNode;
}

const BaseInput = ({
  label,
  error,
  leftAdornmentClassnames,
  leftAdornment,
  rightAdornmentClassnames,
  rightAdornment,
  children,
}: BaseInputProps) => {
  return (
    <div className={"w-full space-y-1"}>
      {label && <label className="text-sm font-semibold">{label}</label>}
      <div className="relative w-full">
        {leftAdornment && (
          <div
            className={clsx(
              "absolute bottom-4 left-4",
              leftAdornmentClassnames
            )}
          >
            {leftAdornment}
          </div>
        )}
        {children}
        {rightAdornment && (
          <div
            className={clsx(
              "absolute bottom-4 right-4",
              rightAdornmentClassnames
            )}
          >
            {rightAdornment}
          </div>
        )}
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
};

export default BaseInput;
