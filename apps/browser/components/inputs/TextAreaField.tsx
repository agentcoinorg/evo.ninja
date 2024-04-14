// TextAreaField.tsx
import clsx from "clsx";
import BaseInput, { BaseInputProps } from "./BaseInput";
import {
  DetailedHTMLProps,
  TextareaHTMLAttributes,
  useRef,
  useEffect,
} from "react";

interface TextAreaFieldProps
  extends DetailedHTMLProps<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      HTMLTextAreaElement
    >,
    BaseInputProps {}

const TextAreaField = ({
  leftAdornment,
  rightAdornment,
  leftAdornmentClassnames,
  rightAdornmentClassnames,
  className,
  label,
  error,
  ...props
}: TextAreaFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      if (textareaRef.current.scrollHeight > 200) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [props.value]);

  return (
    <BaseInput
      label={label}
      error={error}
      leftAdornment={leftAdornment}
      leftAdornmentClassnames={leftAdornmentClassnames}
      rightAdornment={rightAdornment}
      rightAdornmentClassnames={rightAdornmentClassnames}
    >
      <textarea
        ref={textareaRef}
        className={clsx(
          "focus:ring-3 w-full resize-none overflow-y-hidden rounded-lg border-2 border-zinc-500 bg-transparent p-4 text-sm text-white outline-none transition-all placeholder:text-white/50 focus:border-cyan-500 focus:ring-cyan-500/20",
          props.disabled
            ? "cursor-default opacity-50"
            : "cursor-text hover:border-zinc-600 hover:bg-zinc-950",
          { "!border-red-500": error },
          { "!pl-10": leftAdornment },
          { "!pr-10": rightAdornment },
          className
        )}
        {...props}
      />
    </BaseInput>
  );
};

export default TextAreaField;
