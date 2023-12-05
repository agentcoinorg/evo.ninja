import { File, IconProps } from "@phosphor-icons/react";
import clsx from "clsx";

interface FileIconProps {
  fileType: string;
}

const FileIcon = ({ fileType, ...props }: FileIconProps) => {
  function getFontSize(fileTypeLength: number): number {
    return Math.max(12 - 1 * fileTypeLength, 7);
  }

  return (
    <div className="relative" {...props}>
      <svg
        width="24"
        height="25"
        viewBox="0 0 24 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.5 10.7671V4.01709C4.5 3.81818 4.57902 3.62741 4.71967 3.48676C4.86032 3.34611 5.05109 3.26709 5.25 3.26709H14.25M14.25 3.26709L19.5 8.51709M14.25 3.26709V8.51709H19.5M19.5 8.51709V10.7671"
          stroke="#06B6D4"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div
        className={clsx(
          "absolute left-1/2 -translate-x-1/2 transform text-center font-bold uppercase",
          fileType.length <= 4 ? "tracking-widest" : "tracking-wider"
        )}
        style={{
          bottom: fileType.length > 4 ? 2 : 1,
          fontSize: `${getFontSize(fileType.length)}px`,
        }}
      >
        {fileType}
      </div>
    </div>
  );
};

export default FileIcon;
