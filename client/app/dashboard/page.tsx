import { DashboardClient } from "./dashboard-client";

// Define the API URL for SSR
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Server-side data fetching
async function fetchDashboardData() {
    try {
        const [statsRes, faresRes, chartRes] = await Promise.all([
            fetch(`${API_URL}/api/stats/dashboard`, { next: { revalidate: 60 } }),
            fetch(`${API_URL}/api/flights/history?limit=6`, { next: { revalidate: 60 } }),
            fetch(`${API_URL}/api/stats/chart`, { next: { revalidate: 60 } }),
        ]);

        const stats = statsRes.ok ? await statsRes.json() : null;
        const fares = faresRes.ok ? await faresRes.json() : [];
        const chartData = chartRes.ok ? await chartRes.json() : [];

        return { stats, fares, chartData };
    } catch (error) {
        console.error("Failed to fetch SSR dashboard data:", error);
        return { stats: null, fares: [], chartData: [] };
    }
}

export default async function DashboardPage() {
    // 1. Fetch initial data on the server
    const { stats, fares, chartData } = await fetchDashboardData();

    // 2. Pass initial data to the Client Component
    return (
        <DashboardClient
            initialStats={stats}
            initialFares={fares}
            initialChartData={chartData}
        />
    );
}
