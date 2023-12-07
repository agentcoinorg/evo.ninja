import { allowTelemetryAtom } from "@/lib/store"
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

interface DisclaimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Disclaimer({ isOpen, onClose }: DisclaimerProps) {
  const [,setAllowTelemetry] = useAtom(allowTelemetryAtom)
  const [ isMounted, setIsMounted] = useState(false)

  const handleDisclaimerSelect = (accept: boolean) => {
    setAllowTelemetry(accept)
    onClose()
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  return isOpen && isMounted ? (
    <div className="absolute bottom-0 z-50 flex w-4/5 items-center justify-around rounded-t-lg border-2 border-orange-600 bg-black p-2.5 text-center text-xs text-white self-center w-[100%] max-w-[56rem]">
      🧠 Hey there! Mind sharing your prompts to help make Evo even better?
      <div className="flex gap-2.5">
        <span className="cursor-pointer px-5 py-2.5 font-bold text-orange-500" onClick={() => handleDisclaimerSelect(true)}>Accept</span>
        <span className="cursor-pointer px-5 py-2.5 font-bold text-white" onClick={() => handleDisclaimerSelect(false)}>Decline</span>
      </div>
    </div>
  ): null
}