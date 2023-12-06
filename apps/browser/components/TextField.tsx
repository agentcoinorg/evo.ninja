import clsx from "clsx";
import { useState, ChangeEvent, InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const TextField = ({
  type = "input",
  className,
  label,
  error,
  checked,
  onChange,
  ...props
}: TextFieldProps) => {
  const [isChecked, setIsChecked] =
    useState<TextFieldProps["checked"]>(checked);

  const handleCheck = () => {
    setIsChecked(!isChecked);
  };

  return (
    <fieldset className="space-y-1">
      {label && <label className="text-sm font-semibold">{label}</label>}
      <input
        className={clsx(
          "w-full rounded-md border-2 border-zinc-500 bg-transparent px-4 py-2 text-white outline-none transition-all hover:border-zinc-600 hover:bg-zinc-950 focus:border-zinc-400",
          { hidden: type === "checkbox" },
          { "border-red-500": error },
          className
        )}
        type={type}
        {...props}
      />
      {type === "checkbox" && (
        <div
          className={clsx("checkbox", { checked: isChecked })}
          onChange={handleCheck}
        >
          <div className={clsx("checkmark", { hidden: !isChecked })} />
        </div>
      )}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </fieldset>
  );
};

export default TextField;
