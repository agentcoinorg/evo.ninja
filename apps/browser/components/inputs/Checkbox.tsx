// Checkbox.tsx
import clsx from "clsx";
import BaseInput from "./BaseInput";
import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useState,
} from "react";

interface CheckboxProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label?: string;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const [isChecked, setIsChecked] = useState(props.checked);

  const handleCheck = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (props.onChange) {
      const event = {
        target: {
          type: "checkbox",
          checked: newValue,
        },
      } as ChangeEvent<HTMLInputElement>;
      props.onChange(event);
    }
  };

  return (
    <div className={clsx("space-y-1", className)}>
      {label && <label className="text-sm font-semibold">{label}</label>}
      <div
        className={clsx("checkbox", { checked: isChecked }, className)}
        onClick={handleCheck}
      >
        <div className={clsx("checkmark", { hidden: !isChecked })} />
      </div>
    </div>
  );
};

export default Checkbox;
