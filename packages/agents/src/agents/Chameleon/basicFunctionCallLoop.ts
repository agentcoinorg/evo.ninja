import { Chat, AgentFunction, ExecuteAgentFunctionCalled, ExecuteAgentFunctionResult, AGENT_SPEAK_RESPONSE, AgentOutput, RunResult, processFunctionAndArgs, AgentOutputType, executeAgentFunction, ChatMessage, LlmQueryBuilderV2 } from "@evo-ninja/agent-utils";
import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentContext } from "../../AgentContext";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent } from "../../scriptedAgents";
import { ScripterAgent } from "../Scripter";
import { Agent } from "../../Agent";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { TextChunker } from "./TextChunker";
import { Rag } from "./Rag";

export async function* basicFunctionCallLoop(
  context: AgentContext,
  funcs: AgentFunction<AgentContext>[],
  shouldTerminate: (
    functionCalled: ExecuteAgentFunctionCalled,
    result: ExecuteAgentFunctionResult["result"]
  ) => boolean,
  loopPreventionPrompt: string,
  agentSpeakPrompt: string = AGENT_SPEAK_RESPONSE
): AsyncGenerator<AgentOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;
  const queryBuilder = (msgs?: ChatMessage[]) => new LlmQueryBuilderV2(context.llm, context.chat.tokenizer, msgs);
  const getQuery = (msg: ChatMessage) => queryBuilder([msg])
    .message("user", "What is the obove message trying to achieve?")
    .build()
    .content();

  while (true) {
    console.log("CHAT LOGS1.1", chat.chatLogs.messages.length);
    let query = "";
    if (chat.chatLogs.messages.length <= 2) {
      query = chat.chatLogs.messages[chat.chatLogs.messages.length - 1].content ?? "";
    } else {
      const lastMessage = chat.chatLogs.messages[chat.chatLogs.messages.length - 1];

      if (lastMessage.content && lastMessage.content.length > 2000) {
        console.log("CHAT LOGS1.1.1", chat.chatLogs.messages.length);
        console.log("MSG - 2", chat.chatLogs.messages[chat.chatLogs.messages.length - 2]);

        const q = await getQuery(chat.chatLogs.messages[chat.chatLogs.messages.length - 2]);
        console.log("CHAT LOGS1.1.2", chat.chatLogs.messages.length);

        await shortenMessage(lastMessage, q, context);
      }
      console.log("CHAT LOGS1.1.3", chat.chatLogs.messages.length);

      console.log("MSG - lastMessage", lastMessage);
      query = await getQuery(lastMessage);
    }
    console.log("QUERY", query);
    console.log("QUERY.length", query.length);
    console.log("QUERY.tokens", chat.tokenizer.encode(query).length);
    console.log("CHAT LOGS1.2", chat.chatLogs.messages.length);

    await shortenLargeMessages(query, chat, context);
    console.log("CHAT LOGS1.3", chat.chatLogs.messages.length);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(query, context);
    console.log("CHAT LOGSX", chat.chatLogs.messages.length);

    const newLogs = chat.chatLogs.clone();
    newLogs.insert("persistent", {
      tokens: 0,
      msgs: [{
        role: "user",
        content: persona,
      } as ChatMessage],
    }, 0);


    console.log("CHAT LOGS2", newLogs.messages.length);

    const response = await llm.getResponse(newLogs, agentFunctions.map(f => f.definition));

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      console.log("Function", name);

      const sanitizedFunctionAndArgs = processFunctionAndArgs(name, args, allFunctions.map((fn) => {
        return {
          definition: fn.getDefinition(),
          buildExecutor: (context: AgentContext) => {
            return fn.buildExecutor(agent);
          }
        }
      }), context.variables)
      if (!sanitizedFunctionAndArgs.ok) {
        chat.temporary(response);
        chat.temporary("system", sanitizedFunctionAndArgs.error);
        yield { type: AgentOutputType.Error, title: `Failed to sanitize function ${name} with args ${args}. Error: ${sanitizedFunctionAndArgs.error}`, content: sanitizedFunctionAndArgs.error } as AgentOutput;
        continue;
      }

      const { result, functionCalled } = await executeAgentFunction(sanitizedFunctionAndArgs.value, args, context)

      result.messages.forEach(x => chat.temporary(x));
      const terminate = functionCalled && shouldTerminate(functionCalled, result);

      for (let i = 0; i < result.outputs.length; i++) {
        const output = result.outputs[i];

        if (i === result.outputs.length - 1 && terminate) {
          return ResultOk(output);
        }

        yield output;
      }
    } else {
      yield* _preventLoopAndSaveMsg(chat, response, loopPreventionPrompt, agentSpeakPrompt);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: ChatMessage, loopPreventionPrompt: string, agentSpeakPrompt: string): AsyncGenerator<AgentOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", loopPreventionPrompt);
      yield {
        type: AgentOutputType.Warning,
        title: "Loop prevention",
        content: loopPreventionPrompt
      } as AgentOutput;
  } else {
    chat.temporary(response);
    chat.temporary("system", agentSpeakPrompt);
    yield {
      type: AgentOutputType.Message,
      title: "Agent message",
      content: response.content ?? ""
    } as AgentOutput;
  }
}

const findBestAgent = async (query: string, context: AgentContext): Promise<[Agent<unknown>, AgentFunction<AgentContext>[], string, AgentFunctionBase<unknown>[]]> => {
  const allAgents: Agent[] = [
    DeveloperAgent,
    ResearcherAgent,
    DataAnalystAgent,
    ScripterAgent
  ].map(agentClass => new agentClass(context.cloneEmpty()));

  const agentsWithPrompts = allAgents.map(agent => {
    return {
      persona: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      // persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });


  const agents = await Rag.standard<{ persona: string, agent: Agent}>(context)
    .items(agentsWithPrompts)
    .limit(1)
    .selector(x => x.persona)
    .query(query);

  const agentsWithPrompt = agents[0];

  return [
    agentsWithPrompt.agent, 
    agentsWithPrompt.agent.config.functions.map((fn: any) => {
      return {
        definition: fn.getDefinition(),
        buildExecutor: (context: AgentContext) => {
          return fn.buildExecutor(agentsWithPrompt.agent);
        }
      }
    }),
    agentsWithPrompt.persona, 
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};

const shortenLargeMessages = async (query: string, chat: Chat, context: AgentContext): Promise<void> => {
  for(let i = 2; i < chat.chatLogs.messages.length ; i++) {
    const message = chat.chatLogs.messages[i];
    if (message.content && message.content.length > 2000) {
      await shortenMessage(message, query, context);
    }
  }
};

const shortenMessage = async (message: ChatMessage, query: string, context: AgentContext): Promise<void> => {
    const result = await Rag.text(context)
      .chunks(TextChunker.multiLines(message.content ?? "", 10))
      .limit(50)
      .characterLimit(2000)
      .query(query);

    message.content = "...\n" + result.join("\n...\n");
};
