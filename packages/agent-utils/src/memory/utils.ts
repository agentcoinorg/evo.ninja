export const normalize = (vector: number[]) => {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
      sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

export const dotProduct = (arr1: number[], arr2: number[]) => {
  // Initialize a variable to store the sum of the products
  let sum = 0;
  // Loop through the elements of the arrays
  for (let i = 0; i < arr1.length; i++) {
      // Multiply the corresponding elements and add them to the sum
      sum += arr1[i] * arr2[i];
  }
  // Return the sum
  return sum;
}

export const normalizedCosineSimilarity = (vector1: number[], norm1: number, vector2: number[], norm2: number) => {
  return dotProduct(vector1, vector2) / (norm1 * norm2);
}