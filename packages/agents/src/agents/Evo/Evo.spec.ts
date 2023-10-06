import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  ContextWindow,
  LlmApi,
  ConsoleLogger,
  Logger,
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLog, DebugLlmApi } from "@evo-ninja/agent-debug";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { Evo } from "../../";
import fs from "fs";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env")
});

jest.setTimeout(120000);

describe('Evo Test Suite', () => {

  function createEvo(testName: string, pathsForFilesToInclude: string[] = []): {
    agent: Evo;
    debugLog: DebugLog;
  } {
    const testCaseDir = path.join(__dirname, ".tests", testName);

    // reset the dir
    rimraf.sync(testCaseDir);

    const env = new Env(process.env as Record<string, string>);
    const logger = new Logger([new ConsoleLogger()], {
      promptUser: () => {
        throw Error("promptUser not supported.");
      },
      logUserPrompt: () => {
        throw Error("logUserPrompt not supported.");
      }
    });

    const llm: LlmApi = new OpenAI(
      env.OPENAI_API_KEY,
      env.GPT_MODEL,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const debugLog = new DebugLog(
      new FileSystemWorkspace(path.join(testCaseDir, "./debug"))
    );
    const debugLlm = new DebugLlmApi(debugLog, llm);

    const contextWindow = new ContextWindow(llm);
    const chat = new Chat(cl100k_base, contextWindow, logger);

    const scriptsDir = path.join(rootDir, "scripts");
    const scriptsWorkspace = new FileSystemWorkspace(
      scriptsDir
    );
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);

    for (const filePath of pathsForFilesToInclude) {
      if (!fs.existsSync(filePath)) {
        throw Error(`Input file does not exist: ${filePath}`);
      }
      const fileName = path.basename(filePath);
      const fileContents = fs.readFileSync(filePath, "utf-8");
      workspace.writeFileSync(fileName, fileContents);
    }

    return {
      agent: new Evo(
        debugLlm,
        chat,
        logger,
        workspace,
        scripts,
        env,
      ),
      debugLog
    };
  }

  async function runEvo(agent: Evo, goal: string, debugLog: DebugLog) {
    debugLog.goalStart(goal);
    const iterator = agent.run({ goal });

    while (true) {
      debugLog.stepStart();
      const response = await iterator.next();
      debugLog.stepEnd();

      if (response.done) {
        if (!response.value.ok) {
          debugLog.stepError(response.value.error ?? "Unknown error");
        } else {
          debugLog.stepLog(JSON.stringify(response.value.value));
        }
        return response;
      }
    }
  }

  test("tic-tac-toe", async () => {
    const { agent, debugLog } = createEvo("tic-tac-toe");
    const response = await runEvo(
      agent,
      "Build a Tic-Tac-Toe game using a python CLI. Here are the specifications.\n\nThe Grid: The game board is a 3x3 grid, consisting of 3 rows and 3 columns, creating a total of 9 squares.\n\nPlayers: There are two players. One player uses the number \"1\", and the other player uses the number \"2\".\n\nTaking Turns: Players take turns to put their respective numbers (\"1\" or \"2\") in an empty square of the grid. Once a player has placed their number in a square, it cannot be changed or removed.\n\nObjective: The goal is to get three of your numbers in a row, either horizontally, vertically, or diagonally.\n\nEnd of the Game: The game concludes in one of two ways: One player gets three of their numbers in a row (horizontally, vertically, or diagonally) and is declared the winner.\nAll squares on the grid are filled, and no player has three in a row. This situation is a \"draw\" or a \"tie\".\n\nTechnical specifications:\nBuild a file called tic_tac_toe.py. This file will be called through command lines. You will have to prompt users for their move. Player 1 will always start.\nPlayers will input their move in the following format: \"x,y\" where x and y represent the location in the grid (0,0 is top left, 2,2 is bottom right).\n\nYour primary requirement is to halt the game when appropriate and to print only one of these three exact sentences:\n\n\"Player 1 won!\"\n\"Player 2 won!\"\n\"Draw\"\n\nEdge cases: A player can send an incorrect location. Either the location is incorrect or the square is already filled. In this case, this counts as doing nothing, and the player gets prompted for new locations again.\n\n\nYou will be expected to create a python file called tic_tac_toe.py that will run through command lines by using ```python tic_tac_toe.py```.\n\nHere is an example of how your tic_tac_toe.py game will be tested.\n```\nprocess = subprocess.Popen(\n    ['python', 'tic_tac_toe.py'],\n    stdout=subprocess.PIPE,\n    text=True\n)\n\noutput, _ = process.communicate('\\n'.join([\"0,0\", \"1,0\", \"0,1\", \"1,1\", \"0,2\"]))\n\nassert \"Player 1 won!\" in output\n```",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("tic_tac_toe.py");
    expect(sourceCode).toBeTruthy();
  });

  test("AnswerQuestionSmallCsv", async () => {
    const { agent, debugLog } = createEvo(
      "AnswerQuestionSmallCsv",
      [path.join(__dirname, "testInputs/AnswerQuestionSmallCsv/file1.csv")]
    );
    const response = await runEvo(
      agent,
      "How much was spent on utilities in total ? Write the answer in an output.txt file.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const result = agent.workspace.readFileSync("output.txt");
    expect(result).toEqual("84");
  });
});
