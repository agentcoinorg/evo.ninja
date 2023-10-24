import { BaseDocumentMetadata, LocalDocument } from "../embeddings";
import { LazyArray } from "../utils/LazyArray";
import { sortDocumentsByIndex } from "./utils";

export class TextRecombiner {
  static surroundingText(
    surroundingCharacters: number, 
    overlap?: number, 
    limit?: number
  ): <TMetadata extends BaseDocumentMetadata>(results: LazyArray<{item: string, doc: LocalDocument<TMetadata> }>, originalItems: string[]) => LazyArray<string> {
    const halfSurroundChars = Math.floor(surroundingCharacters / 2);
    
    return <TMetadata extends BaseDocumentMetadata>(results: LazyArray<{item: string, doc: LocalDocument<TMetadata> }>, originalItems: string[]): LazyArray<string> => {
      const promise = results.then(results => {
        const docs = results.map(x => x.doc);
        const resultsSortedByIndex = sortDocumentsByIndex(docs);
  
        const surroundedResults = docs.map(result => {
          const resultIndex = result.metadata()!.index;
    
          const textBehind = getTextFromPriorChunks({
            sortedElements: resultsSortedByIndex,
            currentIndex: resultIndex,
            overlap: overlap ?? 0,
            characterLimit: halfSurroundChars
          })
    
          const textForward = getTextFromNextChunks({
            sortedElements: resultsSortedByIndex,
            currentIndex: resultIndex,
            overlap: overlap ?? 0,
            characterLimit: halfSurroundChars
          })
    
          const withSurrounding = [textBehind, result.text(), textForward].join("")
    
          return {
            match: result,
            withSurrounding
          };
        })
    
        return limit 
          ? surroundedResults.slice(0, limit).map(x => x.withSurrounding) 
          : surroundedResults.map(x => x.withSurrounding);
      });
  
      return new LazyArray(promise);
    };
  }
}

export const getTextFromPriorChunks = (args: { sortedElements: { text: () => string }[], currentIndex: number, overlap: number, characterLimit: number}) => {
  const { sortedElements, currentIndex, overlap, characterLimit } = args
  
  let textBehind = ""

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevResult = sortedElements[i]

    if (!prevResult || textBehind.length > characterLimit) {
      return textBehind
    }

    const prevResultText = overlap ? prevResult.text().slice(0, -overlap) : prevResult.text()

    if (prevResultText.length + textBehind.length <= characterLimit) {
      textBehind = prevResultText + textBehind
    } else {
      const charactersLeft = characterLimit - textBehind.length
      const prevResultPiece = prevResultText.slice(-charactersLeft)
      textBehind = prevResultPiece + textBehind
    }
  }

  return textBehind
}

export const getTextFromNextChunks = (args: { sortedElements: { text: () => string }[], currentIndex: number, overlap: number, characterLimit: number}) => {
  const { sortedElements, currentIndex, overlap, characterLimit } = args
  
  let textForward = ""

  for (let i = currentIndex + 1; i <= sortedElements.length; i++) {
    const nextResult = sortedElements[i]

    if (!nextResult || textForward.length > characterLimit) {
      return textForward
    }

    const nextResultText = overlap ? nextResult.text().slice(overlap) : nextResult.text()

    if (nextResultText.length + textForward.length <= characterLimit) {
      textForward = textForward + nextResultText
    } else {
      const charactersLeft = characterLimit - textForward.length
      const nextResultPiece = nextResultText.slice(-charactersLeft)
      textForward = textForward + nextResultPiece
    }
  }

  return textForward;
}
