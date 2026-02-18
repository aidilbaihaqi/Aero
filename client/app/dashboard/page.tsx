"use client";

import { useState } from "react";
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
} from "lucide-react";
import { PriceTrendChart } from "@/components/price-trend-chart";
import { toast } from "sonner"; // Using sonner as installed

export default function Dashboard() {
    const [isScraping, setIsScraping] = useState(false);

    const handleManualScrape = () => {
        setIsScraping(true);
        // Simulate API call
        setTimeout(() => {
            setIsScraping(false);
            toast.success("Scraping Berhasil!", {
                description: "Data akan segera diperbarui.",
            });
        }, 2000);
    };

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
                                Hari ini, 07:30 WIB
                            </span>
                        </span>
                        <Badge
                            variant="outline"
                            className="ml-2 border-green-200 bg-green-50 text-green-700"
                        >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Berhasil
                        </Badge>
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
                    {/* 1. Overall Information (Ringkasan Data) */}
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
                                <div className="text-sm text-neutral-400">
                                    Rute yang Dipantau
                                </div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    10
                                </div>
                                <div className="mt-1 text-xs text-green-400 flex items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2"></span>
                                    Semua aktif
                                </div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">
                                    Maskapai
                                </div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    5
                                </div>
                                <div className="mt-1 text-xs text-neutral-400">
                                    Terpantau
                                </div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">
                                    Cek Harga
                                </div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    28
                                </div>
                                <div className="mt-1 text-xs text-neutral-400">
                                    Bulan ini
                                </div>
                            </div>
                            <div className="rounded-xl bg-neutral-800/50 p-4 backdrop-blur-sm">
                                <div className="text-sm text-neutral-400">
                                    Kesalahan
                                </div>
                                <div className="mt-1 text-3xl font-display font-bold">
                                    0
                                </div>
                                <div className="mt-1 text-xs text-green-400">
                                    Lancar
                                </div>
                            </div>
                        </CardSolidContent>
                    </CardSolid>

                    {/* 2. Price Trends (Grafik Harga) */}
                    <CardSolid className="min-h-[300px]">
                        <CardSolidHeader>
                            <CardSolidTitle>Grafik Harga</CardSolidTitle>
                            <CardSolidDescription>
                                Pergerakan harga tiket 7 hari terakhir
                            </CardSolidDescription>
                        </CardSolidHeader>
                        <CardSolidContent className="flex h-full items-center justify-center pb-2 pl-0 pr-4 pt-4">
                            <PriceTrendChart />
                        </CardSolidContent>
                    </CardSolid>

                    {/* 3. Price Monitor Table (Pantauan Harga) */}
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
                                        <TableHead className="text-right">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        {
                                            route: "BTH → CGK",
                                            airline: "Super Air Jet",
                                            flight: "IU-854",
                                            date: "30 Jan",
                                            price: "Rp 650.000",
                                            status: "Success",
                                        },
                                        {
                                            route: "BTH → CGK",
                                            airline: "Lion Air",
                                            flight: "JT-374",
                                            date: "30 Jan",
                                            price: "Rp 680.000",
                                            status: "Success",
                                        },
                                        {
                                            route: "BTH → KNO",
                                            airline: "Lion Air",
                                            flight: "JT-971",
                                            date: "30 Jan",
                                            price: "Rp 550.000",
                                            status: "Success",
                                        },
                                        {
                                            route: "BTH → SUB",
                                            airline: "Lion Air",
                                            flight: "JT-948",
                                            date: "30 Jan",
                                            price: "Rp 1.100.000",
                                            status: "Success",
                                        },
                                        {
                                            route: "TNJ → CGK",
                                            airline: "Batik Air",
                                            flight: "ID-6863",
                                            date: "30 Jan",
                                            price: "Rp 950.000",
                                            status: "Partial",
                                        },
                                        {
                                            route: "TNJ → CGK",
                                            airline: "Garuda",
                                            flight: "GA-287",
                                            date: "30 Jan",
                                            price: "Rp 1.450.000",
                                            status: "Success",
                                        },
                                    ].map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">
                                                {item.route}
                                            </TableCell>
                                            <TableCell>
                                                {item.airline}
                                            </TableCell>
                                            <TableCell className="text-neutral-500">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {item.flight}
                                                    </span>
                                                    <span className="text-[10px]">
                                                        {item.date} • 07:30
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold font-mono">
                                                {item.price}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        item.status ===
                                                            "Success"
                                                            ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                                                            : "bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"
                                                    }
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (Span 1) - Side Information */}
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
                                <div className="mt-1 font-display text-2xl font-bold">
                                    07:30
                                </div>
                                <div className="text-sm text-neutral-400">
                                    Besok pagi, WIB
                                </div>
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
                                    Rp 1,2jt
                                </div>
                                <div className="mt-1 flex items-center text-sm font-medium text-green-600">
                                    <ArrowUpRight className="mr-1 h-3 w-3" />
                                    +15% dari minggu lalu
                                </div>
                            </div>
                        </CardGlassHeader>
                    </CardGlass>

                    {/* 3. Route Performance (Vertical Layout) */}
                    <CardGlass variant="white">
                        <CardGlassHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardGlassTitle>Performa</CardGlassTitle>
                                <CardGlassDescription>
                                    Harga Rute
                                </CardGlassDescription>
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
                                    <div className="text-sm font-medium">
                                        Paling Murah
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        TNJ - CGK
                                    </div>
                                    <div className="text-sm font-bold">
                                        -12% rata-rata
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-neutral-100 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">
                                        Paling Fluktuatif
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        BTH - CGK
                                    </div>
                                    <div className="text-sm font-bold">
                                        +24% rata-rata
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
                            Tiket termurah hari ini
                        </p>

                        <div className="space-y-1">
                            <div className="text-sm text-neutral-400">
                                BTH → SUB
                            </div>
                            <div className="font-display text-3xl font-bold">
                                Rp 1.1M
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="rounded bg-white/20 px-2 py-0.5 text-xs">
                                    Lion Air
                                </span>
                                <span className="text-xs text-green-400">
                                    Turun 15%
                                </span>
                            </div>
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
