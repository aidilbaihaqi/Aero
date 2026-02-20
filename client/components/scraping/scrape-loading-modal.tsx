"use client";

import { useEffect, useState, useRef } from "react";
import { Plane, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Custom Modal Component since we want specific styling/animation
// and to avoid dependency issues if Dialog isn't fully set up with Radix
export function ScrapeLoadingModal({
  isOpen,
  isLoading,
  error,
  stats,
  onClose,
}: {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  stats: any | null; // using any for flexibility or define interface
  onClose: () => void;
}) {
  // Fake progress for visual feedback
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.random() * 2;
          return next > 90 ? 90 : next;
        });
      }, 500);
    } else if (!isLoading && isOpen) {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all p-0 mx-4">

        {/* Header / Sky Background */}
        <div className="h-32 bg-gradient-to-br from-sky-500 to-blue-600 relative overflow-hidden">
          {/* Clouds / Decor */}
          <div className="absolute top-10 left-10 h-8 w-20 bg-white/20 rounded-full blur-xl"></div>
          <div className="absolute top-5 right-20 h-12 w-32 bg-white/20 rounded-full blur-xl"></div>

          {/* Plane Animation Container */}
          {isLoading && (
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2">
              <div className="relative w-full h-12">
                <Plane className="absolute text-white h-8 w-8 animate-[fly_3s_linear_infinite]" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-10 text-center relative">
          {/* Status Icon Badge */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white">
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            ) : error ? (
              <XCircle className="h-10 w-10 text-red-500" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
          </div>

          <h2 className="mt-2 text-xl font-display font-bold text-neutral-900">
            {isLoading
              ? "Sedang Mengambil Data..."
              : error
                ? "Gagal Mengambil Data"
                : "Scraping Selesai!"}
          </h2>

          <p className="mt-2 text-sm text-neutral-500 mb-6">
            {isLoading
              ? "Sistem sedang menghubungi maskapai untuk update harga terbaru. Mohon tunggu sebentar."
              : error
                ? "Terjadi kesalahan saat menghubungi server."
                : "Data harga penerbangan berhasil diperbarui."}
          </p>

          {/* Progress Bar (Loading) */}
          {isLoading && (
            <div className="w-full space-y-2 mb-6">
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Memproses rute...</span>
                <span>Estimasi: ~1-2 menit</span>
              </div>
            </div>
          )}

          {/* Stats Grid (Success) */}
          {!isLoading && !error && stats && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-100">
                <div className="text-xs text-neutral-400 font-medium uppercase">Rute</div>
                <div className="text-xl font-bold text-neutral-900">{stats.route_count ?? 0}</div>
              </div>
              <div className="rounded-xl bg-green-50 p-3 border border-green-100">
                <div className="text-xs text-green-600 font-medium uppercase">Sukses</div>
                <div className="text-xl font-bold text-green-700">{stats.success_count ?? 0}</div>
              </div>
              <div className="rounded-xl bg-red-50 p-3 border border-red-100">
                <div className="text-xs text-red-600 font-medium uppercase">Gagal</div>
                <div className="text-xl font-bold text-red-700">{stats.error_count ?? 0}</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isLoading && error && (
            <div className="w-full mb-6 rounded-xl bg-red-50 p-3 text-left border border-red-100 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div className="text-xs text-red-700">{error}</div>
            </div>
          )}

          {/* Buttons */}
          {!isLoading && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Tutup
              </Button>
              {!error && (
                <Button className="flex-1 bg-neutral-900 hover:bg-neutral-800" asChild>
                  <Link href="/history">
                    Lihat Detail <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
                @keyframes fly {
                    0% { transform: translateX(-20px) translateY(2px) rotate(5deg); opacity: 0; }
                    10% { opacity: 1; }
                    50% { transform: translateX(150px) translateY(-5px) rotate(0deg); }
                    90% { opacity: 1; }
                    100% { transform: translateX(350px) translateY(5px) rotate(-5deg); opacity: 0; }
                }
            `}</style>
    </div>
  );
}
