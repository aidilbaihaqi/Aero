import { SearchResultItem, GroupedResults } from '@/hooks/use-global-search';
import { cn } from '@/lib/utils';
import { Plane, LayoutGrid, Building2, FileText } from 'lucide-react';

interface SearchResultsProps {
    grouped: GroupedResults;
    selectedIndex: number;
    onSelect: (item: SearchResultItem) => void;
    query: string;
}

const getIcon = (type: string) => {
    switch (type) {
        case 'route':
            return Plane;
        case 'page':
            return LayoutGrid;
        case 'airline':
            return Building2;
        default:
            return FileText;
    }
};

const getCategoryLabel = (type: string) => {
    switch (type) {
        case 'route':
            return 'Rute Penerbangan';
        case 'page':
            return 'Halaman';
        case 'airline':
            return 'Maskapai';
        default:
            return 'Lainnya';
    }
};

export function SearchResults({ grouped, selectedIndex, onSelect, query }: SearchResultsProps) {
    let globalIndex = 0;

    if (Object.keys(grouped).length === 0) {
        return (
            <div className="p-6 text-center text-sm text-neutral-500">
                Tidak ada hasil untuk "{query}"
            </div>
        );
    }

    return (
        <div className="p-2 space-y-4">
            {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                    <h4 className="px-2 mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        {getCategoryLabel(type)}
                    </h4>
                    <div className="space-y-1">
                        {items.map((item) => {
                            const isSelected = globalIndex === selectedIndex;
                            const Icon = getIcon(item.type);
                            globalIndex++;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                                        isSelected
                                            ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg",
                                        isSelected ? "bg-white dark:bg-neutral-700 shadow-sm" : "bg-neutral-100 dark:bg-neutral-800"
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{item.title}</div>
                                        {item.subtitle && (
                                            <div className="text-xs text-neutral-500 opacity-80">{item.subtitle}</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
