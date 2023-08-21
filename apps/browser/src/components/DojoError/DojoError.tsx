import React from "react";

import "./DojoError.css";

export interface DojoErrorProps {
  error: unknown;
}

const DojoError: React.FC<DojoErrorProps> = (props: DojoErrorProps) => {
  const { error } = props;

  return (
    <div className="DojoError">
      <div className="Error">
        <div className={`MessageContainer`}>
          <div className="SenderName">Critical Error</div>
          <div className={`Message`}>{JSON.stringify(error, null, 2)}</div>
        </div>
      </div>
    </div>
  );
};

export default DojoError;
