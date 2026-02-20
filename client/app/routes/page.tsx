"use client";

import { useState, useEffect } from "react";
import {
    CardSolid,
    CardSolidContent,
} from "@/components/ui/card-solid";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plane, Map, Activity, AlertCircle, Loader2, Search } from "lucide-react";
import api from "@/lib/axios";
import { flightRoutes } from "@/lib/export-excel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FlightFare {
    id: number;
    route: string;
    airline: string;
    flight_number: string;
    travel_date: string;
    depart_time: string;
    arrive_time: string;
    basic_fare: number;
    status_scrape: string;
}

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

export default function Routes() {
    const [loading, setLoading] = useState(true);
    const [latestFares, setLatestFares] = useState<Record<string, FlightFare>>({});

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAirline, setSelectedAirline] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/flights/history", {
                params: { limit: 500 },
            });
            // Group by sheetName-like key (airline+route), keep only the latest/cheapest
            const faresMap: Record<string, FlightFare> = {};
            for (const fare of res.data as FlightFare[]) {
                // Build a key matching flightRoutes config
                const match = flightRoutes.find(
                    (r) => r.route === fare.route && fare.airline.includes(r.airline.split(" ")[0])
                );
                const key = match?.sheetName || `${fare.airline}-${fare.route}`;
                if (!faresMap[key] || fare.basic_fare < faresMap[key].basic_fare) {
                    faresMap[key] = fare;
                }
            }
            setLatestFares(faresMap);
        } catch (err) {
            console.error("Failed to fetch routes", err);
        } finally {
            setLoading(false);
        }
    };

    // Build display data: merge flightRoutes config with latest prices
    const routesData = flightRoutes.map((r) => {
        const fare = latestFares[r.sheetName];
        return {
            sheetName: r.sheetName,
            origin: r.route.split("-")[0],
            dest: r.route.split("-")[1],
            airline: r.airline,
            flight: r.flightNumber,
            departTime: r.departureTime,
            arriveTime: r.arrivalTime,
            lastPrice: fare ? formatPrice(fare.basic_fare) : "—",
            status: fare ? "Active" : "Inactive",
        };
    });

    const activeCount = routesData.filter((r) => r.status === "Active").length;
    const inactiveCount = routesData.filter((r) => r.status === "Inactive").length;

    // Filter Logic
    const filteredRoutes = routesData.filter((route) => {
        const matchesSearch =
            searchQuery === "" ||
            route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
            route.dest.toLowerCase().includes(searchQuery.toLowerCase()) ||
            route.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
            route.flight.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAirline =
            selectedAirline === "all" || route.airline === selectedAirline;

        return matchesSearch && matchesAirline;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
    const paginatedRoutes = filteredRoutes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Get unique airlines for filter
    const airlines = Array.from(new Set(routesData.map((r) => r.airline)));

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Kelola Rute</h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Rute penerbangan yang dipantau sistem
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <Map className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Total Rute</div>
                            <div className="text-2xl font-display font-bold">
                                {loading ? "—" : routesData.length}
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-green-900/50 text-green-400">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Ada Data</div>
                            <div className="text-2xl font-display font-bold text-green-400">
                                {loading ? "—" : activeCount}
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-orange-900/50 text-orange-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Belum Ada Data</div>
                            <div className="text-2xl font-display font-bold text-orange-400">
                                {loading ? "—" : inactiveCount}
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Cari rute, maskapai, atau no penerbangan..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-[200px]">
                    <Select value={selectedAirline} onValueChange={setSelectedAirline}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Semua Maskapai" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Maskapai</SelectItem>
                            {airlines.map((airline) => (
                                <SelectItem key={airline} value={airline}>
                                    {airline}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Routes Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                            <TableHead className="w-[100px]">Kode</TableHead>
                            <TableHead>Rute</TableHead>
                            <TableHead>Maskapai</TableHead>
                            <TableHead>Jam</TableHead>
                            <TableHead>Harga Terakhir</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : paginatedRoutes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                                    Tidak ada rute yang ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRoutes.map((route) => (
                                <TableRow key={route.sheetName} className="group">
                                    <TableCell className="font-mono text-xs text-neutral-500">
                                        {route.sheetName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                                                <Plane className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">
                                                    {route.origin}{" "}
                                                    <span className="text-neutral-300 mx-1">→</span>{" "}
                                                    {route.dest}
                                                </div>
                                                <div className="text-[10px] text-neutral-400">
                                                    Penerbangan Langsung
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm">{route.airline}</div>
                                        <div className="text-xs text-neutral-500">{route.flight}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-600">
                                        {route.departTime} - {route.arriveTime}
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-sm">
                                        {route.lastPrice}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                route.status === "Active"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                                                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-100 border-none"
                                            }
                                        >
                                            {route.status === "Active" ? "Aktif" : "Belum Ada Data"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {!loading && filteredRoutes.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4 border-t pt-4">
                        <div className="text-sm text-neutral-500">
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                            {Math.min(currentPage * itemsPerPage, filteredRoutes.length)} dari{" "}
                            {filteredRoutes.length} rute
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Sebelumnya
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
