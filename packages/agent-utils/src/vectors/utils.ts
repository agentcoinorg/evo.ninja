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

export const splitArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({length: Math.ceil(array.length / size)}, (_, index) => array.slice(index * size, index * size + size));
}