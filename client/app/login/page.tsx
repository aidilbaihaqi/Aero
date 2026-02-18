"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import GuestLayout from "@/components/layout/guest-layout";
import { toast } from "sonner"; // Using sonner for toasts

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {}
    );

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!formData.email) {
            newErrors.email = "Email wajib diisi";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Format email tidak valid";
        }

        if (!formData.password) {
            newErrors.password = "Password wajib diisi";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password minimal 6 karakter";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Save to localStorage
            localStorage.setItem(
                "user",
                JSON.stringify({
                    email: formData.email,
                    name: formData.email.split("@")[0],
                    authenticated: true,
                })
            );

            toast.success("Login Berhasil", {
                description: "Mengalihkan ke dashboard...",
            });

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (error) {
            setErrors({ email: "Gagal masuk, silakan coba lagi." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
                {/* Login Card */}
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black dark:bg-white">
                            <Plane className="h-8 w-8 -rotate-45 text-white dark:text-black" />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
                            Aero
                        </h1>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Pantau Harga Tiket Pesawat
                        </p>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                        <h2 className="mb-6 text-center font-display text-2xl font-bold text-neutral-900 dark:text-white">
                            Masuk ke Akun Anda
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <Label
                                    htmlFor="email"
                                    className="text-neutral-700 dark:text-neutral-300"
                                >
                                    Email
                                </Label>
                                <div className="relative mt-1.5">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="nama@email.com"
                                        className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-white"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <Label
                                    htmlFor="password"
                                    className="text-neutral-700 dark:text-neutral-300"
                                >
                                    Password
                                </Label>
                                <div className="relative mt-1.5">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                password: e.target.value,
                                            })
                                        }
                                        placeholder="Masukkan password"
                                        className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-11 text-sm outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.remember}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                remember: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-2 focus:ring-black/20"
                                    />
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                        Ingat saya
                                    </span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-xl bg-black font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Masuk"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
