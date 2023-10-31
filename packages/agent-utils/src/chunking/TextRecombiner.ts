import { BaseDocumentMetadata, LocalDocument } from "../embeddings";
import { Tokenizer } from "../llm";
import { Recombiner } from "../rag/StandardRagBuilder";
import { LazyArray } from "../utils/LazyArray";

export class TextRecombiner {
  static surroundingTextWithPreview(
    surroundingCharacters: number,
    separator: string,
    tokenLimit: number,
    tokenizer: Tokenizer,
    overlap?: number
  ): Recombiner<string, string> {
    const halfSurroundChars = Math.floor(surroundingCharacters / 2);

    return async (
      results: () => Promise<AsyncGenerator<LocalDocument<{ index: number }>>>,
      originalItems: string[]
    ): Promise<string> => {
      const iterator = await results();

      let text = "";

      for await (const result of iterator) {
        const resultIndex = result.metadata()!.index;

        const textBehind = getTextFromPriorChunks({
          originalItems,
          currentIndex: resultIndex,
          overlap: overlap ?? 0,
          characterLimit: halfSurroundChars,
        });

        const textForward = getTextFromNextChunks({
          originalItems,
          currentIndex: resultIndex,
          overlap: overlap ?? 0,
          characterLimit: halfSurroundChars,
        });

        const surrounding = [textBehind, result.text(), textForward].join("");

        let newText = text;
        if (newText === "") {
          newText += surrounding;
        } else {
          newText += separator + surrounding;
        }

        const tokenCount = tokenizer.encode(newText).length;

        if (tokenCount > tokenLimit) {
          break;
        }

        text = newText;
      }

      return text;
    };
  }
}

export const getTextFromPriorChunks = (args: {
  originalItems: string[];
  currentIndex: number;
  overlap: number;
  characterLimit: number;
}) => {
  const { originalItems, currentIndex, overlap, characterLimit } = args;

  let textBehind = "";

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevResult = originalItems[i];

    if (!prevResult || textBehind.length > characterLimit) {
      return textBehind;
    }

    const prevResultText = overlap ? prevResult.slice(0, -overlap) : prevResult;

    if (prevResultText.length + textBehind.length <= characterLimit) {
      textBehind = prevResultText + textBehind;
    } else {
      const charactersLeft = characterLimit - textBehind.length;
      const prevResultPiece = prevResultText.slice(-charactersLeft);
      textBehind = prevResultPiece + textBehind;
    }
  }

  return textBehind;
};

export const getTextFromNextChunks = (args: {
  originalItems: string[];
  currentIndex: number;
  overlap: number;
  characterLimit: number;
}) => {
  const { originalItems, currentIndex, overlap, characterLimit } = args;

  let textForward = "";

  for (let i = currentIndex + 1; i <= originalItems.length; i++) {
    const nextResult = originalItems[i];

    if (!nextResult || textForward.length > characterLimit) {
      return textForward;
    }

    const nextResultText = overlap ? nextResult.slice(overlap) : nextResult;

    if (nextResultText.length + textForward.length <= characterLimit) {
      textForward = textForward + nextResultText;
    } else {
      const charactersLeft = characterLimit - textForward.length;
      const nextResultPiece = nextResultText.slice(-charactersLeft);
      textForward = textForward + nextResultPiece;
    }
  }

  return textForward;
};
