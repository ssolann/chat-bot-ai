import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OllamaClient } from "./services/ollamaClient";
import { VectorStore } from "./services/vectorStore";
import { DocumentProcessor } from "./services/documentProcessor";
import { StockService } from "./services/stockService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const ollamaClient = new OllamaClient(
  process.env.OLLAMA_HOST || "http://localhost:11434",
  process.env.OLLAMA_MODEL || "deepseek-r1:14b"
);
const vectorStore = new VectorStore();
const documentProcessor = new DocumentProcessor(ollamaClient);
const stockService = new StockService(
  process.env.ALPHA_VANTAGE_API_KEY || "demo"
);

// Initialize with sample document
let isInitialized = false;

async function initializeVectorStore() {
  if (isInitialized) return;

  try {
    console.log("Initializing vector store with sample document...");
    const chunks = await documentProcessor.processSampleDocument();
    const chunksWithEmbeddings = await documentProcessor.generateEmbeddings(
      chunks
    );
    await vectorStore.addDocuments(chunksWithEmbeddings);
    isInitialized = true;
    console.log(`Initialized with ${chunks.length} document chunks`);
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "Document-Based Chatbot API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      test: "/api/test",
      status: "/api/status",
      chat: "POST /api/chat",
      upload: "POST /api/upload",
      stockQuote: "GET /api/stock/quote/:symbol",
      stockIntraday: "GET /api/stock/intraday/:symbol",
      stockOverview: "GET /api/stock/overview/:symbol",
    },
    frontend: "http://localhost:5174",
    docs: "API server - use endpoints above",
  });
});

// Basic health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Chatbot backend is running" });
});

