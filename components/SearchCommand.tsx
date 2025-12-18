"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Star,
  TrendingUp
} from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "./ui/button";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchCommand({ label = 'Add Stock', renderAs = 'button', initialStocks }: SearchCommandProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10); // Placeholder for actual stock data

  useEffect(() => {
    // Keyboard shortcut: Cmd/Ctrl + K to open search
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSearch = async () => {
    if(!isSearchMode) return setStocks(initialStocks);

    setLoading(true);

    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 500);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = (symbol?: string) => {
    if (symbol) {
      router.push(`/stocks/${symbol}`);
    }
    setOpen(false);
    setSearchTerm('');
    setStocks(initialStocks);
  }

  return (
    <>
    { renderAs === "text" ? ( 
      <span onClick={() => setOpen(true)} className="search-text">{label}</span> 
    ) : (
      <Button onClick={() => setOpen(true)} className="search-btn">{label}</Button>
    )
    }
      <Command>
        <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
          <div className="search-field">
            <CommandInput 
              placeholder="Search stocks..." 
              className="search-input"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            {loading && <Loader2 className="search-loader" />}
          </div>
          <CommandList className="search-list">
            {loading ? (
              <CommandEmpty className="search-list-empty">
                Loading Stocks...
              </CommandEmpty>
            ) : displayStocks?.length === 0 ? (
              <CommandEmpty>
                {isSearchMode ? 'No results found.' : 'No stocks available.' }
              </CommandEmpty>
            ) : (
              <CommandGroup>
                <div className="search-count px-2 py-1 text-sm text-muted-foreground">
                  {isSearchMode ? `Showing ${displayStocks.length} results` : `Showing top ${displayStocks.length} stocks`}
                  ({displayStocks.length || 0})
                </div>
                {displayStocks.map((stock) => (
                  <CommandItem 
                    key={stock.symbol}
                    value={`${stock.name} ${stock.symbol}`}
                    onSelect={() => handleSelectStock(stock.symbol)}
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {stock.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>
                    <Star />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => setOpen(false)}>
                Close Search <CommandShortcut> Esc </CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </Command>
    </>
  )
}