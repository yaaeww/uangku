import React, { useState } from 'react';
import { AuthController } from '../controllers/AuthController';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await AuthController.forgotPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            setError('Gagal mengirim email reset. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dagang-cream flex flex-col justify-center p-6">
            <div className="max-w-[420px] mx-auto w-full bg-white p-8 md:p-10 rounded-[32px] shadow-xl shadow-black/5">
                <a href="/login" className="inline-flex items-center gap-2 text-dagang-gray text-xs font-semibold hover:text-dagang-green transition-colors mb-8 uppercase tracking-wider">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                </a>

                {!submitted ? (
                    <>
                        <h1 className="font-serif text-[32px] mb-2">Lupa Password?</h1>
                        <p className="text-dagang-gray text-sm mb-8">
                            Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan instruksi untuk reset password.
                        </p>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-dagang-dark/70 uppercase">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dagang-gray/40 group-focus-within:text-dagang-green transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-white border-1.5 border-black/5 rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 outline-none shadow-sm"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-base font-bold shadow-lg hover:bg-dagang-green-light transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Link Reset'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-serif mb-3">Email Terkirim!</h2>
                        <p className="text-dagang-gray mb-8">
                            Jika email <strong>{email}</strong> terdaftar, Anda akan segera menerima link untuk mereset password.
                        </p>
                        <a href="/login" className="block w-full py-4.5 bg-dagang-dark text-white rounded-2xl text-base font-bold hover:bg-black transition-all">
                            Kembali ke Login
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
