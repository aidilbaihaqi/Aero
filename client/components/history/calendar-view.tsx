"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ScrapeRun {
  id: number;
  run_id: string;
  run_type: string;
  scraped_at: string | null;
  scrape_date: string; // The target date of the scrape
  route: string;
  status: string;
  total_records: number;
  total_errors: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "SUCCESS": return "bg-green-500";
    case "PARTIAL": return "bg-orange-500";
    case "FAILED": return "bg-red-500";
    default: return "bg-neutral-300";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "SUCCESS":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="h-3 w-3 mr-1" />Berhasil</Badge>;
    case "PARTIAL":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="h-3 w-3 mr-1" />Sebagian</Badge>;
    case "FAILED":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function CalendarView({ runs }: { runs: ScrapeRun[] }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Calendar Data Generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust logic so Monday is first day if desired, but Standard Sunday start is easier
  // Let's stick to standard 0=Sunday

  const days = [];
  // Padding for empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Group runs by date (using scraped_at for when it happened, or we can use scrape_date if that's the semantic date)
  // The requirement is "riwayat", so "scraped_at" (when the job ran) is usually better for history logs.
  const runsByDate: Record<string, ScrapeRun[]> = {};
  runs.forEach(run => {
    if (run.scraped_at) {
      const dateStr = run.scraped_at.split("T")[0]; // YYYY-MM-DD
      if (!runsByDate[dateStr]) runsByDate[dateStr] = [];
      runsByDate[dateStr].push(run);
    }
  });

  const selectedRunData = selectedDate ? (runsByDate[selectedDate] || []) : [];

  const monthName = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="w-full md:w-1/2 lg:w-2/5 shrink-0">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg capitalize">{monthName}</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                <div key={day} className="text-xs font-medium text-neutral-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasRuns = runsByDate[dateStr]?.length > 0;
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === today.toISOString().split("T")[0];

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                                            h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-all
                                            ${isSelected ? "bg-neutral-900 text-white shadow-md scale-105 z-10" : "hover:bg-neutral-100 text-neutral-700"}
                                            ${isToday && !isSelected ? "bg-blue-50 text-blue-600 font-bold border border-blue-100" : ""}
                                        `}
                  >
                    <span className="text-sm">{day}</span>
                    {hasRuns && (
                      <div className="flex gap-0.5 mt-0.5">
                        {runsByDate[dateStr].slice(0, 3).map((r, i) => (
                          <span key={i} className={`h-1.5 w-1.5 rounded-full ${getStatusColor(r.status)}`} />
                        ))}
                        {runsByDate[dateStr].length > 3 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="flex-1">
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden h-full min-h-[400px]">
            <div className="px-6 py-4 border-b bg-neutral-50/50">
              <h3 className="font-display font-bold text-lg">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : "Pilih Tanggal"}
              </h3>
              <p className="text-sm text-neutral-500">
                {selectedDate
                  ? `${selectedRunData.length} aktivitas scraping ditemukan`
                  : "Klik tanggal di kalender untuk melihat riwayat aktivitas"}
              </p>
            </div>

            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                <Clock className="h-12 w-12 mb-4 opacity-20" />
                <p>Belum ada tanggal dipilih</p>
              </div>
            ) : selectedRunData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400">
                <p>Tidak ada aktivitas pada tanggal ini</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRunData.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">
                        {run.scraped_at ? new Date(run.scraped_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {run.route.replace("-", " → ")}
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{run.total_records}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
