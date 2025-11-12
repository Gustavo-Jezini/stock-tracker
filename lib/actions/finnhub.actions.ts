"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";
import { cache } from "react";
import { POPULAR_STOCK_SYMBOLS } from "../constants";

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

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? '';
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as any).__exchange as string | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
