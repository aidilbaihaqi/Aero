import { useState, useRef, KeyboardEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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

const mockData: SearchResultItem[] = [
    // Pages
    { id: 'p1', type: 'page', title: 'Dashboard', url: '/dashboard' },
    { id: 'p2', type: 'page', title: 'Analisis', url: '/analytics' },
    { id: 'p3', type: 'page', title: 'Riwayat', url: '/history' },
    { id: 'p4', type: 'page', title: 'Ekspor Data', url: '/export' },
    { id: 'p5', type: 'page', title: 'Pengaturan', url: '/settings' },

    // Routes
    { id: 'r1', type: 'route', title: 'BTH - CGK', subtitle: 'Batam ke Jakarta', url: '/dashboard?route=BTH-CGK' },
    { id: 'r2', type: 'route', title: 'TNJ - CGK', subtitle: 'Tanjung Pinang ke Jakarta', url: '/dashboard?route=TNJ-CGK' },
    { id: 'r3', type: 'route', title: 'BTH - KNO', subtitle: 'Batam ke Medan', url: '/dashboard?route=BTH-KNO' },

    // Airlines
    { id: 'a1', type: 'airline', title: 'Garuda Indonesia', subtitle: 'Maskapai', url: '/analytics?airline=garuda' },
    { id: 'a2', type: 'airline', title: 'Lion Air', subtitle: 'Maskapai', url: '/analytics?airline=lion' },
    { id: 'a3', type: 'airline', title: 'Citilink', subtitle: 'Maskapai', url: '/analytics?airline=citilink' },
];

export function useGlobalSearch() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return mockData.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.subtitle?.toLowerCase().includes(lowerQuery)
        );
    }, [query]);

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
        inputRef
    };
}
