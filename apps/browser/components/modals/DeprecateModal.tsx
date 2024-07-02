import React from "react";
import Modal from "./ModalBase";
import Button from "../Button";
import { ArrowRight } from "@phosphor-icons/react";

interface DeprecateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeprecateModal(props: DeprecateModalProps) {
  const { isOpen, onClose } = props;

  const DeprecationNotice = (
    <>
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <div className="text-left mb-6">
          <h2 className="text-xl font-bold mb-4">Dear evo.ninja user,</h2>
          <p>
            evo.ninja is being deprecated and will shut down on July 10th.
            Please export any important documents before then.
            The evo.ninja code will remain open-source at:
          </p>
          <a href="https://github.com/agentcoinorg/evo.ninja" target="_blank" rel="noopener noreferrer" className="text-cyan-500">
            github.com/agentcoinorg/evo.ninja
          </a>
        </div>
        <div className="text-left mb-6">
          <h3 className="text-xl font-semibold mb-2">Introducing Agentcoin!</h3>
          <p>
            We're excited to share that we're launching <a href="https://agentcoin.org" target="_blank" rel="noopener noreferrer" className="text-cyan-500">
            Agentcoin
          </a>, a network of specialized AI agents that interface with decentralized protocols. We'd love for you to <a href="https://agentcoin.org/discord" target="_blank" rel="noopener noreferrer" className="text-cyan-500">join us</a> on this new journey.
          </p>
        </div>
        <div className="text-left mb-6">
          <p>
            At Agentcoin, we're creating even more powerful and versatile agents, exploring AI-driven governance, treasury management, and innovative DeFi use-cases.
            You can learn more about Agentcoin's mission in the announcement <a href="https://www.agentcoin.org/blog/introducing-agentcoin" target="_blank" rel="noopener noreferrer" className="text-cyan-500">post</a>.
          </p>
        </div>
        <div className="text-left">
          <p>
            Your experience with evo.ninja makes you an ideal contributor to our community, and your input will be invaluable in shaping the future of AI in the web3 space.
            Join the community and prompt the agents <a href="https://agentcoin.org/discord" target="_blank" rel="noopener noreferrer" className="text-cyan-500">available today</a>!
          </p>
        </div>
      </div>
      <div className="flex justify-end pt-8">
        <Button onClick={() => onClose()}>
          <div>Use Evo.Ninja</div>
          <ArrowRight size={16} color="white" />
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Modal isOpen={isOpen} title="Important Annoucement" onClose={onClose}>
        {DeprecationNotice}
      </Modal>
    </>
  );
}
