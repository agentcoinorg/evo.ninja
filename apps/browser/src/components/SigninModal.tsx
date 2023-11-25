import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useState } from "react";
import { signIn } from "next-auth/react";
import { EXO_FONT } from "../../pages/_app";

export default function SigninModal({
  isOpen,
  onClose,
  onConfigSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (apiKey: string) => void;
}) {
  const [apiKey, setApiKey] = useState<string>("");
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <div
            className="fixed inset-0 overflow-y-auto"
            style={{ backgroundColor: "black" }}
          >
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
                  className={clsx(
                    EXO_FONT.className,
                    "w-full max-w-sm transform overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle text-neutral-50 shadow-xl transition-all flex flex-col items-center gap-4"
                  )}
                >
                  <Dialog.Title as="h3" className="text-lg font-semibold">
                    Please add your OpenAI Api key
                  </Dialog.Title>
                  <div className="flex justify-center items-center gap-2">
                    <input
                      className="rounded-xl border border-neutral-600 bg-neutral-950 p-2.5 text-neutral-50 outline-none transition-all"
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button
                      className="cursor-pointer rounded-xl border-none bg-orange-600 p-2.5 text-neutral-50 transition-all hover:bg-orange-500"
                      onClick={() => {
                        onConfigSaved(apiKey)
                        onClose()
                      }}
                    >
                      Save
                    </button>
                  </div>
                  <h3 className="flex justify-center items-center text-lg font-semibold">
                  - or -
                  </h3>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-50 shadow-md outline-none transition-all hover:bg-orange-500"
                      onClick={() => signIn()}
                    >
                      Sign in
                    </button>
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
