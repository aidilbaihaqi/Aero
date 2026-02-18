"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import {
    CardSolid,
    CardSolidContent
} from "@/components/ui/card-solid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileJson, FileText, Calendar, Filter, Loader2 } from "lucide-react";
import { exportToExcel, exportToCSV, exportToJSON, flightRoutes } from "@/lib/export-excel";
import { toast } from "sonner"; // Adapting to use sonner

// Route options for filtering
const routeOptions = [
    { value: 'BTH-CGK', label: 'BTH - CGK (Batam → Jakarta)' },
    { value: 'BTH-KNO', label: 'BTH - KNO (Batam → Medan)' },
    { value: 'BTH-SUB', label: 'BTH - SUB (Batam → Surabaya)' },
    { value: 'BTH-PDG', label: 'BTH - PDG (Batam → Padang)' },
    { value: 'TNJ-CGK', label: 'TNJ - CGK (Tanjung Pinang → Jakarta)' },
];

// Airline options for filtering
const airlineOptions = [
    { value: 'garuda', label: 'Garuda Indonesia' },
    { value: 'citilink', label: 'Citilink' },
    { value: 'lion', label: 'Lion Air' },
    { value: 'superairjet', label: 'Super Air Jet' },
    { value: 'batik', label: 'Batik Air' },
];

export default function Export() {
    const [isExporting, setIsExporting] = useState(false);
    const [startDate, setStartDate] = useState(`2026-02-01`);;
    const [endDate, setEndDate] = useState(`2026-02-28`);;
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [selectedAirline, setSelectedAirline] = useState('all');

    const getExportOptions = () => {
        const options: any = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        };

        if (selectedRoute !== 'all') {
            options.selectedRoutes = [selectedRoute];
        }

        if (selectedAirline !== 'all') {
            // Map value to airline name
            const airlineMap: Record<string, string> = {
                garuda: 'Garuda',
                citilink: 'Citilink',
                lion: 'Lion',
                superairjet: 'Super Air Jet',
                batik: 'Batik',
            };
            options.selectedAirlines = [airlineMap[selectedAirline]];
        }

        return options;
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
            exportToExcel(getExportOptions());
            toast.success('Export Berhasil! File Excel telah diunduh.');
        } catch (error) {
            toast.error('Export Gagal. Terjadi kesalahan saat mengexport data.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            exportToCSV(getExportOptions());
            toast.success('Export Berhasil! File CSV telah diunduh.');
        } catch (error) {
            toast.error('Export Gagal. Terjadi kesalahan saat mengexport data.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            exportToJSON(getExportOptions());
            toast.success('Export Berhasil! File JSON telah diunduh.');
        } catch (error) {
            toast.error('Export Gagal. Terjadi kesalahan saat mengexport data.');
        } finally {
            setIsExporting(false);
        }
    };

    // Calculate estimated records based on date range and filters
    const calculateEstimatedRecords = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        let routeCount = flightRoutes.length;
        if (selectedRoute !== 'all') {
            routeCount = flightRoutes.filter((r) => r.route === selectedRoute).length;
        }
        if (selectedAirline !== 'all') {
            const airlineMap: Record<string, string> = {
                garuda: 'Garuda',
                citilink: 'Citilink',
                lion: 'Lion',
                superairjet: 'Super Air Jet',
                batik: 'Batik',
            };
            routeCount = flightRoutes.filter((r) =>
                r.airline.toLowerCase().includes(airlineMap[selectedAirline].toLowerCase())
            ).length;
        }

        // Estimate: scrape dates (30) x travel dates (days) x routes
        return 30 * days * routeCount;
    };

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Ekspor Data</h1>
                <p className="text-sm text-neutral-500 mt-1">Download data harga tiket dalam berbagai format</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Export Options */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Filter className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Filter Data</h3>
                            <p className="text-sm text-neutral-500">Pilih rentang waktu dan rute</p>
                        </div>
                    </div>
                    <div className="space-y-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="route">Rute</Label>
                            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Rute" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Rute (10 sheet)</SelectItem>
                                    {routeOptions.map((route) => (
                                        <SelectItem key={route.value} value={route.value}>
                                            {route.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="airline">Maskapai</Label>
                            <Select value={selectedAirline} onValueChange={setSelectedAirline}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Maskapai" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Maskapai</SelectItem>
                                    {airlineOptions.map((airline) => (
                                        <SelectItem key={airline.value} value={airline.value}>
                                            {airline.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <p className="text-sm text-neutral-500">Pilih format file yang diinginkan</p>
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
                                <div className="font-medium">Excel (.xlsx)</div>
                                <div className="text-xs text-neutral-500">Multi-sheet per rute/maskapai</div>
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
                                <div className="text-xs text-neutral-500">Format flat, semua data dalam 1 file</div>
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
                                <div className="text-xs text-neutral-500">Data terstruktur untuk developer</div>
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
                                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Hari
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Est. Records</div>
                            <div className="text-lg font-display font-bold">
                                {calculateEstimatedRecords().toLocaleString()}
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
                            <div className="text-sm text-neutral-400">Sheet Count</div>
                            <div className="text-lg font-display font-bold">
                                {selectedRoute === 'all' && selectedAirline === 'all'
                                    ? 10
                                    : flightRoutes.filter((r) => {
                                        if (selectedRoute !== 'all' && r.route !== selectedRoute) return false;
                                        if (selectedAirline !== 'all') {
                                            const airlineMap: Record<string, string> = {
                                                garuda: 'Garuda',
                                                citilink: 'Citilink',
                                                lion: 'Lion',
                                                superairjet: 'Super Air Jet',
                                                batik: 'Batik',
                                            };
                                            if (!r.airline.toLowerCase().includes(airlineMap[selectedAirline].toLowerCase())) return false;
                                        }
                                        return true;
                                    }).length
                                } Sheet
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>
        </AppLayout>
    );
}
