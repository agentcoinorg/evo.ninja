import { uploadedFilesAtom } from "@/lib/store";
import { examplePrompts, ExamplePrompt } from "@/lib/examplePrompts";
import { useAtom } from "jotai";

export interface ExamplePromptsProps {
  onClick: (prompt: string) => Promise<void>;
}

export default function ExamplePrompts(props: ExamplePromptsProps) {
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);

  const handleClick = (prompt: ExamplePrompt) => {
    if (prompt.files) {
      setUploadedFiles(prompt.files);
    }
    return props.onClick(prompt.prompt);
  };

  return (
    <div className="grid w-full grid-rows-2 p-2.5 py-16 self-center w-[100%] max-w-[56rem]">
      {examplePrompts.map((prompt, index) => (
        <div 
          key={index} 
          className="m-1 cursor-pointer rounded-xl border border-neutral-500 bg-neutral-800 p-2.5 text-left text-xs text-neutral-50 transition-all hover:border-orange-500" 
          onClick={() => handleClick(prompt)}
        >
          {prompt.prompt}
        </div>
      ))}
    </div>
  );
}
