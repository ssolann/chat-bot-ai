# 🤖 Chatbot with Real-Time Data

Full-stack chatbot application

## 🚀 Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Node.js
- **LLM**: Ollama (local) with deepseek-r1:14b or llama3.2:3b
- **Vector Store**: In-memory vector search with similarity matching
- **Embeddings**: @xenova/transformers for document processing
- **Stock API**: Alpha Vantage for real-time market data

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js (v18+)
- Ollama installed locally
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

### Stock Price Queries

- "What's the current price of AMD?"
- "AAPL stock quote"
- "How much is Tesla trading at?"
- "IBM stock price"

### Investment Education

- "What is value investing?"
- "Explain technical analysis"
- "How do I manage investment risk?"
- "What are P/E ratios?"

## 🛠️ API Endpoints

### Chat Endpoints

- `POST /api/chat` - Send message to chatbot
- `GET /health` - Health check

### Stock Data Endpoints

- `GET /api/stock/quote/:symbol` - Get real-time stock quote
- `GET /api/stock/intraday/:symbol` - Get intraday trading data
- `GET /api/stock/overview/:symbol` - Get company overview

### Example API Usage

```bash
# Get stock quote
curl "http://localhost:3001/api/stock/quote/AAPL"

# Chat with the bot
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the price of AMD?"}'
```

## 📊 Supported Stock Symbols

The application supports all publicly traded stocks, including:

- **Technology**: AAPL, MSFT, GOOGL, TSLA, NVDA, AMD, META
- **Financial**: JPM, BAC, WFC, GS
- **Industrial**: IBM, GE, CAT, BA
- **And thousands more...**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│     Backend     │◄──►│   Alpha Vantage │
│   (React/TS)    │    │   (Express/TS)  │    │       API       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │     Ollama      │
                       │   (Local LLM)   │
                       │                 │
                       └─────────────────┘
```

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
│   │   ├── services/   # Core business logic
│   │   │   ├── stockService.ts
│   │   │   ├── ollamaClient.ts
│   │   │   ├── vectorStore.ts
│   │   │   └── documentProcessor.ts
│   │   └── index.ts    # Main server file
│   └── package.json
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM capabilities
- [Alpha Vantage](https://www.alphavantage.co/) for stock market data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vite](https://vitejs.dev/) for fast development experience

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
