"use client";

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
import { Plane, Map, Activity, AlertCircle } from "lucide-react";

const routesData = [
    {
        id: 1,
        sheetName: "GIA-BTMJKT",
        origin: "BTH",
        dest: "CGK",
        airline: "Garuda Indonesia",
        flight: "GA-168",
        departTime: "08:00",
        arriveTime: "09:25",
        lastPrice: "Rp 1.450.000",
        status: "Active",
    },
    {
        id: 2,
        sheetName: "GIA-TNJKT",
        origin: "TNJ",
        dest: "CGK",
        airline: "Garuda Indonesia",
        flight: "GA-287",
        departTime: "15:00",
        arriveTime: "16:30",
        lastPrice: "Rp 1.350.000",
        status: "Active",
    },
    {
        id: 3,
        sheetName: "CITILINK-BTMJKT",
        origin: "BTH",
        dest: "CGK",
        airline: "Citilink",
        flight: "QG-712",
        departTime: "09:30",
        arriveTime: "10:55",
        lastPrice: "Rp 650.000",
        status: "Active",
    },
    {
        id: 4,
        sheetName: "CITILINK-TNJKT",
        origin: "TNJ",
        dest: "CGK",
        airline: "Citilink",
        flight: "QG-821",
        departTime: "12:00",
        arriveTime: "13:30",
        lastPrice: "Rp 720.000",
        status: "Active",
    },
    {
        id: 5,
        sheetName: "LION-BTMJKT",
        origin: "BTH",
        dest: "CGK",
        airline: "Lion Air",
        flight: "JT-374",
        departTime: "10:00",
        arriveTime: "11:25",
        lastPrice: "Rp 680.000",
        status: "Active",
    },
    {
        id: 6,
        sheetName: "LION-BTMKNO",
        origin: "BTH",
        dest: "KNO",
        airline: "Lion Air",
        flight: "JT-971",
        departTime: "09:50",
        arriveTime: "11:15",
        lastPrice: "Rp 750.000",
        status: "Active",
    },
    {
        id: 7,
        sheetName: "LION-BTMSBY",
        origin: "BTH",
        dest: "SUB",
        airline: "Lion Air",
        flight: "JT-948",
        departTime: "14:00",
        arriveTime: "16:30",
        lastPrice: "Rp 1.100.000",
        status: "Active",
    },
    {
        id: 8,
        sheetName: "LION-BTMPDG",
        origin: "BTH",
        dest: "PDG",
        airline: "Lion Air",
        flight: "JT-265",
        departTime: "11:30",
        arriveTime: "12:45",
        lastPrice: "Rp 850.000",
        status: "Active",
    },
    {
        id: 9,
        sheetName: "AIRJET-BTMJKT",
        origin: "BTH",
        dest: "CGK",
        airline: "Super Air Jet",
        flight: "IU-854",
        departTime: "07:00",
        arriveTime: "08:25",
        lastPrice: "Rp 550.000",
        status: "Active",
    },
    {
        id: 10,
        sheetName: "BATIK-TNJKT",
        origin: "TNJ",
        dest: "CGK",
        airline: "Batik Air",
        flight: "ID-6863",
        departTime: "10:00",
        arriveTime: "11:30",
        lastPrice: "Rp 950.000",
        status: "Warning",
    },
];

export default function Routes() {
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
                            <div className="text-sm text-neutral-400">
                                Total Rute
                            </div>
                            <div className="text-2xl font-display font-bold">
                                10
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
                            <div className="text-sm text-neutral-400">
                                Aktif Dipantau
                            </div>
                            <div className="text-2xl font-display font-bold text-green-400">
                                9
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
                            <div className="text-sm text-neutral-400">
                                Bermasalah
                            </div>
                            <div className="text-2xl font-display font-bold text-orange-400">
                                1
                            </div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
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
                        {routesData.map((route) => (
                            <TableRow key={route.id} className="group">
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
                                                <span className="text-neutral-300 mx-1">
                                                    →
                                                </span>{" "}
                                                {route.dest}
                                            </div>
                                            <div className="text-[10px] text-neutral-400">
                                                Penerbangan Langsung
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-sm">
                                        {route.airline}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        {route.flight}
                                    </div>
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
                                                : route.status === "Inactive"
                                                    ? "bg-neutral-100 text-neutral-500 hover:bg-neutral-100 border-none"
                                                    : "bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"
                                        }
                                    >
                                        {route.status === "Active"
                                            ? "Aktif"
                                            : route.status === "Warning"
                                                ? "Peringatan"
                                                : "Nonaktif"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
