"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CardSolid,
    CardSolidHeader,
    CardSolidTitle,
    CardSolidDescription,
    CardSolidContent,
} from "@/components/ui/card-solid";
import {
    CardGlass,
    CardGlassHeader,
    CardGlassTitle,
    CardGlassDescription,
    CardGlassContent,
} from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plane,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { PriceTrendChart } from "@/components/price-trend-chart";
import { toast } from "sonner";
import api from "@/lib/axios";

interface DashboardStats {
    route_count: number;
    airline_count: number;
    runs_this_month: number;
    error_count: number;
    last_scrape_time: string | null;
    last_scrape_status: string | null;
    avg_price: number;
    best_deal: {
        route: string;
        airline: string;
        price: number;
        flight_number: string;
        travel_date: string;
    } | null;
    cheapest_route: { route: string; avg_price: number } | null;
    most_volatile: { route: string; avg_volatility: number } | null;
}

interface FlightFare {
    id: number;
    route: string;
    airline: string;
    flight_number: string;
    travel_date: string;
    basic_fare: number;
    status_scrape: string;
}

interface ChartPoint {
    day: string;
    date: string;
    price: number;
}

const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
};

const formatShortPrice = (price: number) => {
    if (price >= 1_000_000) return `Rp ${(price / 1_000_000).toFixed(1)}jt`;
    if (price >= 1000) return `Rp ${(price / 1000).toFixed(0)}K`;
    return `Rp ${price}`;
};

