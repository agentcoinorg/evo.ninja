export const normalize = (vector: number[]) => {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
      sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

export const dotProduct = (arr1: number[], arr2: number[]) => {
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
      sum += arr1[i] * arr2[i];
  }
  return sum;
}

export const normalizedCosineSimilarity = (vector1: number[], norm1: number, vector2: number[], norm2: number) => {  
  return dotProduct(vector1, vector2) / (norm1 * norm2);
}

export const splitArray = (
  input: string[],
  maxLength: number,
  maxTokens: number,
  countTokens: (input: string) => number
): string[][] => {
  const result: string[][] = [];
  let currentSubArray: string[] = [];
  let currentTokens = 0;

  for (let str of input) {
    const strTokens = countTokens(str);

    // Check if adding this string would exceed maxLength or maxBytes
    if (currentSubArray.length + 1 > maxLength || currentTokens + strTokens > maxTokens) {
      // Start a new sub-array
      result.push(currentSubArray);
      currentSubArray = [str];
      currentTokens = strTokens;
    } else {
      // Add to the current sub-array
      currentSubArray.push(str);
      currentTokens += strTokens;
    }
  }

  // Add the last sub-array if it's not empty
  if (currentSubArray.length > 0) {
    result.push(currentSubArray);
  }

  return result;
};
