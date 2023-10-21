import { AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@evo-ninja/agent-utils";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import { Agent } from "../Agent";
import { CoderAgent } from "../scriptedAgents/Coder";
interface CodeFuncParameters {
  query: string;
  testResults?: string;
}

export class CodeFunction extends LlmAgentFunctionBase<CodeFuncParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "code";
  description: string = "Writes code for a given query";
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The query to write code for"
      },
      testResults: {
        type: "string",
        description: "Test results for the current code"
      }
    },
    required: ["query"],
    additionalProperties: false
  };

  buildExecutor({ context }: Agent<unknown>): (params: CodeFuncParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: CodeFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const codeAndTest = async (currentTestResults: string | undefined = undefined, iteration = 0): Promise<void> => {
        console.log("ITERATION: ", iteration)
        
        if (iteration > 10) {
          throw new Error("Failed to write code: too many iterations")
        }

        // 1. Read and stringify all files in workspace
        const filesAndDirs = context.workspace.readdirSync("/");
        const files = filesAndDirs.filter((f) => f.type === "file");
        const filesWithContents = files.map((f) => ({
          name: f.name,
          content: context.workspace.readFileSync(f.name)
        }))

        const finalFilesString = filesWithContents.map((f) => `
        Name: ${f.name}
        Content: ${f.content}
  
        `).join("\n")

        console.log("GETTING CODE")
  
        // 2. Produce code from query and files in workspace
        const codeResponse = await this.askLlm(`You are a senior Python developer tasked to write python code, upon receiving
        a query and the contents of all relevant files on your workspace. You will also be sometimes given
        the results of the tests for the currently existing code; to guide your implementation.
    
        You will write to a file the necessary python code to achieve the given query. If you already see a source file
        with part of the code, work from it and add the missing parts, or fix the errors if the test results are failing.
        
        Do NOT explain the code. Just write the code.

        Pay attention to imports, and make sure to implement the code completely, without leaving TODOs.

        Files: ${finalFilesString}
        -------------------------------
        ${currentTestResults ? `Test Results: ${currentTestResults}\n-------------------------------` : ""}
        Query: ${params.query}`);
  
        console.log("CODE RESPONSE: ", codeResponse)

        // 3. Extract code from 2. and write it to a file
        const response = await this.askAgent(new CoderAgent(
          context.cloneEmpty()
        ), {
          goal: codeResponse ?? "",
        }, context.cloneEmpty())
  
        if (!response.ok) {
          throw new Error("Failed to write code: " + response.error?.toString() || "Unknown error")
        }
        
        console.log("AGENT RESPONSE: ", JSON.stringify(response.value, null, 2))
  
        // 4. Run tests
        const testResults = await context.workspace.exec("pytest")
        const testResultsString = JSON.stringify(testResults, null, 2)

        console.log("TEST RESULTS: ", testResultsString)
  
        // 5. If failed, summarize test results and ask for new code
        if (testResultsString.includes("FAILED") || testResults.exitCode !== 0) {
          const testResultsSummary = await this.askLlm(`Summarize the test results and its errors.
          This summary will be used by a developer agent, be precise:
          
          ${testResultsString}`)

          return codeAndTest(testResultsSummary, iteration + 1)
        }
      }

      await codeAndTest();

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ...ChatMessageBuilder.functionCallResultWithVariables(this.name, "", context.variables)
        ]
      };
    }
  }
}
