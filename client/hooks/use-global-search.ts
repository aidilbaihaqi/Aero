import { useState, useRef, KeyboardEvent, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import api from '@/lib/axios';

export interface SearchResultItem {
    id: string;
    type: 'route' | 'airline' | 'flight' | 'page';
    title: string;
    subtitle?: string;
    url: string;
}

export interface GroupedResults {
    [key: string]: SearchResultItem[];
}

const staticPages: SearchResultItem[] = [
    { id: 'p1', type: 'page', title: 'Dashboard', url: '/dashboard' },
    { id: 'p2', type: 'page', title: 'Analisis', url: '/analytics' },
    { id: 'p3', type: 'page', title: 'Riwayat', url: '/history' },
    { id: 'p4', type: 'page', title: 'Ekspor Data', url: '/export' },
    { id: 'p5', type: 'page', title: 'Pengaturan', url: '/settings' },
];

export function useGlobalSearch() {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [apiResults, setApiResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setApiResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/stats/search', {
                    params: { q: debouncedQuery }
                });
                setApiResults(res.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const results = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const filteredPages = staticPages.filter(item =>
            item.title.toLowerCase().includes(lowerQuery)
        );

        return [...filteredPages, ...apiResults];
    }, [query, apiResults]);

    const hasResults = results.length > 0;

    const grouped = useMemo(() => {
        const groups: GroupedResults = {};
        results.forEach(item => {
            if (!groups[item.type]) {
                groups[item.type] = [];
            }
            groups[item.type].push(item);
        });
        return groups;
    }, [results]);

    const navigateToItem = (item: SearchResultItem) => {
        setIsOpen(false);
        setQuery('');
        router.push(item.url);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (hasResults) {
                navigateToItem(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return {
        query,
        setQuery,
        isOpen,
        setIsOpen,
        hasResults,
        grouped,
        selectedIndex,
        handleKeyDown,
        navigateToItem,
        inputRef,
        loading
    };
}
