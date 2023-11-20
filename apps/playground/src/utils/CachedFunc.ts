import fs from "fs";
import { Tokenizer } from "@evo-ninja/agents";
import { LazyFunc } from "./LazyFunc";

export class CachedFunc<TRes> extends LazyFunc<TRes> {
  constructor(private readonly id: string, func: () => TRes, private readonly tokenizer: Tokenizer) {
    super(func);

    if (!fs.existsSync("../../workspace/.cache")) {
      fs.mkdirSync("../../workspace/.cache", { recursive: true });
    }
  }

  async exec(): Promise<TRes> {
    const cached = await this.load();
    if (cached) {
      return cached.val;
    }

    const time = performance.now();
    const result = await super.exec();
    const timeElapsedInSec = (performance.now() - time) / 1000;
    await this.save(result, timeElapsedInSec);
    return result;
  }

  private async load(): Promise<SavedResult<TRes> | undefined> {
    const path = `../../workspace/.cache/${this.id}.json`;
    if (!fs.existsSync(path)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(path, "utf8")) as SavedResult<TRes>;
  }

  private async save(result: TRes, timeElapsedInSec: number): Promise<void> {
    const path = `../../workspace/.cache/${this.id}.json`;

    fs.writeFileSync(path, JSON.stringify({
      val: result,
      timeElapsedInSec,
      tokens: this.tokenizer.encode(JSON.stringify(result)).length,
    }, null, 2));
  }
}

export type SavedResult<TRes> = {
  val: TRes;
  timeElapsedInSec: number;
  tokens: number;
};
