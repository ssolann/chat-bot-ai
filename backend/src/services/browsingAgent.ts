import axios from "axios";
import * as cheerio from "cheerio";

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export interface BrowsingResult {
  success: boolean;
  results: WebSearchResult[];
  query: string;
  timestamp: string;
  error?: string;
}

export class BrowsingAgent {
  private serpApiKey: string;
  private baseUrl = "https://serpapi.com/search.json";
  private cache: Map<string, BrowsingResult> = new Map();
  private cacheExpiry = 1000 * 60 * 30; // 30 minutes

  constructor(apiKey: string) {
    this.serpApiKey = apiKey;
  }

  /**
   * Search the web for relevant information
   */
  async searchWeb(
    query: string,
    maxResults: number = 5
  ): Promise<BrowsingResult> {
    // Check cache first
    const cacheKey = `${query}_${maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (
      cached &&
      Date.now() - new Date(cached.timestamp).getTime() < this.cacheExpiry
    ) {
      console.log(`Using cached web search results for: ${query}`);
      return cached;
    }

    try {
      console.log(`Searching web for: ${query}`);

      const params = {
        engine: "google",
        q: query,
        api_key: this.serpApiKey,
        num: maxResults,
        hl: "en",
        gl: "us",
      };

      const response = await axios.get(this.baseUrl, { params });
      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      const results: WebSearchResult[] = [];

      // Process organic results
      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, maxResults)) {
          results.push({
            title: result.title || "No title",
            link: result.link || "",
            snippet: result.snippet || "No snippet available",
            source: this.extractDomain(result.link || ""),
          });
        }
      }

      // Also check answer box/featured snippet
      if (data.answer_box && data.answer_box.answer) {
        results.unshift({
          title: "Featured Answer",
          link: data.answer_box.link || "",
          snippet: data.answer_box.answer,
          source: this.extractDomain(data.answer_box.link || ""),
        });
      }

      const browsingResult: BrowsingResult = {
        success: true,
        results,
        query,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      this.cache.set(cacheKey, browsingResult);

      console.log(`Found ${results.length} web results for: ${query}`);
      return browsingResult;
    } catch (error) {
      console.error("Web search error:", error);

      const errorResult: BrowsingResult = {
        success: false,
        results: [],
        query,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during web search",
      };

      return errorResult;
    }
  }

  /**
   * Enhance web results by fetching and parsing content from top results
   */
  async enhanceResults(
    results: WebSearchResult[],
    maxEnhanced: number = 2
  ): Promise<WebSearchResult[]> {
    const enhanced: WebSearchResult[] = [];

    for (let i = 0; i < Math.min(results.length, maxEnhanced); i++) {
      const result = results[i];
      try {
        const enhancedSnippet = await this.extractContentFromUrl(result.link);
        enhanced.push({
          ...result,
          snippet: enhancedSnippet || result.snippet,
        });
      } catch (error) {
        console.warn(`Failed to enhance result from ${result.link}:`, error);
        enhanced.push(result);
      }
    }

    // Add remaining results without enhancement
    enhanced.push(...results.slice(maxEnhanced));
    return enhanced;
  }

  /**
   * Extract text content from a webpage
   */
  private async extractContentFromUrl(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $("script, style, nav, header, footer, .advertisement, .ads").remove();

      // Try to find main content areas
      let content = "";
      const contentSelectors = [
        "main",
        "article",
        ".content",
        ".main-content",
        "#content",
        ".post-content",
        ".entry-content",
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      // Fallback to body text if no specific content area found
      if (!content) {
        content = $("body").text().trim();
      }

      // Clean up the text
      content = content.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();

      // Return first 500 characters
      return content.length > 500 ? content.substring(0, 500) + "..." : content;
    } catch (error) {
      console.warn(`Failed to extract content from ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return "Unknown source";
    }
  }

  /**
   * Combine web results into a coherent context for the LLM
   */
  formatResultsForLLM(results: WebSearchResult[]): string {
    if (results.length === 0) {
      return "";
    }

    let formattedContext = "WEB SEARCH RESULTS:\n\n";

    results.forEach((result, index) => {
      formattedContext += `${index + 1}. **${result.title}** (${
        result.source
      })\n`;
      formattedContext += `   ${result.snippet}\n`;
      formattedContext += `   Source: ${result.link}\n\n`;
    });

    return formattedContext;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
