import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faUser, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "./Upload";
import File from "./File";

import CloseIcon from "./CloseIcon";
import SidebarIcon from "./SidebarIcon";
import { useAtom } from "jotai";
import { uploadedFilesAtom, userFilesAtom } from "@/lib/store";
import { useDownloadFilesAsZip } from "@/lib/hooks/useDownloadFilesAsZip";
import { SupabaseBucketWorkspace } from "@/lib/supabase/SupabaseBucketWorkspace";
import ChatList from "./ChatList";
import { createSupabaseClient } from "@/lib/supabase/supabase";
import { useSession } from "next-auth/react";

export interface SidebarProps {
  onSettingsClick: () => void;
  onSidebarToggleClick: () => void;
}

const Sidebar = ({ onSettingsClick, onSidebarToggleClick }: SidebarProps) => {
  const [userFiles] = useAtom(userFilesAtom);
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  // const { data: session } = useSession()
  // const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
  const downloadUserFiles = useDownloadFilesAsZip();

  // const testSupabaseUpload = async () => {
  //   const storage = new SupabaseBucketWorkspace(supabase.storage)
  //   await storage.writeFile("f37e1373-d2e9-4bd5-bf6e-8fda7bd53d36/jaja.txt", "papi q paso pue SIUUUUUU");
  // }

  // const testSupabaseDelete = async () => {
  //   const storage = new SupabaseBucketWorkspace(supabase.storage)
  //   await storage.rm("f37e1373-d2e9-4bd5-bf6e-8fda7bd53d36/jaja.txt");
  // }

  // const testSupabaseRead = async () => {
  //   const storage = new SupabaseBucketWorkspace(supabase.storage)
  //   const t = await storage.readFile("f37e1373-d2e9-4bd5-bf6e-8fda7bd53d36/jaja.txt");
  //   console.log({ t })
  // }

  // const testSupabaseUpdate = async () => {
  //   const storage = new SupabaseBucketWorkspace(supabase.storage)
  //   await storage.rename("f37e1373-d2e9-4bd5-bf6e-8fda7bd53d36/jaja.txt", "f37e1373-d2e9-4bd5-bf6e-8fda7bd53d36/jajazzzz.txt");
  // }

  return (
    <div className="box-border flex h-full w-full flex-col items-center justify-between overflow-auto bg-opacity-black p-4">
      <div className="flex h-auto w-full flex-col items-center gap-4">
        <div className="flex w-full justify-end lg:hidden">
          <div
            className="flex cursor-pointer gap-2"
            onClick={onSidebarToggleClick}
          >
            <span>Close menu</span>
            <CloseIcon></CloseIcon>
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <div
            className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-4 rounded border border-neutral-500 p-3 text-lg text-white opacity-80 transition-all hover:opacity-100"
            onClick={onSettingsClick}
          >
            <FontAwesomeIcon icon={faUser} />
            Account
          </div>
          <div
            className="h-14 cursor-pointer gap-4 rounded border border-neutral-500 p-4 text-lg text-white opacity-80 transition-all hover:opacity-100"
            onClick={onSidebarToggleClick}
          >
            <SidebarIcon />
          </div>
        </div>
        <Upload
          className="flex h-auto max-h-96 w-full flex-col justify-between overflow-y-auto rounded border border-neutral-500 bg-neutral-900 p-4 text-neutral-50"
          onUploadFiles={setUploadedFiles}
        >
          <h3 className="text-lg font-semibold">
            <FontAwesomeIcon icon={faFolder} style={{ marginRight: "10px" }} />{" "}
            WORKSPACE
          </h3>
          {/* <button
            className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
            title="Test"
            onClick={testSupabaseUpload}
          >
            Test upload
          </button>
          <button
            className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
            title="Test"
            onClick={testSupabaseDelete}
          >
            Test delete
          </button>
          <button
            className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
            title="Test"
            onClick={testSupabaseRead}
          >
            Test read
          </button>
          <button
            className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
            title="Test"
            onClick={testSupabaseUpdate}
          >
            Test update
          </button> */}

          <div>
            {userFiles.map((file, i) => (
              <File key={i} file={file} />
            ))}
          </div>
          {userFiles.length !== 0 && (
            <button
              className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
              title="Download"
              onClick={downloadUserFiles}
            >
              <FontAwesomeIcon icon={faDownload} /> Download
            </button>
          )}
        </Upload>

        <ChatList />
      </div>
      <div className="box-border flex w-10/12 flex-col justify-center gap-2">
        <div className="flex justify-center">
          <img
            className="max-w-[16rem]"
            src="/avatar-name.png"
            alt="Main Logo"
          />
        </div>
        <div className="flex justify-center gap-4 text-lg text-white">
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://discord.gg/r3rwh69cCa"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faDiscord} title="Support & Feedback" />
          </a>
          <div className="pointer-events-none">|</div>
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://github.com/polywrap/evo.ninja"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} title="Star us on GitHub" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
