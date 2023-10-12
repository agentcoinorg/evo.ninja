import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { DataVerifierAgent } from "../DataVerifier";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { SortCsvFunction } from "../../functions/SortCsv";
import { SortCsvColumnsFunction } from "../../functions/SortCsvColumns";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { AddCsvColumnFunction } from "../../functions/AddCsvColumn";
import { JoinCsvFunction } from "../../functions/JoinCsv";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";

import { Chat } from "@evo-ninja/agent-utils";

export class DataAnalystAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );
    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const AGENT_NAME = "DataAnalyst";

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: "adept at processing CSV files, extracting key data points, and performing calculations to derive insights from the information.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content:
`You are the Data Analyst Agent, an expert in handling and analyzing CSV datasets. Your primary skill set includes reading, analyzing, formatting, modifying, and interpreting data to provide meaningful conclusions.

PROCESS:

1. Always start by reading the data first. You MUST read and understand the data first to avoid blindly modifying it. Approach every dataset with a keen eye for detail, ensuring accuracy and relevance in all your calculations.
2. Respect user-defined formatting. If the user specifies a format, ensure it is adhered to in your outputs. 
3. If you encounter insufficient information, it might be located within the user's filesystem. Use the "fs_readDirectory" function to explore and discover any missing data.
4. Once you believe you have completed a task, you MUST ask the DataVerifier agent to verify your work, given the user's goal. Pass any relevant information, and the user's goal, into the DataVerifier using the "context" function parameter.
5. If the DataVerifier highlights any issues or failures in its verification, make every effort to address and rectify them. Do not fail unless you've exhausted all possible solutions.

NOTE: You do not directly communicate with the user.`
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      agentSpeakPrompt:
    `You do not communicate with the user. If you have insufficient information, it may exist somewhere in the user's filesystem.
    Use the "fs_readDirectory" function to try and discover this missing information.`,
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new ReadFileFunction(context.client, context.scripts),
        new WriteFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
        new SortCsvFunction(context.client, context.scripts),
        new SortCsvColumnsFunction(context.client, context.scripts),
        new AddCsvColumnFunction(context.client, context.scripts),
        new CsvSumColumnFunction(context.client, context.scripts),
        new CsvFilterRowsFunction(context.client, context.scripts),
        new JoinCsvFunction(context.client, context.scripts),
        new DelegateAgentFunction(() => new DataVerifierAgent({
          ...context,
          chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
        }))
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, context);
  }
}
