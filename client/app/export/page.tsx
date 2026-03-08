"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
    CardSolid,
    CardSolidContent,
} from "@/components/ui/card-solid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, FileJson, FileText, Calendar, Filter, Loader2, Check } from "lucide-react";
import { exportToCSV, exportToJSON } from "@/lib/export-excel";
import { toast } from "sonner";
import api from "@/lib/axios";

interface AvailableFilters {
    routes: string[];
    airlines: string[];
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

// City name lookup for Indonesian routes
const CITY_NAMES: Record<string, string> = {
    BTH: "Batam", CGK: "Jakarta", SUB: "Surabaya", KNO: "Medan",
    DPS: "Bali", UPG: "Makassar", JOG: "Yogyakarta", BDO: "Bandung",
    SOC: "Solo", SRG: "Semarang", PDG: "Padang", PKU: "Pekanbaru",
    BPN: "Balikpapan", PLM: "Palembang", PNK: "Pontianak", MDC: "Manado",
    BDJ: "Banjarmasin", AMQ: "Ambon", DJB: "Jambi", TKG: "Lampung",
    TNJ: "Tanjung Pinang", KDI: "Kendari", LOP: "Lombok", HLP: "Jakarta (Halim)",
    YIA: "Yogyakarta (YIA)", SOQ: "Sorong", DJJ: "Jayapura", TRK: "Tarakan",
    GTO: "Gorontalo", BKS: "Bengkulu",
};

function formatRoute(route: string): string {
    const [origin, dest] = route.split("-");
    const originCity = CITY_NAMES[origin] || origin;
    const destCity = CITY_NAMES[dest] || dest;
    return `${origin} - ${dest} (${originCity} → ${destCity})`;
}

export default function Export() {
    const [isExporting, setIsExporting] = useState(false);
    const [startDate, setStartDate] = useState("2026-02-01");
    const [endDate, setEndDate] = useState("2026-02-28");
    const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

    // Fetch available filters from backend
    const { data: filters } = useSWR<AvailableFilters>(
        "/api/flights/available-filters",
        fetcher
    );

    const allRoutes = filters?.routes || [];
    const allAirlines = filters?.airlines || [];

    // Toggle helpers
    const toggleRoute = (route: string) => {
        setSelectedRoutes((prev) =>
            prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
        );
    };

    const toggleAirline = (airline: string) => {
        setSelectedAirlines((prev) =>
            prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]
        );
    };

    const selectAllRoutes = () => {
        setSelectedRoutes(selectedRoutes.length === allRoutes.length ? [] : [...allRoutes]);
    };

