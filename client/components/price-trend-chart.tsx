"use client";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";

const data = [
    { day: "Sen", price: 1200000 },
    { day: "Sel", price: 1150000 },
    { day: "Rab", price: 1300000 },
    { day: "Kam", price: 1100000 },
    { day: "Jum", price: 950000 },
    { day: "Sab", price: 1050000 },
    { day: "Min", price: 1250000 },
];

export function PriceTrendChart() {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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
