import { HistoryClient } from "./history-client";

// Define the API URL for SSR
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchInitialRuns() {
    try {
        const res = await fetch(`${API_URL}/api/flights/runs?limit=100`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch SSR runs data:", error);
        return [];
    }
}

export default async function HistoryPage() {
    const historicalRuns = await fetchInitialRuns();

    return <HistoryClient initialRuns={historicalRuns} />;
}
