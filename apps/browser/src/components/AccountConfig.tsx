import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSmileWink,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useSupabase } from "../supabase/useSupabase";
import { useSession } from "../supabase/useSession";
import { OAuthModal } from "./OAuthModal";

interface AccountConfigProps {
  apiKey: string | null;
  allowTelemetry: boolean;
  onConfigSaved: (apiKey: string, allowTelemetry: boolean) => void;
  capReached: boolean;
  firstTimeUser: boolean;
  isOpen: boolean;
  onClose: () => void;
}

function AccountConfig(props: AccountConfigProps) {
  const [apiKey, setApiKey] = useState<string>(props.apiKey || "");
  const [showOauthModal, setShowOauthModal] = useState<boolean>(false);
  const [allowTelemetry, setAllowTelemetry] = useState<boolean>(
    props.allowTelemetry
  );
  const { onConfigSaved, capReached, firstTimeUser } = props;
  const supabase = useSupabase();
  const session = useSession();

  return (
    <>
      <Transition appear show={props.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={props.onClose}>
          <div
            className="fixed inset-0 overflow-y-auto bg-neutral-900/80"
            onClick={() => props.onConfigSaved(apiKey, allowTelemetry)}
          >
            <div
              className="fixed left-1/2 top-1/2 flex w-[100%] max-w-[38rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg bg-neutral-900 p-12 text-neutral-50"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-lg font-semibold">Account</h3>
                <button onClick={() => onConfigSaved(apiKey, allowTelemetry)}>
                  X
                </button>
              </div>

              {firstTimeUser && (
                <div className="flex items-center justify-between px-8 py-2">
                  <FontAwesomeIcon
                    icon={faSmileWink}
                    color="yellow"
                    size="2x"
                  />
                  <h4 className="text-md text-white">
                    Welcome! Please sign in or add an OpenAI API key.
                  </h4>
                </div>
              )}

              <div className="flex items-center justify-between px-8 py-2">
                <h3 className="text-lg font-semibold">Email</h3>
                {session ? (
                  <div className="flex w-[65%] flex-row justify-end gap-5">
                    <h4 className="text-md">{session.user?.email}</h4>
                    <button
                      className="cursor-pointer"
                      onClick={() => supabase.auth.signOut()}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="cursor-pointer rounded-xl border-none bg-orange-600 p-1.5 text-white transition-all hover:bg-orange-500"
                    onClick={() => setShowOauthModal(true)}
                  >
                    Sign in
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-8 py-2">
                <h3 className="text-lg font-semibold">OpenAI Key</h3>
                <input
                  className="w-[65%] justify-end rounded border border-neutral-600 bg-neutral-950 p-1.5 text-neutral-50 outline-none transition-all"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              {capReached && (
                <div className="flex items-center justify-between px-8 py-2">
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    color="yellow"
                    size="2x"
                  />
                  <h4 className="text-md text-white">
                    You have used all of your free daily prompts. Please enter
                    your OpenAI API key or try again tomorrow.
                  </h4>
                </div>
              )}

              <div className="flex items-center justify-between px-8 py-2">
                <h3 className="text-lg font-semibold">Data</h3>
                <div className="flex flex-row justify-end gap-7">
                  <h4 className="text-md">Share prompts with Evo devs</h4>
                  <input
                    type="checkbox"
                    style={{ accentColor: "#f0541a" }}
                    checked={allowTelemetry}
                    onChange={(e) => setAllowTelemetry(!allowTelemetry)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center px-8 py-2">
                <button
                  className="w-[30%] cursor-pointer rounded-xl border-none bg-orange-600 p-2.5 text-white transition-all hover:bg-orange-500"
                  onClick={() => onConfigSaved(apiKey, allowTelemetry)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
      <OAuthModal
        isOpen={showOauthModal}
        onClose={() => setShowOauthModal(false)}
      />
    </>
  );
}

export default AccountConfig;
