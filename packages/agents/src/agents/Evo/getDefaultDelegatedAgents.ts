import { Chat } from "@evo-ninja/agent-utils";
import { DataAnalystAgent, DeveloperAgent, ResearcherAgent, ScriptedAgentContext, ScriptedAgentOrFactory } from "../../scriptedAgents";
import { Scripter } from "../Scripter";

export const getDefaultDelegatedAgents = (context: ScriptedAgentContext): ScriptedAgentOrFactory[] => {
  return [
    () => new DeveloperAgent({
      ...context,
      chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
    }),
    () => new ResearcherAgent({
      ...context,
      chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
    }
    ),
    () => new DataAnalystAgent({
      ...context,
      chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
    }),
    () => new Scripter(
      {
        ...context,
        chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
      },
      context.scripts,
    ),
  ];
};
