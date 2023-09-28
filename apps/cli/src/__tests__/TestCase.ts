import * as rimraf from "rimraf";
import { spawn } from 'child_process';
import path from "path";
import fse from "fs-extra";
import fs from "fs";

export interface TestResult {
  goal: string;
  expected: string;
  received: string;
  success: boolean;
}

export class TestCase {
  constructor(
    public name: string,
    public goal: string,
    public expected: string,
    public initScriptsPath?: string
  ) { }

  public get rootDir() {
    return path.join(__dirname, "test-cases", this.name);
  }

  public reset() {
    rimraf.sync(this.rootDir);
    fs.mkdirSync(this.rootDir, { recursive: true });
    if (this.initScriptsPath) {
      fse.copySync(
        this.initScriptsPath,
        path.join(this.rootDir, "scripts")
      );
    }
  }

  public getResult(): TestResult {
    const received = fs.readFileSync(
      path.join(this.rootDir, "workspace", "output.txt"),
      "utf-8"
    ).trim();

    return {
      goal: this.goal,
      expected: this.expected,
      received,
      success: received === this.expected,
    }
  }
}

export function runTestCases(cases: TestCase[]) {
  cases.forEach((testCase) => {
    test(`Execute operation: ${testCase.goal}`, async () => {
      // Reset the testcase directory
      testCase.reset();

      let result: TestResult | undefined;

      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          'yarn', [
            'start',
            `'${testCase.goal}'`,
            `--root ${testCase.rootDir}`,
            "--timeout 480",
            "--debug"
          ],
          { shell: true }
        );

        child.on('exit', () => {
          result = testCase.getResult();
          resolve();
        });

        child.on('error', (error) => {
          reject(error);
        });
      });

      if (!result) {
        throw Error("This shouldn't happen.");
      }

      expect(result.received).toBe(result.expected);
    });
  });
}
