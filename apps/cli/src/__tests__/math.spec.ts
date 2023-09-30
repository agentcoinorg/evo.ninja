import { TestCase, runTestCases } from "./TestCase";

import path from "path";

jest.setTimeout(600000);

describe('Math', () => {
  const scriptsDir = path.join(__dirname, "../../../../scripts");

  const cases: TestCase[] = [
    // Mathematics
    new TestCase(
      "math_add",
      "Add the numbers 5 & 3 and save the result to a file named output.txt",
      "8",
      scriptsDir
    ),
  ];

  runTestCases(cases);
});
