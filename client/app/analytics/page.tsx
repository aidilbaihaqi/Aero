"use client";

import AppLayout from "@/components/layout/app-layout";
import {
    CardSolid,
    CardSolidContent
} from "@/components/ui/card-solid";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
} from "recharts";

// Data tren harga 30 hari terakhir
const priceData = [
    { date: '3 Jan', avgPrice: 780000, minPrice: 520000, maxPrice: 1200000 },
    { date: '6 Jan', avgPrice: 750000, minPrice: 480000, maxPrice: 1150000 },
    { date: '9 Jan', avgPrice: 820000, minPrice: 550000, maxPrice: 1280000 },
    { date: '12 Jan', avgPrice: 890000, minPrice: 620000, maxPrice: 1350000 },
    { date: '15 Jan', avgPrice: 760000, minPrice: 490000, maxPrice: 1180000 },
    { date: '18 Jan', avgPrice: 710000, minPrice: 450000, maxPrice: 1100000 },
    { date: '21 Jan', avgPrice: 680000, minPrice: 420000, maxPrice: 1050000 },
    { date: '24 Jan', avgPrice: 720000, minPrice: 480000, maxPrice: 1120000 },
    { date: '27 Jan', avgPrice: 690000, minPrice: 450000, maxPrice: 1080000 },
    { date: '30 Jan', avgPrice: 650000, minPrice: 420000, maxPrice: 980000 },
];

// Data perbandingan maskapai
const airlineData = [
    { airline: 'Super Air Jet', avgPrice: 550000, flightCount: 45 },
    { airline: 'Citilink', avgPrice: 680000, flightCount: 52 },
    { airline: 'Lion Air', avgPrice: 720000, flightCount: 68 },
    { airline: 'Batik Air', avgPrice: 950000, flightCount: 35 },
    { airline: 'Garuda', avgPrice: 1380000, flightCount: 28 },
];

const formatPrice = (value: number) => {
    return `Rp ${(value / 1000).toFixed(0)}K`;
};

export default function Analytics() {
    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Analisis Harga</h1>
                <p className="text-sm text-neutral-500 mt-1">Analisis tren harga dan perbandingan maskapai</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-green-900/50 text-green-400">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Harga Terendah</div>
                            <div className="text-xl font-display font-bold">Rp 420.000</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Rata-rata</div>
                            <div className="text-xl font-display font-bold">Rp 745.000</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-red-900/50 text-red-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Harga Tertinggi</div>
                            <div className="text-xl font-display font-bold">Rp 1.380.000</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Price Trend Chart */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <h3 className="text-lg font-display font-bold mb-4">Tren Harga (30 Hari)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priceData}>
                                <defs>
                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                                <Tooltip
                                    formatter={(value: any) => formatPrice(value)}
                                    labelStyle={{ color: '#171717' }}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="avgPrice"
                                    stroke="#171717"
                                    strokeWidth={2}
                                    fill="url(#colorAvg)"
                                    name="Rata-rata"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Airline Comparison */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <h3 className="text-lg font-display font-bold mb-4">Perbandingan Maskapai</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={airlineData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis type="number" tickFormatter={formatPrice} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                                <YAxis dataKey="airline" type="category" tick={{ fontSize: 11 }} stroke="#a3a3a3" width={100} />
                                <Tooltip
                                    formatter={(value: any) => formatPrice(value)}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="avgPrice" fill="#171717" radius={[0, 4, 4, 0]} name="Harga Rata-rata" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
