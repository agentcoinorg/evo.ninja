import { TestCase, runTestCases } from "./TestCase";

import path from "path";

jest.setTimeout(600000);

describe('Software Development', () => {
  const scriptsDir = path.join(__dirname, "../../../../scripts");

  const cases: TestCase[] = [
    new TestCase(
      "tic_tac_toe",
      "Build a Tic-Tac-Toe game using a python CLI. Here are the specifications.\n\nThe Grid: The game board is a 3x3 grid, consisting of 3 rows and 3 columns, creating a total of 9 squares.\n\nPlayers: There are two players. One player uses the number \"1\", and the other player uses the number \"2\".\n\nTaking Turns: Players take turns to put their respective numbers (\"1\" or \"2\") in an empty square of the grid. Once a player has placed their number in a square, it cannot be changed or removed.\n\nObjective: The goal is to get three of your numbers in a row, either horizontally, vertically, or diagonally.\n\nEnd of the Game: The game concludes in one of two ways: One player gets three of their numbers in a row (horizontally, vertically, or diagonally) and is declared the winner.\nAll squares on the grid are filled, and no player has three in a row. This situation is a \"draw\" or a \"tie\".\n\nTechnical specifications:\nBuild a file called tic_tac_toe.py. This file will be called through command lines. You will have to prompt users for their move. Player 1 will always start.\nPlayers will input their move in the following format: \"x,y\" where x and y represent the location in the grid (0,0 is top left, 2,2 is bottom right).\n\nYour primary requirement is to halt the game when appropriate and to print only one of these three exact sentences:\n\n\"Player 1 won!\"\n\"Player 2 won!\"\n\"Draw\"\n\nEdge cases: A player can send an incorrect location. Either the location is incorrect or the square is already filled. In this case, this counts as doing nothing, and the player gets prompted for new locations again.\n\n\nYou will be expected to create a python file called tic_tac_toe.py that will run through command lines by using ```python tic_tac_toe.py```.\n\nHere is an example of how your tic_tac_toe.py game will be tested.\n```\nprocess = subprocess.Popen(\n    ['python', 'tic_tac_toe.py'],\n    stdout=subprocess.PIPE,\n    text=True\n)\n\noutput, _ = process.communicate('\\n'.join([\"0,0\", \"1,0\", \"0,1\", \"1,1\", \"0,2\"]))\n\nassert \"Player 1 won!\" in output\n```",
      "This is a Heading\nThis is a paragraph.",
      scriptsDir
    ),
    /*new TestCase(
      "three_sum",
      "Create a three_sum function in a file called sample_code.py. Given an array of integers, return indices of the three numbers such that they add up to a specific target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Example: Given nums = [2, 7, 11, 15], target = 20, Because nums[0] + nums[1] + nums[2] = 2 + 7 + 11 = 20, return [0, 1, 2].",
      "This is a Heading\nThis is a paragraph.",
      scriptsDir
    ),
    new TestCase(
      "file_organizer",
      "Create a file organizer CLI tool in Python that sorts files in a directory based on their file types (e.g., images, documents, audio) and moves them into these corresponding folders: 'images', 'documents', 'audio'. The entry point will be a python file that can be run this way: python organize_files.py --directory_path=YOUR_DIRECTORY_PATH",
      "This is a Heading\nThis is a paragraph.",
      scriptsDir
    ),*/
  ];

  runTestCases(cases);
});
