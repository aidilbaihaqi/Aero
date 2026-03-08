/**
 * export-excel.ts — Client-side export utilities for CSV and JSON formats.
 *
 * The hardcoded flightRoutes array has been removed.
 * Excel export is handled server-side via POST /api/flights/export.
 * CSV and JSON exports fetch data from the API.
 */

import api from "@/lib/axios";

export interface FlightRoute {
    origin: string;
    destination: string;
    airline: string;
    flightNumber: string;
    departTime: string;
    arriveTime: string;
}

export interface ExportOptions {
    startDate?: Date;
    endDate?: Date;
    selectedRoutes?: string[];
    selectedAirlines?: string[];
}

interface FlightFare {
    route: string;
    airline: string;
    flight_number: string;
    travel_date: string;
    depart_time: string;
    arrive_time: string;
    basic_fare: number;
    status_scrape: string;
}

/**
 * Fetch flight history data from API with optional filters.
 */
async function fetchExportData(options: ExportOptions): Promise<FlightFare[]> {
    const params: Record<string, string> = { limit: "10000" };

    if (options.startDate) {
        params.start_date = options.startDate.toISOString().split("T")[0];
    }
    if (options.endDate) {
        params.end_date = options.endDate.toISOString().split("T")[0];
    }

    const res = await api.get("/api/flights/history", { params });
    let data: FlightFare[] = res.data;

    // Client-side filter by selected routes and airlines
    if (options.selectedRoutes && options.selectedRoutes.length > 0) {
        data = data.filter((f) => options.selectedRoutes!.includes(f.route));
    }
    if (options.selectedAirlines && options.selectedAirlines.length > 0) {
        data = data.filter((f) => options.selectedAirlines!.includes(f.airline));
    }

    return data;
}

/**
 * Export to Excel (.xlsx) — server-side via API.
 * This function triggers a download from the backend.
 */
export async function exportToExcel(options: ExportOptions): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (options.startDate) payload.start_date = options.startDate.toISOString().split("T")[0];
    if (options.endDate) payload.end_date = options.endDate.toISOString().split("T")[0];
    if (options.selectedRoutes && options.selectedRoutes.length > 0) payload.routes = options.selectedRoutes;
    if (options.selectedAirlines && options.selectedAirlines.length > 0) payload.airlines = options.selectedAirlines;

    const res = await api.post("/api/flights/export", payload, {
        responseType: "blob",
    });

    const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AeroPrice_export.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export to CSV.
 * Fetches real data from the API and converts to CSV format.
 */
export async function exportToCSV(options: ExportOptions): Promise<void> {
    const data = await fetchExportData(options);

    if (data.length === 0) {
        throw new Error("Tidak ada data untuk diekspor.");
    }

    const headers = ["Route", "Airline", "Flight Number", "Travel Date", "Depart Time", "Arrive Time", "Basic Fare (IDR)", "Status"];
    const rows = data.map((f) => [
        f.route,
        f.airline,
        f.flight_number,
        f.travel_date,
        f.depart_time,
        f.arrive_time,
        f.basic_fare.toString(),
        f.status_scrape,
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AeroPrice_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export to JSON.
 * Fetches real data from the API and exports as JSON.
 */
export async function exportToJSON(options: ExportOptions): Promise<void> {
    const data = await fetchExportData(options);

    if (data.length === 0) {
        throw new Error("Tidak ada data untuk diekspor.");
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AeroPrice_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