// Chat endpoint - now with RAG implementation and conversation memory
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Ensure vector store is initialized
    await initializeVectorStore();

    // Check if the message is asking for stock price information
    const stockPriceRegex =
      /(?:price|quote|cost|value|trading|current|stock)\s+(?:of\s+)?([A-Z]{2,5})|([A-Z]{2,5})\s+(?:price|quote|stock|shares?)/i;

    const messageText = message.toLowerCase();
    const isStockQuery =
      messageText.includes("stock price") ||
      messageText.includes("current price") ||
      messageText.includes("quote") ||
      messageText.includes("trading at") ||
      (messageText.includes("price") &&
        (messageText.includes("amd") ||
          messageText.includes("aapl") ||
          messageText.includes("tsla") ||
          messageText.includes("ibm") ||
          messageText.includes("nvda") ||
          messageText.includes("msft")));

    if (isStockQuery) {
      try {
        // Extract potential stock symbols from the message
        const matches = message.match(stockPriceRegex);
        let stockSymbol = null;

        if (matches) {
          stockSymbol = matches[1] || matches[2];
        } else {
          // Try to find common stock symbols in the message
          const commonStocks = [
            "AMD",
            "AAPL",
            "TSLA",
            "IBM",
            "NVDA",
            "MSFT",
            "GOOGL",
            "META",
            "AMZN",
          ];
          const messageUpper = message.toUpperCase();
          for (const stock of commonStocks) {
            if (messageUpper.includes(stock)) {
              stockSymbol = stock;
              break;
            }
          }
        }

        if (stockSymbol) {
          console.log(`Stock query detected for symbol: ${stockSymbol}`);

          const stockQuote = await stockService.getQuote(stockSymbol);
          console.log(
            "Raw stock quote response:",
            JSON.stringify(stockQuote, null, 2)
          );

          // Check for rate limiting or other API errors
          if (stockQuote["Note"]) {
            return res.json({
              response: `📊 **API Rate Limit Reached**

The Alpha Vantage API has a rate limit of 25 requests per day for free accounts. It looks like we've reached this limit.

${stockQuote["Note"]}

Please try again later, or I can help you with general stock market information and investment strategies from our knowledge base in the meantime!`,
              sources: [],
              timestamp: new Date().toISOString(),
              stockData: true,
              symbol: stockSymbol,
              rateLimited: true,
            });
          }

          if (stockQuote["Global Quote"]) {
            const data = stockQuote["Global Quote"];
            console.log("Global Quote data:", JSON.stringify(data, null, 2));

            const stockResponse = `📈 **${
              data["01. symbol"]
            } Stock Information**

**Current Price:** $${data["05. price"]}
**Change:** ${data["09. change"]} (${data["10. change percent"]})
**Previous Close:** $${data["08. previous close"]}
**Day Range:** $${data["04. low"]} - $${data["03. high"]}
**Volume:** ${parseInt(data["06. volume"]).toLocaleString()}
**Latest Trading Day:** ${data["07. latest trading day"]}

💡 *This is real-time stock data from Alpha Vantage API*`;

            return res.json({
              response: stockResponse,
              sources: [],
              timestamp: new Date().toISOString(),
              stockData: true,
              symbol: stockSymbol,
            });
          } else if (stockQuote["Information"]) {
            // Handle API limitations
            return res.json({
              response: `📊 I found your request for ${stockSymbol} stock information. However, the demo API key has limitations. ${stockQuote["Information"]}

In the meantime, I can help you with general stock market information and investment strategies from our knowledge base.`,
              sources: [],
              timestamp: new Date().toISOString(),
              stockData: true,
              symbol: stockSymbol,
              apiLimited: true,
            });
          }
        } else {
          // If no specific symbol found, provide general stock information
          return res.json({
            response: `📊 I detected you're asking about stock prices. Please specify a stock symbol (like AMD, AAPL, TSLA, IBM, etc.) and I can get you the current price information.

For example, you can ask:
- "What's the current price of AMD?"
- "AAPL stock quote"
- "How much is Tesla trading at?"

I can also help you with general stock market information and investment strategies!`,
            sources: [],
            timestamp: new Date().toISOString(),
            stockData: true,
          });
        }
      } catch (error) {
        console.error("Stock API error:", error);
        // Fall through to normal document search if stock API fails
      }
    }

    // Check Ollama health
    const isOllamaHealthy = await ollamaClient.checkHealth();
    if (!isOllamaHealthy) {
      // Fallback mode: return a mock response with document chunks
      const mockChunks = await vectorStore.getChunks();
      const relevantChunks = mockChunks.slice(0, 2); // Just take first 2 chunks as mock relevant results

      // Check if this looks like a follow-up question
      const isFollowUp =
        conversationHistory.length > 0 &&
        (message.toLowerCase().includes("tell me more") ||
          message.toLowerCase().includes("what about") ||
          message.toLowerCase().includes("that") ||
          message.toLowerCase().includes("it") ||
          message.toLowerCase().includes("this"));

      let responseText = `[DEMO MODE - Ollama not available] `;

      if (isFollowUp && conversationHistory.length > 0) {
        const lastAssistantMessage = conversationHistory
          .slice()
          .reverse()
          .find((msg: any) => msg.role === "assistant");

        responseText += `I understand you're asking a follow-up question about our previous discussion. `;
        if (lastAssistantMessage) {
          responseText += `Earlier we discussed: "${lastAssistantMessage.content.substring(
            0,
            100
          )}..." `;
        }
      }

      responseText += `Based on the company policy document, here's what I found related to "${message}": ${relevantChunks
        .map((chunk) => chunk.content.substring(0, 150))
        .join(" ... ")}`;

      return res.json({
        response: responseText,
        sources: relevantChunks.map((chunk) => ({
          id: chunk.id,
          content: chunk.content.substring(0, 200) + "...",
          source: chunk.metadata.source,
          section: chunk.metadata.section,
        })),
        timestamp: new Date().toISOString(),
        chunksFound: relevantChunks.length,
        demoMode: true,
        note: "Install and run Ollama for full AI functionality",
      });
    }

    // Get query embedding for similarity search
    const queryEmbedding = await ollamaClient.embedText(message);

    // Find relevant document chunks with similarity scores
    const relevantChunksWithScores = await vectorStore.similaritySearch(
      queryEmbedding,
      4
    );

    // Check if the best match has low similarity (threshold: 0.1)
    const bestSimilarity = relevantChunksWithScores[0]?.similarity || 0;
    const RELEVANCE_THRESHOLD = 0.1;

    console.log(
      `Query: "${message}" - Best similarity: ${bestSimilarity.toFixed(3)}`
    );
    console.log(
      "Top 3 chunks found:",
      relevantChunksWithScores.map(
        (item) =>
          `[${item.similarity.toFixed(3)}] ${item.chunk.content.substring(
            0,
            100
          )}...`
      )
    );

    if (bestSimilarity < RELEVANCE_THRESHOLD) {
      // Question is likely outside document scope - provide direct response
      const outOfScopeResponse = documentProcessor.getOutOfScopeResponse();
      return res.json({
        response: outOfScopeResponse,
        sources: [],
        timestamp: new Date().toISOString(),
        chunksFound: 0,
        lowRelevance: true,
        bestSimilarity: bestSimilarity.toFixed(3),
      });
    }

    // Extract chunks from results
    const relevantChunks = relevantChunksWithScores.map((item) => item.chunk);

    // Build context from relevant chunks
    const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

    // Generate response using Ollama with context and conversation history
    const outOfScopeMessage = documentProcessor.getOutOfScopeResponse();

    // Convert conversation history to the expected format
    const formattedHistory = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await ollamaClient.generateConversationResponse(
      message,
      context,
      formattedHistory,
      outOfScopeMessage
    );

    res.json({
      response,
      conversationContext: conversationHistory.length > 0,
      sources: relevantChunksWithScores.map((item, index) => {
        const chunk = item.chunk;
        const similarity = item.similarity;

        // Extract a more meaningful snippet
        let snippet = chunk.content;

        // Try to find the most relevant sentence that contains key terms from the query
        const queryWords = message
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3);
        const sentences = chunk.content
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 10);

        // Find sentence with most query word matches
        let bestSentence = sentences[0] || chunk.content.substring(0, 150);
        let maxMatches = 0;

        for (const sentence of sentences) {
          const sentenceLower = sentence.toLowerCase();
          const matches = queryWords.filter((word: string) =>
            sentenceLower.includes(word)
          ).length;
          if (matches > maxMatches) {
            maxMatches = matches;
            bestSentence = sentence;
          }
        }

        // If no good sentence match, try to find a meaningful excerpt
        if (maxMatches === 0) {
          // Look for lines with important information (bullets, dashes, etc.)
          const lines = chunk.content
            .split("\n")
            .filter((line) => line.trim().length > 10);
          const meaningfulLine = lines.find(
            (line) =>
              line.includes("-") ||
              line.includes("•") ||
              line.includes(":") ||
              /\d+/.test(line) ||
              line.toLowerCase().includes("employee")
          );

          if (meaningfulLine) {
            snippet = meaningfulLine.trim();
          } else {
            snippet = bestSentence.trim();
          }
        } else {
          snippet = bestSentence.trim();
        }

        // Ensure snippet isn't too long
        if (snippet.length > 200) {
          snippet = snippet.substring(0, 200) + "...";
        }

        return {
          id: chunk.id,
          title:
            chunk.metadata.section ||
            `Section ${chunk.metadata.chunkIndex || index + 1}`,
          snippet: snippet,
          content:
            chunk.content.substring(0, 300) +
            (chunk.content.length > 300 ? "..." : ""),
          source: chunk.metadata.source,
          section: chunk.metadata.section,
          confidence: (similarity * 100).toFixed(1) + "%",
          chunkIndex: chunk.metadata.chunkIndex || index + 1,
        };
      }),
      timestamp: new Date().toISOString(),
      chunksFound: relevantChunks.length,
    });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({
      error: "Failed to process chat message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test endpoints
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Enhanced status endpoint with Ollama health check
app.get("/api/status", async (req, res) => {
  try {
    const ollamaHealthy = await ollamaClient.checkHealth();
    const models = await ollamaClient.listModels();

    res.json({
      status: "running",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
      ollama: {
        healthy: ollamaHealthy,
        models: models,
        baseUrl: process.env.OLLAMA_HOST || "http://localhost:11434",
        currentModel: process.env.OLLAMA_MODEL || "deepseek-r1:14b",
      },
      vectorStore: {
        initialized: isInitialized,
        chunkCount: vectorStore.getChunkCount(),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Vector store info endpoint
app.get("/api/documents", async (req, res) => {
  try {
    await initializeVectorStore();
    const chunks = await vectorStore.getChunks();

    res.json({
      totalChunks: chunks.length,
      chunks: chunks.map((chunk) => ({
        id: chunk.id,
        preview: chunk.content.substring(0, 100) + "...",
        source: chunk.metadata.source,
        section: chunk.metadata.section,
        hasEmbedding: !!chunk.embedding,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get document chunks",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Document upload endpoint (placeholder)
app.post("/api/upload", (req, res) => {
  // TODO: Implement document processing and vector storage
  res.json({
    message: "Document upload endpoint - coming soon",
    filename: "placeholder.pdf",
  });
});

// Stock API endpoints
app.get("/api/stock/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }

    const data = await stockService.getQuote(symbol.toUpperCase());

    res.json({
      symbol: symbol.toUpperCase(),
      data,
      formatted: stockService.formatStockData(data),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock quote error:", error);
    res.status(500).json({
      error: "Failed to fetch stock quote",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/stock/intraday/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = "5min" } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }

    const data = await stockService.getIntradayData(
      symbol.toUpperCase(),
      interval as string
    );

    res.json({
      symbol: symbol.toUpperCase(),
      interval,
      data,
      formatted: stockService.formatStockData(data),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock intraday error:", error);
    res.status(500).json({
      error: "Failed to fetch intraday stock data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/stock/overview/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }

    const data = await stockService.getCompanyOverview(symbol.toUpperCase());

    res.json({
      symbol: symbol.toUpperCase(),
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Company overview error:", error);
    res.status(500).json({
      error: "Failed to fetch company overview",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Initializing services...");

  // Initialize vector store on startup
  await initializeVectorStore();

  // Check Ollama connection
  try {
    const healthy = await ollamaClient.checkHealth();
    if (healthy) {
      console.log("✅ Ollama connection successful");
      const models = await ollamaClient.listModels();
      console.log(`📋 Available models: ${models.join(", ")}`);
    } else {
      console.log(
        "⚠️  Ollama not available - make sure it's running on http://localhost:11434"
      );
    }
  } catch (error) {
    console.log("❌ Failed to connect to Ollama:", error);
  }
});

export default app;
