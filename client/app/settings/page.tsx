"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Clock, Database, Loader2, Save } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface SettingsData {
    scrape_delay: number;
    schedule_time: string;
    end_date: string;
    citilink_token: string;
    max_retry: number;
    db_status: string;
    db_total_records: number;
    db_total_runs: number;
}

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<SettingsData>({
        scrape_delay: 0.5,
        schedule_time: "07:30",
        end_date: "",
        citilink_token: "",
        max_retry: 3,
        db_status: "Checking...",
        db_total_records: 0,
        db_total_runs: 0,
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
    });
    const [changingPassword, setChangingPassword] = useState(false);


    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/settings");
            setFormData(res.data);
        } catch (err) {
            console.error("Failed to fetch settings", err);
            toast.error("Gagal memuat pengaturan.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: type === "number" ? parseFloat(value) : value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send editable fields
            const payload = {
                scrape_delay: formData.scrape_delay,
                schedule_time: formData.schedule_time,
                end_date: formData.end_date,
                citilink_token: formData.citilink_token.includes("***") ? undefined : formData.citilink_token, // Don't send masked token
                max_retry: formData.max_retry,
            };

            await api.put("/api/settings", payload);
            toast.success("Pengaturan berhasil disimpan!");
            // Refresh to get updated masked token if changed
            fetchSettings();
        } catch (err) {
            console.error("Failed to save settings", err);
            toast.error("Gagal menyimpan pengaturan.");
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            toast.error("Mohon isi semua field password");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }

        setChangingPassword(true);
        try {
            await api.patch("/api/auth/password", {
                old_password: passwordData.oldPassword,
                new_password: passwordData.newPassword,
            });
            toast.success("Password berhasil diubah!");
            setPasswordData({ oldPassword: "", newPassword: "" });
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Gagal mengubah password");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {

        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-display font-bold">Pengaturan</h1>
                <p className="text-sm text-neutral-500 mt-1">Konfigurasi sistem dan preferensi</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Security Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <SettingsIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold">Keamanan</h3>
                            <p className="text-sm text-neutral-500">Ubah password akun</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="old_password">Password Lama</Label>
                            <Input
                                id="old_password"
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Password Baru</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={changingPassword}
                            variant="secondary"
                            className="w-full mt-2"
                        >
                            {changingPassword ? "Memproses..." : "Ganti Password"}
                        </Button>
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
                            <p className="text-sm text-neutral-500">Pengaturan scraping engine</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="max_retry">Max Retry Attempts</Label>
                            <Input
                                id="max_retry"
                                type="number"
                                value={formData.max_retry}
                                onChange={handleChange}
                                className="max-w-[120px]"
                            />
                            <p className="text-xs text-neutral-500">Jumlah percobaan ulang jika scraping gagal</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scrape_delay">Delay Between Requests (seconds)</Label>
                            <Input
                                id="scrape_delay"
                                type="number"
                                step="0.1"
                                value={formData.scrape_delay}
                                onChange={handleChange}
                                className="max-w-[120px]"
                            />
                            <p className="text-xs text-neutral-500">Jeda antar request untuk menghindari rate limiting</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="citilink_token">Citilink Token (JWT)</Label>
                            <Input
                                id="citilink_token"
                                type="text"
                                value={formData.citilink_token}
                                onChange={handleChange}
                                placeholder="Paste new token here..."
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-neutral-500">Token auth untuk scraping Citilink (dari browser)</p>
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
                            <Label htmlFor="schedule_time">Waktu Scraping Harian</Label>
                            <Input
                                id="schedule_time"
                                type="time"
                                value={formData.schedule_time}
                                onChange={handleChange}
                                className="max-w-[120px]"
                            />
                            <p className="text-xs text-neutral-500">Waktu menjalankan scraping terjadwal</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Input type="text" defaultValue="Asia/Jakarta" readOnly className="max-w-[200px] bg-neutral-50 dark:bg-neutral-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">Tanggal Akhir Monitoring</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="max-w-[180px]"
                            />
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
                            <span className="text-sm font-medium text-green-600">{formData.db_status}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Total Flight Records</span>
                            <span className="text-sm font-mono font-medium">{formData.db_total_records.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <span className="text-sm text-neutral-500">Total Scrape Runs</span>
                            <span className="text-sm font-mono font-medium">{formData.db_total_runs.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end pb-8">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="font-bold shadow-lg shadow-neutral-200 hover:shadow-xl transition-all active:scale-95 dark:shadow-none min-w-[150px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Pengaturan
                        </>
                    )}
                </Button>
            </div>
        </>
    );
}
