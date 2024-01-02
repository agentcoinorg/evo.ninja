import clsx from "clsx";
import BaseInput, { BaseInputProps } from "./BaseInput";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";

interface TextFieldProps
  extends DetailedHTMLProps<
      InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    BaseInputProps {}

const TextField = ({
  leftAdornment,
  rightAdornment,
  leftAdornmentClassnames,
  rightAdornmentClassnames,
  className,
  label,
  error,
  ...props
}: TextFieldProps) => {
  return (
    <BaseInput
      label={label}
      error={error}
      leftAdornment={leftAdornment}
      leftAdornmentClassnames={leftAdornmentClassnames}
      rightAdornment={rightAdornment}
      rightAdornmentClassnames={rightAdornmentClassnames}
    >
      <input
        className={clsx(
          "focus:ring-3 w-full rounded-lg border-2 border-zinc-500 bg-transparent p-4 text-sm text-white outline-none transition-all placeholder:text-white/50 focus:!border-cyan-500 focus:!ring-cyan-500/20",
          props.disabled
            ? "cursor-default opacity-50"
            : "cursor-text hover:border-zinc-600 hover:bg-zinc-950",
          { "!border-red-900": error },
          { "!pl-10": leftAdornment },
          { "!pr-10": rightAdornment },
          className
        )}
        {...props}
      />
    </BaseInput>
  );
};

export default TextField;
