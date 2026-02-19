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
import { History, Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface ScrapeRun {
    id: number;
    run_id: string;
    run_type: string;
    scraped_at: string | null;
    scrape_date: string;
    route: string;
    status: string;
    total_records: number;
    total_errors: number;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case "SUCCESS":
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle className="h-3 w-3 mr-1" />Berhasil</Badge>;
        case "PARTIAL":
            return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="h-3 w-3 mr-1" />Sebagian</Badge>;
        case "FAILED":
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getTypeBadge = (type: string) => {
    if (type === "SCHEDULED") {
        return <Badge variant="outline" className="border-blue-200 text-blue-600"><Clock className="h-3 w-3 mr-1" />Terjadwal</Badge>;
    }
    return <Badge variant="outline" className="border-purple-200 text-purple-600">Manual</Badge>;
};

const formatTime = (isoStr: string | null) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
};

export default function HistoryPage() {
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState<ScrapeRun[]>([]);

    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/flights/runs", { params: { limit: 50 } });
            setRuns(res.data);
        } catch (err) {
            console.error("Failed to fetch runs", err);
        } finally {
            setLoading(false);
        }
    };

    const successCount = runs.filter((r) => r.status === "SUCCESS").length;
    const partialCount = runs.filter((r) => r.status === "PARTIAL").length;
    const failedCount = runs.filter((r) => r.status === "FAILED").length;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Riwayat</h1>
                <p className="text-sm text-neutral-500 mt-1">Log riwayat pengambilan data harga tiket</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-neutral-800 text-white">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Total Aktivitas</div>
                            <div className="text-2xl font-display font-bold">{loading ? "—" : runs.length}</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-green-900/50 text-green-400">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Berhasil</div>
                            <div className="text-2xl font-display font-bold text-green-400">{loading ? "—" : successCount}</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-orange-900/50 text-orange-400">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Sebagian</div>
                            <div className="text-2xl font-display font-bold text-orange-400">{loading ? "—" : partialCount}</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
                <CardSolid className="p-1">
                    <CardSolidContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-xl bg-red-900/50 text-red-400">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-400">Gagal</div>
                            <div className="text-2xl font-display font-bold text-red-400">{loading ? "—" : failedCount}</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                            <TableHead>Run ID</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Rute</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Records</TableHead>
                            <TableHead className="text-right">Errors</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : runs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                                    Belum ada riwayat scraping.
                                </TableCell>
                            </TableRow>
                        ) : (
                            runs.map((run) => (
                                <TableRow key={run.id}>
                                    <TableCell className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        {run.run_id.slice(0, 12)}...
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {formatTime(run.scraped_at)}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {run.route.replace("-", " → ")}
                                    </TableCell>
                                    <TableCell>{getTypeBadge(run.run_type)}</TableCell>
                                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{run.total_records}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{run.total_errors}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
