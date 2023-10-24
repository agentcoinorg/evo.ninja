import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";

export const previewChunks = (chunks: string[], charLimit: number): string => joinUnderCharLimit(chunks, charLimit - "...\n".length, "\n...\n")
export const limitChunks = (chunks: string[], charLimit: number): string[] => getUnderCharLimit(chunks, charLimit)

export const tokensToChars = (tokenCnt: number) => tokenCnt * 4;
export const charsToTokens = (charCnt: number) => Math.floor(charCnt / 4);

export const agentFunctionBaseToAgentFunction = <TRunArgs>(agent: Agent<TRunArgs>) => {
  return (fn: any) => {
    return {
      definition: fn.getDefinition(),
      buildExecutor: (context: AgentContext) => {
        return fn.buildExecutor(agent);
      }
    }
  };
};

export const filterDuplicates = <TItem, TCompare>(items: TItem[], compareBy: (item: TItem) => TCompare): TItem[] => {
  const set = new Set();
  const uniqueItems = [];
  for (const item of items) {
    if (set.has(compareBy(item))) {
      continue;
    }
    uniqueItems.push(item);
    set.add(compareBy(item));
  }

  return uniqueItems;
};

const joinUnderCharLimit = (chunks: string[], characterLimit: number, separator: string): string => {
  let result = "";

  for (const chunk of chunks) {
    if (result.length + chunk.length + separator.length > characterLimit) {
      break;
    }

    if (result === "") {
      result += chunk;
    } else {
      result += separator + chunk;
    }
  }

  return result;
}

const getUnderCharLimit = (chunks: string[], characterLimit: number): string[] => {
  let totalLength = 0;
  const newChunks = [];
  for (const chunk of chunks) {
    if (totalLength + chunk.length > characterLimit) {
      const remainingCharacters = characterLimit - totalLength;
      if (remainingCharacters > 0) {
        newChunks.push(chunk.substring(0, remainingCharacters));
      }
      break;
    }
    newChunks.push(chunk);
    totalLength += chunk.length;
  }
  return newChunks;
}
