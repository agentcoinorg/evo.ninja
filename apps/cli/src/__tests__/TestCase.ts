import * as rimraf from "rimraf";
import path from "path";
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
  ) { }

  public get rootDir() {
    return path.join(__dirname, "test-cases", this.name);
  }

  public reset() {
    rimraf.sync(this.rootDir);
    fs.mkdirSync(this.rootDir, { recursive: true });
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
