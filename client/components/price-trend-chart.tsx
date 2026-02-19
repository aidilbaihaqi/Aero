"use client";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";

interface ChartDataPoint {
    day: string;
    date?: string;
    price: number;
}

interface PriceTrendChartProps {
    data?: ChartDataPoint[];
}

const defaultData: ChartDataPoint[] = [
    { day: "Sen", price: 0 },
    { day: "Sel", price: 0 },
    { day: "Rab", price: 0 },
    { day: "Kam", price: 0 },
    { day: "Jum", price: 0 },
    { day: "Sab", price: 0 },
    { day: "Min", price: 0 },
];

export function PriceTrendChart({ data }: PriceTrendChartProps) {
    const chartData = data && data.length > 0 ? data : defaultData;

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient
                            id="colorPrice"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#fff"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor="#fff"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="day"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#171717",
                            border: "1px solid #333",
                            borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value: any) => [
                            `Rp ${value.toLocaleString()}`,
                            "Avg Price",
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#fff"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
