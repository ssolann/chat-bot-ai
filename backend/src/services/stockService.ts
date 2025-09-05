import axios from "axios";

export interface StockData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  timestamp: string;
}

export interface TimeSeriesData {
  [key: string]: {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  };
}

export class StockService {
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";

  constructor(apiKey: string = "demo") {
    this.apiKey = apiKey;
  }

  async getIntradayData(
    symbol: string,
    interval: string = "5min"
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${this.apiKey}`;

      const response = await axios.get(url, {
        headers: { "User-Agent": "axios" },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<any> {
    try {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;

      const response = await axios.get(url, {
        headers: { "User-Agent": "axios" },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching stock quote:", error);
      throw error;
    }
  }

  async getCompanyOverview(symbol: string): Promise<any> {
    try {
      const url = `${this.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`;

      const response = await axios.get(url, {
        headers: { "User-Agent": "axios" },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching company overview:", error);
      throw error;
    }
  }

  // Helper method to format stock data for display
  formatStockData(data: any): string {
    if (data["Global Quote"]) {
      const quote = data["Global Quote"];
      return `Symbol: ${quote["01. symbol"]}, Price: $${quote["05. price"]}, Change: ${quote["09. change"]} (${quote["10. change percent"]})`;
    }

    if (data["Time Series (5min)"]) {
      const timeSeries = data["Time Series (5min)"];
      const latestTime = Object.keys(timeSeries)[0];
      const latestData = timeSeries[latestTime];
      return `Latest data for ${data["Meta Data"]["2. Symbol"]}: Close: $${latestData["4. close"]}, Volume: ${latestData["5. volume"]} at ${latestTime}`;
    }

    return JSON.stringify(data, null, 2);
  }
}
