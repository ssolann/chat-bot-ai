# 🤖 Intelligent Context Chatbot

A sophisticated AI-powered chatbot that provides intelligent responses based on your document context, with additional capabilities for real-time web search and stock market data.

## 🎯 Core Features

**This is primarily a context-aware chatbot** that understands and responds to questions about your specific documents. The sample implementation includes a Company Policy Manual covering remote work policies, benefits packages, and performance review processes. The chatbot can answer detailed questions about any content within these documents.

### Key Capabilities:
- **📄 Document-based Q&A**: Intelligent responses about your specific document content using vector similarity search
- **🔍 Web Search Integration**: Real-time web browsing using SerpAPI for up-to-date information
- **📊 Stock Market Data**: Live stock quotes and market data via Alpha Vantage API
- **🧠 Advanced AI**: Powered by local Ollama models for privacy and performance

## 🚀 Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Node.js
- **LLM**: Ollama (local) with deepseek-r1:14b or llama3.2:3b
- **Vector Store**: In-memory vector search with similarity matching
- **Embeddings**: @xenova/transformers for document processing
- **Web Search**: SerpAPI for real-time web browsing
- **Stock API**: Alpha Vantage for real-time market data

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js (v18+)
- Ollama installed locally
- SerpAPI key (free from [serpapi.com](https://serpapi.com/))
- Alpha Vantage API key (free from [alphavantage.co](https://www.alphavantage.co/support/#api-key))

### Installation

1. **Install Ollama & pull a model**

   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull deepseek-r1:14b
   # or for lighter model:
   # ollama pull llama3.2:3b
   ```

2. **Clone and Setup Backend**

   ```bash
   git clone <your-repo-url>
   cd chatbot/backend
   npm install

   # Create environment file
   cp .env.example .env
   # Add your Alpha Vantage API key to .env
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:14b

# Vector Store Configuration
VECTOR_STORE_TYPE=memory

# Alpha Vantage API Configuration
ALPHA_VANTAGE_API_KEY=your_api_key_here

# SerpAPI Configuration  
SERPAPI_KEY=your_serpapi_key_here
```

### Running the Application

1. **Start the Backend**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001

## 💡 Usage Examples

### Document Context Queries (Primary Feature)

The chatbot excels at answering questions about your document content:

- "What is our remote work policy?"
- "How many vacation days do employees get?"
- "What benefits are included in our package?"
- "When are performance reviews conducted?"
- "What is the 401k company match percentage?"
- "Can employees work from home full time?"

### Web Search Capabilities

- "What's the latest news about artificial intelligence?"
- "Current events in technology"
- "Recent developments in remote work policies"

### Stock Market Data

- "What's the current price of AMD?"
- "AAPL stock quote"
- "How much is Tesla trading at?"
- "IBM stock price"

## 🛠️ API Endpoints

### Chat Endpoints

- `POST /api/chat` - Send message to chatbot (handles document context, web search, and stock queries)
- `GET /health` - Health check

### Stock Data Endpoints

- `GET /api/stock/quote/:symbol` - Get real-time stock quote
- `GET /api/stock/intraday/:symbol` - Get intraday trading data
- `GET /api/stock/overview/:symbol` - Get company overview

### Example API Usage

```bash
# Get stock quote
curl "http://localhost:3001/api/stock/quote/AAPL"

# Chat with document context
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is our remote work policy?"}'

# Chat with stock query
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the price of AMD?"}'

# Chat with web search
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Latest AI news"}'
```

## � Document Context Features

The chatbot comes pre-loaded with a sample Company Policy Manual that includes:

- **Remote Work Policy**: Guidelines for working from home, approval processes, and communication requirements
- **Benefits Package**: Comprehensive information about health insurance, 401(k), vacation time, and professional development
- **Performance Review Process**: Annual review procedures, rating scales, and goal-setting processes

**You can easily replace this with your own documents** by updating the `sampleDocument.ts` file in the `backend/src/data/` directory.

## �📊 Supported Stock Symbols

The application supports all publicly traded stocks, including:

- **Technology**: AAPL, MSFT, GOOGL, TSLA, NVDA, AMD, META
- **Financial**: JPM, BAC, WFC, GS
- **Industrial**: IBM, GE, CAT, BA
- **And thousands more...**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│     Backend     │◄──►│    SerpAPI      │
│   (React/TS)    │    │   (Express/TS)  │    │  (Web Search)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ├──────────────┐
                                ▼              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │     Ollama      │    │ Alpha Vantage   │
                       │   (Local LLM)   │    │  (Stock Data)   │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │  Vector Store   │
                       │ (Document Context)│
                       │                 │
                       └─────────────────┘
```

### How It Works

1. **Document Processing**: Your documents are processed into chunks and converted to embeddings
2. **Vector Search**: User questions are matched against document content using similarity search
3. **Context Enrichment**: Relevant document chunks are provided as context to the LLM
4. **Multi-Modal Responses**: The chatbot can also search the web or fetch stock data when needed
5. **Intelligent Routing**: The system automatically determines whether to use document context, web search, or stock data based on the query

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Stock API Testing

```bash
cd backend
npx ts-node get-stock-price.ts AAPL  # Test stock API directly
```

## 📝 Project Structure

```
chatbot/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── types/      # TypeScript type definitions
│   │   └── lib/        # Utility functions
│   └── package.json
├── backend/            # Express backend application
│   ├── src/
│   │   ├── data/       # Sample documents and data
│   │   │   └── sampleDocument.ts  # Company policy manual
│   │   ├── services/   # Core business logic
│   │   │   ├── stockService.ts     # Alpha Vantage integration
│   │   │   ├── browsingAgent.ts    # SerpAPI web search
│   │   │   ├── ollamaClient.ts     # Local LLM client
│   │   │   ├── vectorStore.ts      # Document similarity search
│   │   │   └── documentProcessor.ts # Document chunking & embeddings
│   │   └── index.ts    # Main server file
│   └── package.json
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM capabilities
- [SerpAPI](https://serpapi.com/) for reliable web search functionality  
- [Alpha Vantage](https://www.alphavantage.co/) for stock market data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vite](https://vitejs.dev/) for fast development experience
- [@xenova/transformers](https://huggingface.co/docs/transformers.js/index) for client-side embeddings

## 🔄 Customization

To use this chatbot with your own documents:

1. Replace the content in `backend/src/data/sampleDocument.ts` with your own document data
2. Restart the backend server to process your new documents
3. The chatbot will now be able to answer questions about your specific content

The system supports various document types and can be extended to handle multiple documents, different embedding models, and additional data sources.

Backend runs on: http://localhost:3001
Frontend runs on: http://localhost:5173

## Project Structure

```
chatbot/
├── frontend/          # React frontend
├── backend/           # Express.js backend
├── documents/         # Sample documents
├── case_study.md      # Assignment requirements
├── dependencies.md    # Dependencies list
└── README.md          # This file
```
