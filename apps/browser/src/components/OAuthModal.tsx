import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useState } from "react";
import { EXO_FONT } from "../../pages/_app";
import { createBrowserClient } from "@supabase/ssr";

type SupportedProviders = 'github' | 'google'

export function OAuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const onButtonClick = async (provider: SupportedProviders) => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `/api/auth/callback`,
      }
    })
    if (error) console.log(error)
  }

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
                    Sign In
                  </Dialog.Title>
                  <div className="flex flex-col gap-2 justify-center">
                    <button
                      className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => onButtonClick('google')}
                    >
                      <span>Connect with Google</span>
                    </button>
                    <button
                      className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => onButtonClick('github')}
                    >
                      <span>Connect with Github</span>
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
