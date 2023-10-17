import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  Workspace
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";
import path from "path";

interface InitPoetryFuncParameters {}

export class InitPoetryFunction extends AgentFunctionBase<InitPoetryFuncParameters> {

  get name(): string {
    return "cmd_initPoetry";
  }

  get description(): string {
    return `Initialize a Python Poetry environment in the workspace.`;
  }

  get parameters() {
    return {}
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: InitPoetryFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: InitPoetryFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      await this.poetryInit(context.workspace);
      return this.onSuccess(params, rawParams, context.variables);
    };
  }

  private onSuccess(params: InitPoetryFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: this.name,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            "Initialized Poetry Environment."
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          "Initialized Python Poetry Environment. You can now execute `poetry run [command] [args]` in the shell.",
          variables
        ),
      ]
    }
  }

  private async poetryInit(workspace: Workspace): Promise<void> {
    await workspace.exec("poetry", ["init", "-n"]);
    const dependencies = this.getPythonDependencies(workspace, "/");
    const alwaysAdd = ["pytest"];
    await workspace.exec("poetry", ["add", `${dependencies.concat(alwaysAdd).join(" ")}`]);
  }

  // does not search recursively
  private getPythonDependencies(workspace: Workspace, dir: string): string[] {
    const pythonFiles = workspace.readdirSync(dir)
      .map(dirEntry => dirEntry.name)
      .filter(file => file.endsWith(".py"));

    const imports = pythonFiles.flatMap(file => {
      const filePath = path.join(dir, file);
      const fileContent = workspace.readFileSync(filePath);
      return this.parsePythonImports(fileContent);
    });

    const uniqueImports = Array.from(new Set(imports));

    const externalImports = uniqueImports.filter(importName => {
      const maybeLocalPath = path.join(dir, `${importName}.py`);
      return !workspace.existsSync(maybeLocalPath);
    });

    return externalImports;
  }

  // does not handle relative imports or sub-module imports
  private parsePythonImports(fileContent: string): string[] {
    const imports: string[] = [];

    const singleImportRegex = /^(?:import|from) ([a-zA-Z0-9_]+)(?: import [a-zA-Z0-9_*]+(?: as [a-zA-Z0-9_]+)?)?/gm;
    const multipleImportRegex = /^import ([a-zA-Z0-9_ ,]+)$/gm;
    const multipleFromImportRegex = /^from ([a-zA-Z0-9_]+) import (?:[a-zA-Z0-9_ ,]+)$/gm;

    let match;
    while (match = singleImportRegex.exec(fileContent)) {
      imports.push(match[1]);
    }
    while (match = multipleImportRegex.exec(fileContent)) {
      imports.push(...match[1].split(', ').map(item => item.trim()));
    }
    while (match = multipleFromImportRegex.exec(fileContent)) {
      imports.push(match[1]);
    }

    return imports;
  }
}