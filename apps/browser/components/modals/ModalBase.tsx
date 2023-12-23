import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Ubuntu_FONT } from "@/lib/fonts";
import clsx from "clsx";
import { X } from "@phosphor-icons/react";
import Button from "../Button";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  autoScroll?: boolean;
  panelStyles?: {
    maxWidth?: string;
    other?: string;
  };
  contentStyles?: {
    padding?: string;
    "max-h"?: string;
    spacing?: string;
    overflow?: string;
    other?: string;
  };
}

export default function Modal(props: PropsWithChildren<ModalProps>) {
  const {
    title,
    isOpen,
    onClose,
    autoScroll = false,
    panelStyles,
    contentStyles,
    children,
  } = props;
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const maxWidth = panelStyles?.maxWidth ?? "max-w-[540px]";

  const defaultContentStyles = clsx(
    "bg-zinc-900 [scrollbar-gutter:stable]",
    contentStyles?.padding ? contentStyles?.padding : "p-4 pr-3 md:p-8 md:pr-6",
    contentStyles?.["max-h"]
      ? contentStyles?.["max-h"]
      : "max-h-[calc(100dvh-78px)] md:max-h-[calc(100dvh-96px)]",
    contentStyles?.spacing ? contentStyles?.spacing : "space-y-8",
    contentStyles?.overflow ? contentStyles?.overflow : "overflow-y-auto",
    contentStyles?.other
  );

  const scrollToBottom = () => {
    modalContainerRef.current?.scrollTo({
      top: modalContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleScroll = useCallback(() => {
    // Detect if the user is at the bottom of the modal
    const container = modalContainerRef.current;
    if (container) {
      const isScrolledToBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight;
      setIsAtBottom(isScrolledToBottom);
    }
  }, []);

  useEffect(() => {
    // If the user is at the bottom, scroll to the bottom
    if (isAtBottom && autoScroll) {
      scrollToBottom();
    }
  }, [children, isAtBottom, autoScroll]);

  useEffect(() => {
    const container = modalContainerRef.current;
    if (container) {
      // Add scroll event listener
      container.addEventListener("scroll", handleScroll);
    }
  });

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className={clsx(Ubuntu_FONT.className, "relative z-30")}
          onClose={onClose}
        >
          <div className="fixed inset-0 overflow-y-auto bg-zinc-400/50 backdrop-blur [scrollbar-gutter:stable] ">
            <div className="flex min-h-screen -translate-y-0.5 transform items-center justify-center p-1 text-center md:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={clsx(
                    "w-full transform overflow-hidden rounded-xl bg-zinc-800 text-left align-middle text-zinc-50 shadow-xl transition-all",
                    maxWidth
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center justify-between border-b-2 border-zinc-600 bg-zinc-800 px-8 py-4">
                    <Dialog.Title as="h3" className="text-lg font-medium">
                      {title}
                    </Dialog.Title>
                    <Button
                      variant="icon"
                      onClick={onClose}
                      className="group translate-x-2 transform"
                    >
                      <X
                        size={20}
                        color="white"
                        weight="bold"
                        className="transition-opacity duration-300 ease-in-out group-hover:opacity-50"
                      />
                    </Button>
                  </div>
                  <div
                    className={defaultContentStyles}
                    onScroll={() => autoScroll && handleScroll()}
                    ref={modalContainerRef}
                  >
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
