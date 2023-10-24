import { BaseDocumentMetadata, LocalDocument } from "../embeddings"

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

  return textForward
}

export const sortDocumentsByIndex = <TMetadata extends BaseDocumentMetadata>(documents: LocalDocument<TMetadata>[]): LocalDocument<TMetadata>[] => {
  return documents.slice().sort(
    (a, b) => {
      if (a.metadata().index === undefined) {
        throw new Error(`Found document with id '${a.id}' but no index`)
      }

      if (!b.metadata().index === undefined) {
        throw new Error(`Found document with id '${b.id}' but no index`)
      }

      return a.metadata().index - b.metadata().index
    }
  );
};
