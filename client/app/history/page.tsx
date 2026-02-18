"use client";

import AppLayout from "@/components/layout/app-layout";
import {
    CardSolid,
    CardSolidContent
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
import { History, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const logsData = [
    { id: 'RUN-2026013107', time: 'Hari ini, 07:30', type: 'SCHEDULED', status: 'SUCCESS', flights: 156, lowestPrice: 'Rp 450.000' },
    { id: 'RUN-2026013014', time: 'Kemarin, 14:22', type: 'MANUAL', status: 'SUCCESS', flights: 152, lowestPrice: 'Rp 480.000' },
    { id: 'RUN-2026013007', time: 'Kemarin, 07:30', type: 'SCHEDULED', status: 'SUCCESS', flights: 148, lowestPrice: 'Rp 520.000' },
    { id: 'RUN-2026012907', time: '29 Jan, 07:30', type: 'SCHEDULED', status: 'PARTIAL', flights: 98, lowestPrice: 'Rp 550.000' },
    { id: 'RUN-2026012807', time: '28 Jan, 07:30', type: 'SCHEDULED', status: 'SUCCESS', flights: 145, lowestPrice: 'Rp 490.000' },
    { id: 'RUN-2026012716', time: '27 Jan, 16:45', type: 'MANUAL', status: 'SUCCESS', flights: 142, lowestPrice: 'Rp 510.000' },
    { id: 'RUN-2026012707', time: '27 Jan, 07:30', type: 'SCHEDULED', status: 'SUCCESS', flights: 150, lowestPrice: 'Rp 475.000' },
    { id: 'RUN-2026012607', time: '26 Jan, 07:30', type: 'SCHEDULED', status: 'FAILED', flights: 0, lowestPrice: '-' },
    { id: 'RUN-2026012507', time: '25 Jan, 07:30', type: 'SCHEDULED', status: 'SUCCESS', flights: 155, lowestPrice: 'Rp 460.000' },
    { id: 'RUN-2026012410', time: '24 Jan, 10:15', type: 'MANUAL', status: 'SUCCESS', flights: 148, lowestPrice: 'Rp 530.000' },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'SUCCESS':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle className="h-3 w-3 mr-1" />Berhasil</Badge>;
        case 'PARTIAL':
            return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="h-3 w-3 mr-1" />Sebagian</Badge>;
        case 'FAILED':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getTypeBadge = (type: string) => {
    if (type === 'SCHEDULED') {
        return <Badge variant="outline" className="border-blue-200 text-blue-600"><Clock className="h-3 w-3 mr-1" />Terjadwal</Badge>;
    }
    return <Badge variant="outline" className="border-purple-200 text-purple-600">Manual</Badge>;
};

export default function HistoryPage() {
    const successCount = logsData.filter(l => l.status === 'SUCCESS').length;
    const partialCount = logsData.filter(l => l.status === 'PARTIAL').length;
    const failedCount = logsData.filter(l => l.status === 'FAILED').length;

    return (
        <AppLayout>
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
                            <div className="text-2xl font-display font-bold">{logsData.length}</div>
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
                            <div className="text-2xl font-display font-bold text-green-400">{successCount}</div>
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
                            <div className="text-2xl font-display font-bold text-orange-400">{partialCount}</div>
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
                            <div className="text-2xl font-display font-bold text-red-400">{failedCount}</div>
                        </div>
                    </CardSolidContent>
                </CardSolid>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                            <TableHead>ID Aktivitas</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Jumlah Tiket</TableHead>
                            <TableHead className="text-right">Harga Terendah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logsData.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{log.id}</TableCell>
                                <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">{log.time}</TableCell>
                                <TableCell>{getTypeBadge(log.type)}</TableCell>
                                <TableCell>{getStatusBadge(log.status)}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{log.flights}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-sm">{log.lowestPrice}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
