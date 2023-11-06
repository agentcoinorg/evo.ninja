import React from "react";

export interface DojoErrorProps {
  error: unknown;
}

const DojoError: React.FC<DojoErrorProps> = (props: DojoErrorProps) => {
  const { error } = props;

  return (
    <div className="flex h-full flex-col border border-neutral-700 bg-neutral-900 text-neutral-50">
      <div className="flex-1 overflow-auto border-b border-b-neutral-700 p-5">
        <div>
          <div className="SenderName">Critical Error</div>
          <div className="my-4 rounded bg-orange-600 px-4 py-2.5 text-neutral-50">{JSON.stringify(error, null, 2)}</div>
        </div>
      </div>
    </div>
  );
};

export default DojoError;
