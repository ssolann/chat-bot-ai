import { DocumentChunk } from "./vectorStore";
import { OllamaClient } from "./ollamaClient";
import { v4 as uuidv4 } from "uuid";
import { sampleDocument } from "../data/sampleDocument";

export class DocumentProcessor {
  private ollamaClient: OllamaClient;
  public documentMetadata: {
    title: string;
    description: string;
    type: string;
  } | null = null;

  constructor(ollamaClient: OllamaClient) {
    this.ollamaClient = ollamaClient;
  }

  async processText(
    text: string,
    source: string = "uploaded-document",
    metadata?: { title: string; description: string; type: string }
  ): Promise<DocumentChunk[]> {
    // Set document metadata if provided
    if (metadata) {
      this.documentMetadata = metadata;
    }

    // Simple chunking strategy: split by paragraphs and sentences
    const chunks = this.chunkText(text, 500, 50); // 500 chars per chunk, 50 char overlap

    return chunks.map((content, index) => {
      // Extract section header from chunk content
      const sectionHeader = this.extractSectionHeader(content);

      return {
        id: uuidv4(),
        content: content.trim(),
        metadata: {
          source,
          section: sectionHeader || `chunk-${index + 1}`,
          chunkIndex: index + 1,
        },
      };
    });
  }

  async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (const chunk of chunks) {
      try {
        const embedding = await this.ollamaClient.embedText(chunk.content);
        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
        });
      } catch (error) {
        console.error(
          `Failed to generate embedding for chunk ${chunk.id}:`,
          error
        );
        // Add chunk without embedding
        chunksWithEmbeddings.push(chunk);
      }
    }

    return chunksWithEmbeddings;
  }

  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      // If we're not at the end, try to break at a sentence or word boundary
      if (end < text.length) {
        // Look for sentence boundary
        const sentenceEnd = text.lastIndexOf(".", end);
        const questionEnd = text.lastIndexOf("?", end);
        const exclamationEnd = text.lastIndexOf("!", end);

        const sentenceBoundary = Math.max(
          sentenceEnd,
          questionEnd,
          exclamationEnd
        );

        if (sentenceBoundary > start + chunkSize * 0.5) {
          end = sentenceBoundary + 1;
        } else {
          // Fall back to word boundary
          const wordBoundary = text.lastIndexOf(" ", end);
          if (wordBoundary > start + chunkSize * 0.5) {
            end = wordBoundary;
          }
        }
      }

      const chunk = text.slice(start, end);
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }

      start = end - overlap;
    }

    return chunks;
  }

  // Extract section header from chunk content
  private extractSectionHeader(content: string): string | null {
    // Look for markdown headers (## Header)
    const headerMatch = content.match(/^##\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Look for section indicators
    const sectionPatterns = [
      /^([A-Z][A-Za-z\s]+Policy):/m,
      /^([A-Z][A-Za-z\s]+Package):/m,
      /^([A-Z][A-Za-z\s]+Process):/m,
      /^##\s*(.+)$/m,
      /^#\s*(.+)$/m,
    ];

    for (const pattern of sectionPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  // Helper method to process sample document
  async processSampleDocument(): Promise<DocumentChunk[]> {
    // Set document metadata for this sample
    this.documentMetadata = sampleDocument.metadata;

    return this.processText(
      sampleDocument.content.trim(),
      "company-policy-manual"
    );
  }

  // Get contextual response for out-of-scope questions
  getOutOfScopeResponse(): string {
    if (!this.documentMetadata) {
      return "I can only answer questions based on the loaded document. Please ask something related to the document content.";
    }

    return `I can only answer questions about the ${this.documentMetadata.title}. Please ask something related to ${this.documentMetadata.description}.`;
  }
}