export default function Dashboard() {
    const [isScraping, setIsScraping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [fares, setFares] = useState<FlightFare[]>([]);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, faresRes, chartRes] = await Promise.all([
                api.get("/api/stats/dashboard"),
                api.get("/api/flights/history", { params: { limit: 6 } }),
                api.get("/api/stats/chart"),
            ]);
            setStats(statsRes.data);
            setFares(faresRes.data);
            setChartData(chartRes.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualScrape = async () => {
        setIsScraping(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const endDate = "2026-03-31";
            await api.post("/api/flights/bulk-routes", {
                start_date: today,
                end_date: endDate,
                run_type: "MANUAL",
            });
            toast.success("Scraping Berhasil!", {
                description: "Data telah diperbarui.",
            });
            fetchData(); // Refresh dashboard
        } catch (err: any) {
            toast.error("Scraping Gagal", {
                description: err?.response?.data?.detail || "Terjadi kesalahan.",
            });
        } finally {
            setIsScraping(false);
        }
    };

    const lastScrapeLabel = stats?.last_scrape_time
        ? new Date(stats.last_scrape_time).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
        }) + " WIB"
        : "Belum ada";

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold">Beranda</h1>
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>
                            Terakhir cek harga:{" "}
                            <span className="font-medium text-foreground">
                                {lastScrapeLabel}
                            </span>
                        </span>
                        {stats?.last_scrape_status && (
                            <Badge
                                variant="outline"
                                className={
                                    stats.last_scrape_status === "SUCCESS"
                                        ? "ml-2 border-green-200 bg-green-50 text-green-700"
                                        : "ml-2 border-orange-200 bg-orange-50 text-orange-700"
                                }
                            >
                                {stats.last_scrape_status === "SUCCESS" ? (
                                    <><CheckCircle2 className="mr-1 h-3 w-3" />Berhasil</>
                                ) : (
                                    <><AlertCircle className="mr-1 h-3 w-3" />{stats.last_scrape_status}</>
                                )}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleManualScrape}
                    disabled={isScraping}
                    className="w-full md:w-auto font-bold shadow-lg shadow-neutral-200 hover:shadow-xl transition-all active:scale-95"
                >
                    {isScraping ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sedang mengambil data...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Ambil Data Sekarang
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT COLUMN (Span 3) - Main Content */}
                <div className="flex flex-col gap-6 lg:col-span-3">
                    {/* 1. Overall Information */}
                    <CardSolid className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Plane className="h-32 w-32 -rotate-12" />
                        </div>
                        <CardSolidHeader>
                            <CardSolidTitle>Ringkasan Data</CardSolidTitle>
                            <CardSolidDescription>
                                Total data harga yang terpantau
                            </CardSolidDescription>
                        </CardSolidHeader>
                        <CardSolidContent className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">Rute yang Dipantau</div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    {loading ? "—" : stats?.route_count ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-green-400 flex items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2"></span>
                                    Semua aktif
                                </div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">Maskapai</div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    {loading ? "—" : stats?.airline_count ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-neutral-400">Terpantau</div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">Cek Harga</div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    {loading ? "—" : stats?.runs_this_month ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-neutral-400">Bulan ini</div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">Kesalahan</div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    {loading ? "—" : stats?.error_count ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-green-400">
                                    {stats?.error_count === 0 ? "Lancar" : `${stats?.error_count} gagal`}
                                </div>
                            </div>
                        </CardSolidContent>
                    </CardSolid>

                    {/* 2. Price Trends */}
                    <CardSolid className="min-h-[300px]">
                        <CardSolidHeader>
                            <CardSolidTitle>Grafik Harga</CardSolidTitle>
                            <CardSolidDescription>
                                Pergerakan harga tiket 7 hari terakhir
                            </CardSolidDescription>
                        </CardSolidHeader>
                        <CardSolidContent className="flex h-full items-center justify-center pb-2 pl-0 pr-4 pt-4">
                            <PriceTrendChart data={chartData} />
                        </CardSolidContent>
                    </CardSolid>

                    {/* 3. Price Monitor Table */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-display text-lg font-bold">
                                    Pantauan Harga
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Harga termurah untuk setiap rute
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/routes">Lihat Semua</Link>
                            </Button>
                        </div>

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                                        <TableHead>Rute</TableHead>
                                        <TableHead>Maskapai</TableHead>
                                        <TableHead>Info Penerbangan</TableHead>
                                        <TableHead>Harga Dasar</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-neutral-400">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                                Memuat data...
                                            </TableCell>
                                        </TableRow>
                                    ) : fares.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-neutral-400">
                                                Belum ada data. Klik "Ambil Data Sekarang" untuk memulai.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        fares.map((fare) => (
                                            <TableRow key={fare.id}>
                                                <TableCell className="font-medium">
                                                    {fare.route.replace("-", " → ")}
                                                </TableCell>
                                                <TableCell>{fare.airline}</TableCell>
                                                <TableCell className="text-neutral-500">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-foreground">
                                                            {fare.flight_number}
                                                        </span>
                                                        <span className="text-[10px]">
                                                            {new Date(fare.travel_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold font-mono">
                                                    {formatPrice(fare.basic_fare)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-700 hover:bg-green-100 border-none"
                                                    >
                                                        {fare.status_scrape === "SUCCESS" ? "Success" : fare.status_scrape}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (Span 1) */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* 1. Next Scrape */}
                    <CardGlass variant="white">
                        <CardGlassHeader>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div className="mt-4">
                                <CardGlassTitle className="text-neutral-500">
                                    Cek Harga Berikutnya
                                </CardGlassTitle>
                                <div className="mt-1 font-display text-2xl font-bold">07:30</div>
                                <div className="text-sm text-neutral-400">Besok pagi, WIB</div>
                            </div>
                        </CardGlassHeader>
                    </CardGlass>

                    {/* 2. Average Price */}
                    <CardGlass variant="white">
                        <CardGlassHeader>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="mt-4">
                                <CardGlassTitle className="text-neutral-500">
                                    Rata-rata Harga
                                </CardGlassTitle>
                                <div className="mt-1 font-display text-2xl font-bold">
                                    {loading ? "—" : formatShortPrice(stats?.avg_price ?? 0)}
                                </div>
                                <div className="mt-1 flex items-center text-sm font-medium text-neutral-500">
                                    Semua rute
                                </div>
                            </div>
                        </CardGlassHeader>
                    </CardGlass>

                    {/* 3. Route Performance */}
                    <CardGlass variant="white">
                        <CardGlassHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardGlassTitle>Performa</CardGlassTitle>
                                <CardGlassDescription>Harga Rute</CardGlassDescription>
                            </div>
                            <div className="rounded-full bg-neutral-100 p-2">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardGlassHeader>
                        <CardGlassContent className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center gap-4 rounded-lg border border-neutral-100 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <ArrowDownRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Paling Murah</div>
                                    <div className="text-xs text-neutral-500">
                                        {stats?.cheapest_route?.route ?? "—"}
                                    </div>
                                    <div className="text-sm font-bold">
                                        {stats?.cheapest_route
                                            ? formatShortPrice(stats.cheapest_route.avg_price)
                                            : "—"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-neutral-100 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Paling Fluktuatif</div>
                                    <div className="text-xs text-neutral-500">
                                        {stats?.most_volatile?.route ?? "—"}
                                    </div>
                                    <div className="text-sm font-bold">
                                        {stats?.most_volatile
                                            ? `Vol: ${stats.most_volatile.avg_volatility.toFixed(1)}%`
                                            : "—"}
                                    </div>
                                </div>
                            </div>
                        </CardGlassContent>
                    </CardGlass>

                    {/* 4. Best Deal */}
                    <div className="rounded-2xl bg-black p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <TrendingUp className="h-24 w-24 -rotate-12" />
                        </div>
                        <h3 className="mb-1 font-display text-lg font-bold">
                            Penawaran Terbaik
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6">
                            Tiket termurah saat ini
                        </p>
                        <div className="space-y-1">
                            <div className="text-sm text-neutral-400">
                                {stats?.best_deal?.route?.replace("-", " → ") ?? "—"}
                            </div>
                            <div className="font-display text-3xl font-bold">
                                {stats?.best_deal
                                    ? formatShortPrice(stats.best_deal.price)
                                    : "—"}
                            </div>
                            {stats?.best_deal && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="rounded bg-white/20 px-2 py-0.5 text-xs">
                                        {stats.best_deal.airline}
                                    </span>
                                    <span className="text-xs text-neutral-400">
                                        {stats.best_deal.flight_number}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            className="mt-8 w-full font-bold shadow-none active:scale-95 transition-transform bg-white text-black hover:bg-neutral-200"
                            asChild
                        >
                            <Link href="/routes">Lihat Detail</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
