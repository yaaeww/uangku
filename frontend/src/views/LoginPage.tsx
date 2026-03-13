import React, { useState } from 'react';
import { AuthController } from '../controllers/AuthController';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Loader2, ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const setAuth = useAuthStore((state) => state.setAuth);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'id' ? 'en' : 'id';
        i18n.changeLanguage(newLang);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { token, user, family_name } = await AuthController.login(email, password, rememberMe);

            // Map snake_case to camelCase for frontend consistency
            const mappedUser = {
                ...user,
                fullName: user.full_name,
                phoneNumber: user.phone_number,
                familyName: family_name || ''
            };

            setAuth(mappedUser, token);

            if (user.role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate(`/${encodeURIComponent(family_name)}/dashboard`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal masuk. Silakan periksa kredensial Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dagang-cream text-dagang-dark font-sans flex flex-col md:flex-row">
            {/* Left Panel - Branding */}
            <div className="hidden md:flex md:w-[40%] bg-dagang-dark p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-dagang-green/20 blur-[120px] rounded-full" />

                <div className="logo font-serif text-2xl text-white relative z-10">
                    Uang<span className="text-dagang-accent">ku</span>
                </div>

                <div className="relative z-10">
                    <h2 className="font-serif text-[42px] text-white leading-tight mb-6">
                        Selamat Datang <br />Kembali di <span className="text-dagang-green italic">Kenyamanan.</span>
                    </h2>
                    <p className="text-white/40 text-lg max-w-sm mb-10 leading-relaxed">
                        Pantau pengeluaran, capai target tabungan, dan tumbuhkan kekayaan keluarga Anda bersama-sama.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-dagang-green group-hover:bg-dagang-green group-hover:text-white transition-all">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-white/70">Keamanan data keluarga terjamin dengan enkripsi SSL.</div>
                        </div>
                    </div>
                </div>

                <div className="text-[12px] text-white/20 relative z-10">
                    © 2026 Uangku Platform. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 p-6 md:p-12 lg:p-[100px] flex flex-col justify-center bg-dagang-cream relative">
                <div className="absolute top-6 right-6 md:top-12 md:right-12">
                    <button
                        onClick={toggleLanguage}
                        className="p-2.5 rounded-full bg-white border border-black/5 text-dagang-gray hover:text-dagang-green transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase">{i18n.language}</span>
                    </button>
                </div>

                <div className="max-w-[420px] mx-auto w-full">
                    <div className="mb-10">
                        <a href="/" className="inline-flex items-center gap-2 text-dagang-gray text-xs font-semibold hover:text-dagang-green transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" /> BERALIH KE BERANDA
                        </a>
                        <h1 className="font-serif text-[42px] mb-2 leading-none">Masuk Akun</h1>
                        <p className="text-dagang-gray text-sm">
                            Belum punya akun keluarga? <a href="/register" className="text-dagang-green font-bold hover:underline">Mulai Trial Gratis</a>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                                <span className="text-[16px]">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-dagang-dark/70 tracking-wide uppercase">Alamat Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dagang-gray/40 group-focus-within:text-dagang-green transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white border-1.5 border-black/5 rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none shadow-sm"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-bold text-dagang-dark/70 tracking-wide uppercase">Kata Sandi</label>
                                <a href="#" className="text-[12px] font-bold text-dagang-green hover:underline">Lupa Password?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dagang-gray/40 group-focus-within:text-dagang-green transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white border-1.5 border-black/5 rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-1">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-[18px] h-[18px] accent-dagang-green rounded-lg cursor-pointer"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember" className="text-[13px] text-dagang-gray font-medium cursor-pointer">Ingat saya di perangkat ini</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-dagang-green/10 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Masuk ke Dashboard
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-1.5 grayscale">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-widest uppercase">Safe & Secure</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);
