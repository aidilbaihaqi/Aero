import { AnalyticsClient } from "./analytics-client";

// Define the API URL for SSR
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchInitialAnalytics() {
    try {
        const res = await fetch(`${API_URL}/api/stats/analytics`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch SSR analytics data:", error);
        return null;
    }
}

export default async function AnalyticsPage() {
    const historicalAnalytics = await fetchInitialAnalytics();

    return <AnalyticsClient initialData={historicalAnalytics} />;
}
