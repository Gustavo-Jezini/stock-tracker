"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

async function fetchJSON(url: string, revalidateSeconds?: number): Promise<any> {
  const options: RequestInit = revalidateSeconds 
    ? { 
        cache: 'force-cache' as RequestCache,
        next: { revalidate: revalidateSeconds }
      }
    : { cache: 'no-store' as RequestCache };

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    if (symbols && symbols.length > 0) {
      // Fetch company news for watchlist symbols
      const cleanSymbols = symbols
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      if (cleanSymbols.length === 0) {
        return getGeneralNews();
      }
      
      const allArticles: RawNewsArticle[] = [];
      const { from, to } = getDateRange(5);
      
      // Round-robin through symbols, max 6 rounds
      for (let round = 0; round < 6; round++) {
        const symbol = cleanSymbols[round % cleanSymbols.length];
        
        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
          const companyNews = await fetchJSON(url);
          
          if (Array.isArray(companyNews) && companyNews.length > 0) {
            // Find first valid article for this round
            const validArticle = companyNews.find(validateArticle);
            if (validArticle) {
              allArticles.push(validArticle);
            }
          }
        } catch (error) {
          console.error(`Error fetching news for ${symbol}:`, error);
          continue;
        }
      }
      
      if (allArticles.length === 0) {
        return getGeneralNews();
      }
      
      // Sort by datetime and format
      return allArticles
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
        .map((article, index) => formatArticle(article, true, cleanSymbols[index % cleanSymbols.length], index));
      
    } else {
      // Fetch general market news
      return getGeneralNews();
    }
  } catch (error) {
    console.error('Error in getNews:', error);
    throw new Error('Failed to fetch news');
  }
}

async function getGeneralNews(): Promise<MarketNewsArticle[]> {
  const { from, to } = getDateRange(5);
  const url = `${FINNHUB_BASE_URL}/news?category=general&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
  
  const generalNews = await fetchJSON(url);
  
  if (!Array.isArray(generalNews)) {
    return [];
  }
  
  // Deduplicate and validate
  const seenKeys = new Set<string>();
  const uniqueArticles: RawNewsArticle[] = [];
  
  for (const article of generalNews) {
    if (!validateArticle(article)) continue;
    
    const key = `${article.id}-${article.url}-${article.headline}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueArticles.push(article);
    }
  }
  
  // Take top 6 and format
  return uniqueArticles
    .slice(0, 6)
    .map((article, index) => formatArticle(article, false, undefined, index));
}
