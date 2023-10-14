import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext, ScriptedAgentRunArgs } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ChatCompletionRequestMessage } from "openai";
import { RunPythonTestFunction } from "../../functions/RunPythonTest";

export class QualityAssuranceAgent extends ScriptedAgent {
    constructor(context: ScriptedAgentContext) {
        const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
        const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
        const runPythonTest = new RunPythonTestFunction(context.client, context.scripts);

        const config: ScriptedAgentConfig = {
            name: "QualityAssurance",
            expertise: "run tests and analyses errors of python code to give feedback on how it should be fixed",
            initialMessages: function ({ goal }: ScriptedAgentRunArgs): ChatCompletionRequestMessage[] {
                return [
                    {
                        role: "user",
                        content: `
You're an assistant that can run python tests and analyse the output. You must run tests to see if code created is correct.
If test fails, you will check the error and think step by step what should be changed in the current code to make it work. You
must make sure that something has been changed before running the tests again; this way you guarantee that you're iterating code.

You will return the response of a successful test with ${onGoalAchievedFn.name}; and an explicit error saying what should be improved
with ${onGoalFailedFn.name}
`
                    }, {
                        role: "user",
                        content: goal
                    }
                ]
            },
            loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
            shouldTerminate: (functionCalled) => {
                return [
                  onGoalAchievedFn.name,
                  onGoalFailedFn.name
                ].includes(functionCalled.name);
            },
            functions: [
                onGoalAchievedFn,
                onGoalFailedFn,
                runPythonTest
            ]
        }
        super(config, context)
    }
}