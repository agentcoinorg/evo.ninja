import { CreateEmbeddingResponse, OpenAIApi } from "openai";

export class Vectorizer {
  constructor(private readonly config: { api: OpenAIApi }) { }

  private dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors are not of the same dimension.");
    }
    return a.reduce((sum, value, index) => sum + value * b[index], 0);
  }
  
  private magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  }
  
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors are not of the same dimension.");
    }
  
    const dot = this.dotProduct(a, b);
    return dot / (this.magnitude(a) * this.magnitude(b));
  }

  async createEmbedding(text: string): Promise<CreateEmbeddingResponse> {
    const result = await this.config.api.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text
    })
  
    if (result.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 15000))
      return await this.createEmbedding(text)
    }
  
    return result.data
  }
}