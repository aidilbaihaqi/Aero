import { RoutesClient } from "./routes-client";

// Define the API URL for SSR
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchInitialFares() {
    try {
        const res = await fetch(`${API_URL}/api/flights/history?limit=500`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch SSR routes data:", error);
        return [];
    }
}

export default async function RoutesPage() {
    const historicalFares = await fetchInitialFares();

    return <RoutesClient initialFares={historicalFares} />;
}
