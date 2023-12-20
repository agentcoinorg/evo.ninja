import { useState } from "react";
import Modal from "./ModalBase";
import ReactMarkdown from "react-markdown";
import { MessageSet } from "../ChatLogs";

interface ChatDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  logs: MessageSet;
}

export default function ChatDetails({
  isOpen,
  onClose,
  logs,
}: ChatDetailsProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (step: string) => {
    if (expandedStep === step) {
      setExpandedStep(null);
    } else {
      setExpandedStep(step);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Details">
      <div>
        {Object.entries(logs.details).map(([stepTitle, stepDetails]) => (
          <div key={stepTitle}>
            <button onClick={() => toggleStep(stepTitle)}>
              <ReactMarkdown>{stepTitle}</ReactMarkdown>
            </button>
            {expandedStep === stepTitle && (
              <div>
                {stepDetails.map((detail, detailIndex) => (
                  <ReactMarkdown key={detailIndex}>{detail}</ReactMarkdown>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
