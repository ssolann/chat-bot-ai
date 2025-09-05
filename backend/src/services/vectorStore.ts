export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    section?: string;
    chunkIndex?: number;
  };
  embedding?: number[];
}

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    this.chunks.push(...chunks);
  }

  async similaritySearch(
    queryEmbedding: number[],
    topK: number = 3
  ): Promise<{ chunk: DocumentChunk; similarity: number }[]> {
    if (this.chunks.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each chunk
    const similarities = this.chunks
      .filter((chunk) => chunk.embedding)
      .map((chunk) => ({
        chunk,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return similarities;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async getChunks(): Promise<DocumentChunk[]> {
    return [...this.chunks];
  }

  async clear(): Promise<void> {
    this.chunks = [];
  }

  getChunkCount(): number {
    return this.chunks.length;
  }
}
