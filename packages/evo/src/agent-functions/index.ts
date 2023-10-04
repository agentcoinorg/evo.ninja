import { delegateSubAgent } from "./delegateSubAgent";
import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";
import { AgentContext } from "../AgentContext";

import { AgentFunction, Chat } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";
import {
  DevAgent,
  ResearchAgent
} from "@evo-ninja/subagents";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext>[] {
  return [
    createScript(createScriptWriter),
    executeScript,
    findScript,
    readVar,
    delegateSubAgent(
      "Developer",
      "developing software",
      (context: AgentContext) => new DevAgent(
        context.llm,
        new Chat(context.chat.tokenizer, context.chat.contextWindow),
        context.workspace,
        context.scripts,
        context.logger,
        context.env
      )
    ),
    delegateSubAgent(
      "Researcher",
      "researching information online",
      (context: AgentContext) => new ResearchAgent(
        context.llm,
        new Chat(context.chat.tokenizer, context.chat.contextWindow),
        context.workspace,
        context.scripts,
        context.logger,
        context.env
      )
    )
  ];
}
