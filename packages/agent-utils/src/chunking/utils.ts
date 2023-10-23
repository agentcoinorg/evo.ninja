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