"use client";

import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Clock, Database } from "lucide-react";

export default function Settings() {
    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Pengaturan</h1>
                <p className="text-sm text-neutral-500 mt-1">Konfigurasi sistem dan preferensi</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Notification Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Bell className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Notifikasi</h3>
                            <p className="text-sm text-neutral-500">Pengaturan pemberitahuan</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <div>
                                <Label className="font-medium">Email Notification</Label>
                                <p className="text-xs text-neutral-500">Kirim notifikasi ke email saat ada perubahan harga signifikan</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                    </div>
                </div>

                {/* System Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <SettingsIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Sistem</h3>
                            <p className="text-sm text-neutral-500">Pengaturan sistem scraping</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="retry">Max Retry Attempts</Label>
                            <Input id="retry" type="number" defaultValue={3} className="max-w-[120px]" />
                            <p className="text-xs text-neutral-500">Jumlah percobaan ulang jika scraping gagal</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="delay">Delay Between Requests (ms)</Label>
                            <Input id="delay" type="number" defaultValue={1000} className="max-w-[120px]" />
                            <p className="text-xs text-neutral-500">Jeda antar request untuk menghindari rate limiting</p>
                        </div>
                    </div>
                </div>

                {/* Schedule Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Clock className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Jadwal</h3>
                            <p className="text-sm text-neutral-500">Pengaturan jadwal scraping otomatis</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Waktu Scraping Harian</Label>
                            <Input id="time" type="time" defaultValue="07:30" className="max-w-[120px]" />
                            <p className="text-xs text-neutral-500">Waktu menjalankan scraping terjadwal setiap hari</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tz">Timezone</Label>
                            <Input id="tz" type="text" defaultValue="Asia/Jakarta" readOnly className="max-w-[200px] bg-neutral-50 dark:bg-neutral-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">Tanggal Akhir Monitoring</Label>
                            <Input id="end" type="date" defaultValue="2026-03-31" className="max-w-[180px]" />
                            <p className="text-xs text-neutral-500">Scraping akan berhenti setelah tanggal ini</p>
                        </div>
                    </div>
                </div>

                {/* Database Info */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Database className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Database</h3>
                            <p className="text-sm text-neutral-500">Informasi penyimpanan data</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Status</span>
                            <span className="text-sm font-medium text-green-600">Connected</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Total Records</span>
                            <span className="text-sm font-mono font-medium">15,248</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Database Size</span>
                            <span className="text-sm font-mono font-medium">42.5 MB</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Last Backup</span>
                            <span className="text-sm font-medium">Hari ini, 03:00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end pb-8">
                <Button className="font-bold shadow-lg shadow-neutral-200 hover:shadow-xl transition-all active:scale-95 dark:shadow-none">
                    Simpan Pengaturan
                </Button>
            </div>
        </AppLayout>
    );
}
