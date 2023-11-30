import {
  Chat,
  LlmApi,
  OpenAILlmApi,
  OpenAIEmbeddingAPI,
} from "@/agent-core";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import fs from "fs";
import { AgentContext } from "@/agent-core";
import { LlmModel } from "@/agent-core";
import { Agent } from "../utils";
import { DeveloperAgent } from ".";
import { Env, Logger, ConsoleLogger, Scripts, SubWorkspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLlmApi, DebugLog } from "@/agent-debug";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env")
});

jest.setTimeout(600000);

describe('Dev Agent Test Suite', () => {

  function createDevAgent(testName: string, pathsForFilesToInclude: string[] = []): {
    agent: Agent;
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
    });

    const llm: LlmApi = new OpenAILlmApi(
      env.OPENAI_API_KEY,
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const debugLog = new DebugLog(
      new FileSystemWorkspace(path.join(testCaseDir, "./debug"))
    );
    const debugLlm = new DebugLlmApi(debugLog, llm);

    const chat = new Chat(cl100k_base);

    const scriptsDir = path.join(rootDir, "scripts");
    const scriptsWorkspace = new FileSystemWorkspace(
      scriptsDir
    );
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);
    const internals = new SubWorkspace(".evo", workspace);
    const embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base);

    for (const filePath of pathsForFilesToInclude) {
      if (!fs.existsSync(filePath)) {
        throw Error(`Input file does not exist: ${filePath}`);
      }
      const fileName = path.basename(filePath);
      const fileContents = fs.readFileSync(filePath, "utf-8");
      workspace.writeFileSync(fileName, fileContents);
    }

    return {
      agent: new DeveloperAgent(
        new AgentContext(
          debugLlm,
          embedding,
          chat,
          logger,
          workspace,
          internals,
          env,
          scripts,
        )
      ),
      debugLog
    };
  }

  async function runDevAgent(agent: Agent, goal: string, debugLog: DebugLog) {
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
    const { agent, debugLog } = createDevAgent("tic-tac-toe");
    const response = await runDevAgent(
      agent,
      "Build a Tic-Tac-Toe game using a python CLI. Here are the specifications.\n\nThe Grid: The game board is a 3x3 grid, consisting of 3 rows and 3 columns, creating a total of 9 squares.\n\nPlayers: There are two players. One player uses the number \"1\", and the other player uses the number \"2\".\n\nTaking Turns: Players take turns to put their respective numbers (\"1\" or \"2\") in an empty square of the grid. Once a player has placed their number in a square, it cannot be changed or removed.\n\nObjective: The goal is to get three of your numbers in a row, either horizontally, vertically, or diagonally.\n\nEnd of the Game: The game concludes in one of two ways: One player gets three of their numbers in a row (horizontally, vertically, or diagonally) and is declared the winner.\nAll squares on the grid are filled, and no player has three in a row. This situation is a \"draw\" or a \"tie\".\n\nTechnical specifications:\nBuild a file called tic_tac_toe.py. This file will be called through command lines. You will have to prompt users for their move. Player 1 will always start.\nPlayers will input their move in the following format: \"x,y\" where x and y represent the location in the grid (0,0 is top left, 2,2 is bottom right).\n\nYour primary requirement is to halt the game when appropriate and to print only one of these three exact sentences:\n\n\"Player 1 won!\"\n\"Player 2 won!\"\n\"Draw\"\n\nEdge cases: A player can send an incorrect location. Either the location is incorrect or the square is already filled. In this case, this counts as doing nothing, and the player gets prompted for new locations again.\n\n\nYou will be expected to create a python file called tic_tac_toe.py that will run through command lines by using ```python tic_tac_toe.py```.\n\nHere is an example of how your tic_tac_toe.py game will be tested.\n```\nprocess = subprocess.Popen(\n    ['python', 'tic_tac_toe.py'],\n    stdout=subprocess.PIPE,\n    text=True\n)\n\noutput, _ = process.communicate('\\n'.join([\"0,0\", \"1,0\", \"0,1\", \"1,1\", \"0,2\"]))\n\nassert \"Player 1 won!\" in output\n```",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("tic_tac_toe.py");
    expect(sourceCode).toBeTruthy();
  });

  test("three-sum", async () => {
    const { agent, debugLog } = createDevAgent("three-sum");
    const response = await runDevAgent(
      agent,
      "Create a three_sum function in a file called sample_code.py. Given an array of integers, return indices of the three numbers such that they add up to a specific target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Example: Given nums = [2, 7, 11, 15], target = 20, Because nums[0] + nums[1] + nums[2] = 2 + 7 + 11 = 20, return [0, 1, 2].",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("sample_code.py");
    expect(sourceCode).toBeTruthy();
  });

  test("FileOrganizer", async () => {
    const { agent, debugLog } = createDevAgent("FileOrganizer");
    const response = await runDevAgent(
      agent,
      "Create a file organizer CLI tool in Python that sorts files in a directory based on their file types (e.g., images, documents, audio) and moves them into these corresponding folders: 'images', 'documents', 'audio'. The entry point will be a python file that can be run this way: python organize_files.py --directory_path=YOUR_DIRECTORY_PATH",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("organize_files.py");
    expect(sourceCode).toBeTruthy();
  });

  test("Battleship", async () => {
    const { agent, debugLog } = createDevAgent(
      "Battleship",
      [
        path.join(__dirname, "testInputs/Battleship/__init__.py"),
        path.join(__dirname, "testInputs/Battleship/abstract_class.py"),
        path.join(__dirname, "testInputs/Battleship/conftest.py"),
        path.join(__dirname, "testInputs/Battleship/product_requirements.txt"),
        path.join(__dirname, "testInputs/Battleship/test_negative.py"),
        path.join(__dirname, "testInputs/Battleship/test_positive.py"),
        path.join(__dirname, "testInputs/Battleship/user_stories.txt"),
      ]
    );
    const response = await runDevAgent(
      agent,
      "Build a battleship game\n\nSpecifications:\n\nOverview: Battleship is a two-player strategy game where each player places their fleet of ships on a grid and tries to sink the opponent's fleet by guessing their locations.\nPlayers take turns calling out a row and column, attempting to name a square containing one of the opponent's ships.\n\nThe Grid: Each player's grid is a 10x10 grid, identified by rows (using numbers 1-10) and columns (using letters A-J).\n\nShips:\n\nCarrier - 5 squares\nBattleship - 4 squares\nCruiser - 3 squares\nSubmarine - 3 squares\nDestroyer - 2 squares\nEach ship occupies contiguous squares on the grid, arranged either horizontally or vertically.\n\nSetup:\n\nAt the start of the game, each player places their fleet on their grid. This setup is hidden from the opponent.\nThe game begins with Player 1, followed by Player 2, and so on.\nTaking Turns:\n\nOn a player's turn, they announce a grid square (e.g., \"D5\").\nThe opponent announces whether that square is a \"hit\" (if there's a part of a ship on that square) or \"miss\" (if the square is empty).\nIf a player hits a square occupied by a ship, they get another turn to guess. This continues until they make a miss, at which point their turn ends.\nIf a player hits all the squares occupied by a ship, the opponent must announce the sinking of that specific ship, e.g., \"You sank my Battleship!\"\n\nObjective: The goal is to sink all of your opponent's ships before they sink yours.\n\nEnd of the Game: The game ends when one player has sunk all of the opponent's ships. The winner is the player who sinks all the opposing fleet first.\n\nTechnical details:\nIn your root folder you will find an abstract class that defines the public interface of the Battleship class you will have to build:\n```\nfrom abc import ABC, abstractmethod\nfrom typing import Optional\n\nfrom pydantic import BaseModel, validator\n\n\n# Models for the request and response payloads\nclass ShipPlacement(BaseModel):\n    ship_type: str\n    start: dict  # {\"row\": int, \"column\": str}\n    direction: str\n\n    @validator(\"start\")\n    def validate_start(cls, start):\n        row, column = start.get(\"row\"), start.get(\"column\")\n\n        if not (1 <= row <= 10):\n            raise ValueError(\"Row must be between 1 and 10 inclusive.\")\n\n        if column not in list(\"ABCDEFGHIJ\"):\n            raise ValueError(\"Column must be one of A, B, C, D, E, F, G, H, I, J.\")\n\n        return start\n\n\nclass Turn(BaseModel):\n    target: dict  # {\"row\": int, \"column\": str}\n\n\nclass TurnResponse(BaseModel):\n    result: str\n    ship_type: Optional[str]  # This would be None if the result is a miss\n\n\nclass GameStatus(BaseModel):\n    is_game_over: bool\n    winner: Optional[str]\n\n\nfrom typing import List\n\n\nclass Game(BaseModel):\n    game_id: str\n    players: List[str]\n    board: dict  # This could represent the state of the game board, you might need to flesh this out further\n    ships: List[ShipPlacement]  # List of ship placements for this game\n    turns: List[Turn]  # List of turns that have been taken\n\n\nclass AbstractBattleship(ABC):\n    SHIP_LENGTHS = {\n        \"carrier\": 5,\n        \"battleship\": 4,\n        \"cruiser\": 3,\n        \"submarine\": 3,\n        \"destroyer\": 2,\n    }\n\n    @abstractmethod\n    def create_ship_placement(self, game_id: str, placement: ShipPlacement) -> None:\n        \"\"\"\n        Place a ship on the grid.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def create_turn(self, game_id: str, turn: Turn) -> TurnResponse:\n        \"\"\"\n        Players take turns to target a grid cell.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def get_game_status(self, game_id: str) -> GameStatus:\n        \"\"\"\n        Check if the game is over and get the winner if there's one.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def get_winner(self, game_id: str) -> str:\n        \"\"\"\n        Get the winner of the game.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def get_game(self) -> Game:\n        \"\"\"\n        Retrieve the state of the game.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def delete_game(self, game_id: str) -> None:\n        \"\"\"\n        Delete a game given its ID.\n        \"\"\"\n        pass\n\n    @abstractmethod\n    def create_game(self, game_id: str) -> None:\n        \"\"\"\n        Create a new game.\n        \"\"\"\n        pass\n\n```\nAt any moment you can run ```pytest``` to execute the tests.\nYou have two types of test: \n- positive tests => test the battleship game being used in ideal conditions\n- negative tests => tests the battleship game behaviour when used incorrectly\n\nSuccess criteria:\n- you will need to write a file called battleship.py that implements the abstract Battleship class.\n- this class will have to pass all the tests.\n- you're not allowed to modify any other file than the battleship.py. You can add other files as long as the main entrypoint is the battleship class.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("battleship.py");
    expect(sourceCode).toBeTruthy();
  });

  test("PasswordGenerator", async () => {
    const { agent, debugLog } = createDevAgent("PasswordGenerator");
    const response = await runDevAgent(
      agent,
      "Create a random password generator. The password should have between 8 and 16 characters and should contain letters, numbers and symbols. The password should be printed to the console. The entry point will be a python file that can be run this way: python password_generator.py [--len x] where x is the length of the password. If no length is specified, the password should be 8 characters long. The password_generator can also be imported as a module and called as password = password_generator.generate_password(len=x). Any invalid input should raise a ValueError.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("password_generator.py");
    expect(sourceCode).toBeTruthy();
  });

  test("UrlShortener", async () => {
    const { agent, debugLog } = createDevAgent("UrlShortener");
    const response = await runDevAgent(
      agent,
      "Build a basic URL shortener using a python CLI. Here are the specifications.\n\nFunctionality: The program should have two primary functionalities.\n\nShorten a given URL.\nRetrieve the original URL from a shortened URL.\n\nCLI: The command-line interface should accept a URL as its first input. It should be able to determine if the url is a shortened url or not. If the url is not shortened, it will display ONLY the shortened url, otherwise, it will display ONLY the original unshortened URL. Afterwards, it should prompt the user for another URL to process.\n\nTechnical specifications:\nBuild a file called url_shortener.py. This file will be called through command lines.\n\nEdge cases:\nFor the sake of simplicity, there will be no edge cases, you can assume the input is always correct and the user immediately passes the shortened version of the url he just shortened.\n\nYou will be expected to create a python file called url_shortener.py that will run through command lines by using python url_shortener.py.\n\nThe url_shortener.py will be tested this way:\n```\nimport unittest\nfrom url_shortener import shorten_url, retrieve_url\n\nclass TestURLShortener(unittest.TestCase):\n    def test_url_retrieval(self):\n        # Shorten the URL to get its shortened form\n        shortened_url = shorten_url('https://www.example.com')\n\n        # Retrieve the original URL using the shortened URL directly\n        retrieved_url = retrieve_url(shortened_url)\n\n        self.assertEqual(retrieved_url, 'https://www.example.com', \"Retrieved URL does not match the original!\")\n\nif __name__ == \"__main__\":\n    unittest.main()\n```",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("url_shortener.py");
    expect(sourceCode).toBeTruthy();
  });
});