    const selectAllAirlines = () => {
        setSelectedAirlines(selectedAirlines.length === allAirlines.length ? [] : [...allAirlines]);
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const payload: Record<string, unknown> = {
                start_date: startDate,
                end_date: endDate,
            };
            if (selectedRoutes.length > 0) payload.routes = selectedRoutes;
            if (selectedAirlines.length > 0) payload.airlines = selectedAirlines;

            const res = await api.post("/api/flights/export", payload, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `AeroPrice_${startDate}_to_${endDate}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Export Berhasil! File Excel telah diunduh.");
        } catch (err: any) {
            const msg =
                err?.response?.data?.error || "Terjadi kesalahan saat mengexport data.";
            toast.error(`Export Gagal. ${msg}`);
        } finally {
            setIsExporting(false);
        }
    };

    const getClientExportOptions = () => {
        const options: any = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        };
        if (selectedRoutes.length > 0) options.selectedRoutes = selectedRoutes;
        if (selectedAirlines.length > 0) options.selectedAirlines = selectedAirlines;
        return options;
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            await new Promise((r) => setTimeout(r, 300));
            exportToCSV(getClientExportOptions());
            toast.success("Export Berhasil! File CSV telah diunduh.");
        } catch {
            toast.error("Export Gagal.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            await new Promise((r) => setTimeout(r, 300));
            exportToJSON(getClientExportOptions());
            toast.success("Export Berhasil! File JSON telah diunduh.");
        } catch {
            toast.error("Export Gagal.");
        } finally {
            setIsExporting(false);
        }
    };

    const selectedRouteCount = selectedRoutes.length || allRoutes.length;
    const selectedAirlineCount = selectedAirlines.length || allAirlines.length;
    const estimatedSheets = selectedRouteCount * selectedAirlineCount;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Ekspor Data</h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Download data harga tiket dalam berbagai format
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Export Filters */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Filter className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Filter Data</h3>
                            <p className="text-sm text-neutral-500">
                                Pilih rentang waktu, rute, dan maskapai
                            </p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Tanggal Terbang Mulai</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Tanggal Terbang Akhir</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Routes Checkbox */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Rute</Label>
                                <button
                                    type="button"
                                    className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                                    onClick={selectAllRoutes}
                                >
                                    {selectedRoutes.length === allRoutes.length
                                        ? "Batalkan Semua"
                                        : "Pilih Semua"}
                                </button>
                            </div>
                            <div className="rounded-lg border border-neutral-200 p-3 max-h-[200px] overflow-y-auto space-y-2">
                                {allRoutes.length === 0 ? (
                                    <p className="text-sm text-neutral-400 text-center py-2">
                                        Belum ada data rute
                                    </p>
                                ) : (
                                    allRoutes.map((route) => (
                                        <label
                                            key={route}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedRoutes.includes(route)}
                                                onCheckedChange={() => toggleRoute(route)}
                                            />
                                            <span className="text-sm">
                                                {formatRoute(route)}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-neutral-400">
                                {selectedRoutes.length === 0
                                    ? `Semua rute (${allRoutes.length})`
                                    : `${selectedRoutes.length} rute dipilih`}
                            </p>
                        </div>

                        {/* Airlines Checkbox */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Maskapai</Label>
                                <button
                                    type="button"
                                    className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                                    onClick={selectAllAirlines}
                                >
                                    {selectedAirlines.length === allAirlines.length
                                        ? "Batalkan Semua"
                                        : "Pilih Semua"}
                                </button>
                            </div>
                            <div className="rounded-lg border border-neutral-200 p-3 max-h-[200px] overflow-y-auto space-y-2">
                                {allAirlines.length === 0 ? (
                                    <p className="text-sm text-neutral-400 text-center py-2">
                                        Belum ada data maskapai
                                    </p>
                                ) : (
                                    allAirlines.map((airline) => (
                                        <label
                                            key={airline}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedAirlines.includes(airline)}
                                                onCheckedChange={() => toggleAirline(airline)}
                                            />
                                            <span className="text-sm">{airline}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-neutral-400">
                                {selectedAirlines.length === 0
                                    ? `Semua maskapai (${allAirlines.length})`
                                    : `${selectedAirlines.length} maskapai dipilih`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Export Formats */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Download className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Format Export</h3>
                            <p className="text-sm text-neutral-500">
                                Pilih format file yang diinginkan
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 h-auto py-4 px-4 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                        >
                            <div className="p-2 rounded-lg bg-green-100">
                                {isExporting ? (
                                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-medium">Excel (.xlsx) — dari server</div>
                                <div className="text-xs text-neutral-500">
                                    Format segitiga per rute/maskapai
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 h-auto py-4 px-4 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                            onClick={handleExportCSV}
                            disabled={isExporting}
                        >
                            <div className="p-2 rounded-lg bg-blue-100">
                                {isExporting ? (
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                ) : (
                                    <FileText className="h-5 w-5 text-blue-600" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-medium">CSV (.csv)</div>
                                <div className="text-xs text-neutral-500">
                                    Format flat, semua data dalam 1 file
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 h-auto py-4 px-4 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
                            onClick={handleExportJSON}
                            disabled={isExporting}
                        >
                            <div className="p-2 rounded-lg bg-orange-100">
                                {isExporting ? (
                                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                                ) : (
                                    <FileJson className="h-5 w-5 text-orange-600" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-medium">JSON (.json)</div>
                                <div className="text-xs text-neutral-500">
                                    Data terstruktur untuk developer
                                </div>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 pb-8">
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Periode</div>
                            <div className="text-lg font-display font-bold">
                                {Math.ceil(
                                    (new Date(endDate).getTime() -
                                        new Date(startDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                ) + 1}{" "}
                                Hari
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <Filter className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Rute Dipilih</div>
                            <div className="text-lg font-display font-bold">
                                {selectedRoutes.length === 0
                                    ? `Semua (${allRoutes.length})`
                                    : `${selectedRoutes.length} Rute`}
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <Download className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Maskapai Dipilih</div>
                            <div className="text-lg font-display font-bold">
                                {selectedAirlines.length === 0
                                    ? `Semua (${allAirlines.length})`
                                    : `${selectedAirlines.length} Maskapai`}
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>
        </>
    );
}
