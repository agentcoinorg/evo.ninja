import clsx from "clsx";
import {
  DetailedHTMLProps,
  ChangeEvent,
  TextareaHTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
} from "react";

interface TextAreaFieldProps
  extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  label?: string;
  error?: string;
  checked?: boolean;
  leftAdornment?: ReactNode;
  leftAdornmentClassnames?: string;
  rightAdornment?: ReactNode;
  rightAdornmentClassnames?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField = ({
  leftAdornment,
  leftAdornmentClassnames,
  rightAdornment,
  rightAdornmentClassnames,
  className,
  onChange,
  label,
  error,
  checked,
  ...props
}: TextAreaFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      if (textareaRef.current.scrollHeight > 200) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="w-full space-y-1">
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
        <textarea
          ref={textareaRef}
          className={clsx(
            "focus:ring-3 w-full rounded-lg border-2 border-zinc-500 bg-transparent p-4 text-sm text-white outline-none transition-all placeholder:text-white/50 focus:border-cyan-500 focus:ring-cyan-500/20",
            props.disabled
              ? "cursor-default opacity-50"
              : "cursor-text hover:border-zinc-600 hover:bg-zinc-950",
            { "border-red-500": error },
            { "!pl-10": leftAdornment },
            { "!pr-10": rightAdornment },
            className
          )}
          {...props}
          onChange={handleInputChange}
        />
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

export default TextAreaField;
