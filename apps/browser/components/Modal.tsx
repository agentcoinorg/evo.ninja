import { PropsWithChildren } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import IconButton from "./IconButton";
import { Ubuntu_FONT } from "@/lib/fonts";
import clsx from "clsx";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Modal(props: PropsWithChildren<ModalProps>) {
  const { title, isOpen, onClose, children } = props;

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className={clsx(Ubuntu_FONT.className, "relative z-10")}
          onClose={onClose}
        >
          <div className="fixed inset-0 overflow-y-auto bg-zinc-400/50 backdrop-blur">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                  className="w-full max-w-[540px] transform overflow-hidden rounded-2xl bg-zinc-800 text-left align-middle text-zinc-50 shadow-xl transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center justify-between border-b-2 border-zinc-600 bg-zinc-800 px-8 py-4">
                    <Dialog.Title as="h3" className="text-lg font-medium">
                      {title}
                    </Dialog.Title>
                    <IconButton
                      iconName="X"
                      onClick={onClose}
                      iconProps={{ weight: "bold", color: "white", size: 20 }}
                      buttonClassName="transform translate-x-2"
                    />
                  </div>
                  <div className="max-h-[calc(100vh-96px)] space-y-8 overflow-y-auto bg-zinc-900 p-8 pb-12">
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
