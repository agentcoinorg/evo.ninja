import { useEffect, useRef, useState } from "react";
import Modal from "./ModalBase";
import ReactMarkdown from "react-markdown";
import { MessageSet } from "../ChatLogs";
import { CaretUp } from "@phosphor-icons/react";
import clsx from "clsx";
import { Transition } from "@headlessui/react";

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
  const [heights, setHeights] = useState<{ [index: number]: number }>({});
  const contentRefs = useRef<{ [index: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    const newHeights = [];
    Object.keys(contentRefs.current).forEach((key) => {
      const index = parseInt(key);
      const el = contentRefs.current[index];
      if (el) {
        newHeights[index] = el.scrollHeight;
      }
    });
    setHeights(newHeights);
  }, [logs]);

  const toggleStep = (step: string, index: number) => {
    if (expandedStep === step) {
      setExpandedStep(null);
    } else {
      setExpandedStep(step);
      if (contentRefs.current[index]) {
        contentRefs.current[index].style.height = `${heights[index]}px`;
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Details">
      <div className="space-y-4">
        {Object.entries(logs.details).map(([stepTitle, stepDetails], index) => (
          <div
            key={stepTitle}
            className={clsx(
              "prose-condensed prose prose-zinc prose-invert rounded-md bg-zinc-800 shadow-md transition-colors duration-0 ease-in-out hover:shadow-lg",
              {
                "cursor-pointer duration-150 hover:bg-zinc-700":
                  expandedStep !== stepTitle,
              }
            )}
          >
            <button
              onClick={() => toggleStep(stepTitle, index)}
              className="group flex w-full items-center justify-between p-4"
            >
              <ReactMarkdown>{stepTitle}</ReactMarkdown>
              <CaretUp
                weight="bold"
                size={14}
                className={clsx(
                  "transform text-white transition-transform duration-150 ease-in-out group-hover:text-cyan-400",
                  expandedStep !== stepTitle && "rotate-180"
                )}
              />
            </button>
            <div
              ref={(el) => (contentRefs.current[index] = el)}
              className={clsx(
                "overflow-hidden transition-[height] duration-500 ease-in-out",
                expandedStep === stepTitle ? "h-auto" : "h-0"
              )}
            >
              {stepDetails.map((detail, detailIndex) => (
                <div className="p-4 pt-0">
                  <ReactMarkdown key={detailIndex}>{detail}</ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
