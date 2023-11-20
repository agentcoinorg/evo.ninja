export class Prompt {
  constructor(private readonly _text: string = "") {
  }

  text(text: string): Prompt {
    return new Prompt(this._text + toPrompt(text));
  }

  block(text: string): Prompt {
    return new Prompt(this._text + `\`\`\`${toPrompt(text)}\`\`\``);
  }

  json<T>(obj: T): Prompt {
    return new Prompt(this._text + `\`\`\`${toPrompt(JSON.stringify(obj))}\`\`\``);
  }

  line(builder: ((prompt: Prompt) => Prompt | string) | string): Prompt {
    if (typeof builder === "string") {
      return new Prompt(this._text + "\n" + toPrompt(builder));
    } else {
      const result = builder(new Prompt());
      if (typeof result === "string") {
        return new Prompt(this._text + "\n" + toPrompt(result));
      } else {
        return new Prompt(this._text + "\n" + result.toString());
      }
    }
  }

  toString(): string {
    return this._text;
  }
}

const lowestPaddingCount = (text: string) => text.split("\n").map(x => {
  let count = 0;
  for (const char of x) {
    if (char === " ") {
      count++;
    } else {
      break;
    }
  }
  return count;
}).reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER);
const removePadding = (text: string) => {
  const lines = text.split("\n");
  const lowestPadding = lowestPaddingCount(text);
  return lines.map(x => x.substring(lowestPadding, x.length)).join("\n");
};
const removeEmptyFirstLine = (text: string) => text.startsWith("\n") ? text.substring(1, text.length) : text;

const toPrompt = (text: string) => removePadding(removeEmptyFirstLine(text));