import { workspaceAtom, workspaceUploadsAtom } from "@/lib/store";
import { useWorkspaceUploadUpdate } from "@/lib/hooks/useWorkspaceUploadUpdate";
import { examplePrompts, ExamplePrompt } from "@/lib/examplePrompts";
import { useAtom } from "jotai";
import clsx from "clsx";
import useWindowSize from "@/lib/hooks/useWindowSize";

export interface ExamplePromptsProps {
  onClick: (prompt: string) => Promise<void>;
}

export default function ExamplePrompts(props: ExamplePromptsProps) {
  const [workspace] = useAtom(workspaceAtom);
  const [, setWorkspaceUploads] = useAtom(workspaceUploadsAtom);
  const workspaceUploadUpdate = useWorkspaceUploadUpdate();
  const { isMobile } = useWindowSize();

  const handleClick = (prompt: ExamplePrompt) => {
    if (prompt.files) {
      setWorkspaceUploads(prompt.files);
      if (workspace) {
        workspaceUploadUpdate(workspace, prompt.files)
      }
    }
    return props.onClick(prompt.prompt);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <h2 className="w-full text-center font-normal">
        Not sure where to start?{` `}
        {isMobile && <br />}
        <span className="text-sm md:text-base">Try asking one of these:</span>
      </h2>{" "}
      {examplePrompts.map((prompt, index) => (
        <div
          key={index}
          className={clsx(
            "m-1 cursor-pointer rounded-lg  border-2 border-zinc-700 bg-zinc-900/50 p-2.5 text-xs text-zinc-400 transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:text-white"
          )}
          onClick={() => handleClick(prompt)}
        >
          {prompt.prompt}
        </div>
      ))}
    </div>
  );
}
