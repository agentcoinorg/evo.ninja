import { RunnableAgent } from "../agent";
import { AgentContext } from "../agent/AgentContext";

export * from "./LazyArray";

export const previewChunks = (chunks: string[], charLimit: number): string => joinUnderCharLimit(chunks, charLimit - "...\n".length, "\n...\n")
export const limitChunks = (chunks: string[], charLimit: number): string[] => getUnderCharLimit(chunks, charLimit)

export const tokensToChars = (tokenCnt: number) => tokenCnt * 4;
export const charsToTokens = (charCnt: number) => Math.floor(charCnt / 4);

export const agentFunctionBaseToAgentFunction = <TRunArgs>(agent: RunnableAgent<TRunArgs>) => {
  return (fn: any) => {
    return {
      definition: fn.getDefinition(),
      buildExecutor: (_: AgentContext) => {
        return fn.buildExecutor(agent);
      }
    }
  };
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
