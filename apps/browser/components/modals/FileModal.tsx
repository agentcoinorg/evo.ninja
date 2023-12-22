import { parseCsvContent } from "@/lib/utils/parseCsvContent";
import Modal from "./ModalBase";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: InMemoryFile | null;
}

export default function FileModal(props: FileModalProps) {
  const { isOpen, onClose, file } = props;

  const formattedContent = useMemo(() => {
    if (file?.content) {
      const decoder = new TextDecoder();
      const contentString = decoder.decode(file.content).trim();
      if (file?.path.endsWith(".csv")) {
        return parseCsvContent(contentString);
      } else {
        return <ReactMarkdown>{contentString}</ReactMarkdown>;
      }
    }
    return undefined;
  }, [file]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        title={file?.path ?? "View File"}
        onClose={onClose}
        contentStyles={{ padding: "p-0" }}
        panelStyles={{ maxWidth: "max-w-screen-md" }}
      >
        {file?.content && (
          <div className="prose prose-invert w-full max-w-none overflow-auto p-8 pr-[1.5rem] font-mono text-xs [scrollbar-gutter:stable]">
            {formattedContent}
          </div>
        )}
      </Modal>
    </>
  );
}
