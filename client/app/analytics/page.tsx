"use client";

import { useState, useEffect } from "react";
import {
    CardSolid,
    CardSolidContent,
} from "@/components/ui/card-solid";
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
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
import api from "@/lib/axios";

interface AnalyticsData {
    min_price: number;
    avg_price: number;
    max_price: number;
    price_trend: { date: string; avgPrice: number; minPrice: number; maxPrice: number }[];
    airline_comparison: { airline: string; avgPrice: number; flightCount: number }[];
}

const formatPrice = (value: number) => `Rp ${(value / 1000).toFixed(0)}K`;
const formatPriceFull = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/stats/analytics");
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <>
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
                            <div className="text-xl font-display font-bold">
                                {data ? formatPriceFull(data.min_price) : "—"}
                            </div>
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
                            <div className="text-xl font-display font-bold">
                                {data ? formatPriceFull(Math.round(data.avg_price)) : "—"}
                            </div>
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
                            <div className="text-xl font-display font-bold">
                                {data ? formatPriceFull(data.max_price) : "—"}
                            </div>
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
                        {data && data.price_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.price_trend}>
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
                                        labelStyle={{ color: "#171717" }}
                                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
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
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                Belum ada data tren
                            </div>
                        )}
                    </div>
                </div>

                {/* Airline Comparison */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <h3 className="text-lg font-display font-bold mb-4">Perbandingan Maskapai</h3>
                    <div className="h-[300px]">
                        {data && data.airline_comparison.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.airline_comparison} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                    <XAxis type="number" tickFormatter={formatPrice} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                                    <YAxis dataKey="airline" type="category" tick={{ fontSize: 11 }} stroke="#a3a3a3" width={100} />
                                    <Tooltip
                                        formatter={(value: any) => formatPrice(value)}
                                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Bar dataKey="avgPrice" fill="#171717" radius={[0, 4, 4, 0]} name="Harga Rata-rata" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                Belum ada data maskapai
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
