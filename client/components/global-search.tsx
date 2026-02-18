import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { SearchResults } from '@/components/search-results';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function GlobalSearch() {
    const {
        query,
        setQuery,
        isOpen,
        setIsOpen,
        hasResults,
        grouped,
        selectedIndex,
        handleKeyDown,
        navigateToItem,
        inputRef
    } = useGlobalSearch();

    const showResults = query.trim().length > 0;

    return (
        <Popover open={isOpen && showResults} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Cari penerbangan, rute, maskapai..."
                        className="h-11 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-black/5 dark:bg-neutral-800"
                    />
                </div>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-[500px] p-0 shadow-xl"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="max-h-[400px] overflow-y-auto">
                    <SearchResults
                        grouped={grouped}
                        selectedIndex={selectedIndex}
                        onSelect={navigateToItem}
                        query={query}
                    />
                </div>

                {/* Footer hint */}
                {hasResults && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-2 flex items-center justify-between text-xs text-neutral-500">
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">↑↓</kbd>
                            <span>Navigate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">Enter</kbd>
                            <span>Select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">Esc</kbd>
                            <span>Close</span>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
