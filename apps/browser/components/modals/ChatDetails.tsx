import { useRef, useState } from "react";
import Modal from "./ModalBase";
import ReactMarkdown from "react-markdown";
import { CaretUp, CheckCircle } from "@phosphor-icons/react";
import { MessageSet } from "@/lib/utils/sanitizeLogsDetails";
import clsx from "clsx";

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
  const contentRefs = useRef<{ [index: number]: HTMLDivElement | null }>({});

  const toggleStep = (step: string, index: number) => {
    const currentEl = contentRefs.current[index];
    if (!currentEl) return;

    if (expandedStep !== null && expandedStep !== step) {
      const currentIndex = Object.keys(logs.details).indexOf(expandedStep);
      const currentExpandedEl = contentRefs.current[currentIndex];
      if (currentExpandedEl) currentExpandedEl.style.height = "0px";
    }

    if (expandedStep === step) {
      currentEl.style.height = "0px";
      setExpandedStep(null);
    } else {
      currentEl.style.height = `${currentEl.scrollHeight}px`;
      setExpandedStep(step);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setExpandedStep(null);
        onClose();
      }}
      title="Details"
    >
      <div className="space-y-4">
        {logs &&
          Object.entries(logs.details).map(
            ([stepTitle, stepDetails], index) => (
              <div
                key={stepTitle}
                className={clsx(
                  "prose-condensed prose prose-zinc prose-invert rounded-md bg-zinc-800 shadow-md transition-colors duration-0 ease-in-out hover:shadow-lg",
                  {
                    "cursor-pointer duration-150 hover:bg-zinc-700":
                      expandedStep !== stepTitle && stepDetails.length > 0,
                  }
                )}
              >
                <button
                  onClick={() => toggleStep(stepTitle, index)}
                  className={clsx(
                    "group flex w-full items-center justify-between p-4",
                    { "cursor-default": stepDetails.length <= 0 },
                    {
                      "rounded-md border border-green-500 bg-green-900 text-green-400":
                        stepTitle.includes("## Goal"),
                    }
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {stepTitle.includes("## Goal") && (
                      <CheckCircle size={24} weight="bold" />
                    )}
                    <ReactMarkdown className="prose-headings:mt-0 prose-headings:text-inherit">
                      {stepTitle}
                    </ReactMarkdown>
                  </div>
                  {stepDetails.length > 0 && (
                    <CaretUp
                      weight="bold"
                      size={14}
                      className={clsx(
                        "transform text-white transition-transform duration-500 ease-in-out group-hover:text-cyan-500",
                        expandedStep !== stepTitle && "rotate-180"
                      )}
                    />
                  )}
                </button>
                <div
                  ref={(el) => {
                    contentRefs.current[index] = el;
                  }}
                  className={clsx(
                    "step h-0 overflow-hidden transition-[height] duration-500 ease-in-out"
                  )}
                >
                  {stepDetails.map((detail, detailIndex) => (
                    <div className="px-4 pt-0" key={detailIndex}>
                      <ReactMarkdown>{detail}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
      </div>
    </Modal>
  );
}
