import { SupabaseBucketWorkspace } from "./SupabaseBucketWorkspace";

import { createSupabaseClient } from "@/lib/api/utils/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseClient();

  // const threadId = request.threadId as string;

  // console.log("Adding job to the queue: " + threadId);
  const bucketName = "jure-bucket";

  const workspace = new SupabaseBucketWorkspace(bucketName, supabase.storage);

  await workspace.init();
  console.log("Workspace initialized", await workspace.exists("AbA.txt"));
  const testFile1 = await workspace.readFile("AbA.txt");
  console.log("Test file1 written", testFile1);

  await workspace.writeFile("hey.txt", "Hello world from the test dir2!");

  const dir = await workspace.readdir("./test2");
  console.log("Dir", dir);
  // const file = await workspace.readFile("hello.txt");

  // console.log("File written", file);

  // await workspace.mkdir("test3");

  // const testFile = await workspace.readFile("test3/helloA.txt");
  // console.log("Test file written", testFile);

  // const dir = await workspace.readdir("/");
  // console.log("Dir", dir);

  // const testDir = await workspace.readdir("./test3");
  // console.log("Test dir", testDir);

  // await workspace.writeFile(
  //   "test3/helloB.txt",
  //   "Hello world from the test dir2!"
  // );
  // const testFile2 = await workspace.readFile("test3/helloB.txt");
  // console.log("Test file2 written", testFile2);

  // const testDir2 = await workspace.readdir("./test3");
  // console.log("Test dir2", testDir2);

  // const dir2 = await workspace.readdir("/");
  // console.log("Dir2", dir2);

  // await workspace.rmdir("./test3", { recursive: true });

  // const testDir3 = await workspace.readdir("./test3");
  // console.log("Test dir3", testDir3);

  // const dir3 = await workspace.readdir("/");
  // console.log("Dir3", dir3);

  return NextResponse.json({}, { status: 200 });

  // const result = await evoAgentJobScheduler.startJob(threadId);

  // if (!result.ok) {
  //   return res.status(500).json({
  //     error: "Failed to add job to the queue",
  //   });
  // }

  // return res.status(200).json({
  //   jobId: result.value.id,
  // });
}
