import { Chat, ChatLogs, Evo } from "@evo-ninja/agents";
import { buildEvo } from "./buildEvo";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { AgentJobData } from "./AgentJobData";
import { evoAgentJobScheduler } from "./AgentJobScheduler";

export async function runAgentJob(jobId: string, jobData: AgentJobData) {
  const { threadId } = jobData;

  console.log(`Running Evo for thread: '${threadId}'`);

  const evo: Evo = buildEvo();

  const chat = await getChat(threadId);

  const iterator = evo.runWithChat(chat);

  while (true) {
    const { done, value } = await iterator.next();

    if (await shouldStopJob(jobId)) {
      console.log(`Job killed, id: ${jobId}, thread: '${threadId}'`);
      return;
    }
    await saveChat(threadId, chat);

    if (done) {
      console.log(
        `Goal achieved successfully, id: ${jobId}, thread: '${threadId}'`
      );
      return;
    }
    console.log(JSON.stringify(value, null, 2));
  }
}

async function shouldStopJob(jobId: string): Promise<boolean> {
  const result = await evoAgentJobScheduler.getJobData(jobId);

  if (!result.ok) {
    console.log(`Failled fetching job, id: ${jobId}`);
    return true;
  }

  return result.value.shouldStop;
}

async function getChat(threadId: string): Promise<Chat> {
  const logs = await getChatLogs(threadId);

  const chat = new Chat(cl100k_base);

  for (const message of logs.get("persistent").msgs) {
    chat.persistent(message);
  }

  for (const message of logs.get("temporary").msgs) {
    chat.temporary(message);
  }

  return chat;
}

async function getChatLogs(threadId: string): Promise<ChatLogs> {
  return ChatLogs.from([], [], cl100k_base);
}

async function saveChat(threadId: string, chat: Chat): Promise<void> {}
