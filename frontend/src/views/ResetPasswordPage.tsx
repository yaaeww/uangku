import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthController } from '../controllers/AuthController';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }
        if (!token) {
            setError('Token tidak valid atau sudah kadaluarsa');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await AuthController.resetPassword({ token, new_password: password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dagang-cream flex flex-col justify-center p-6">
            <div className="max-w-[420px] mx-auto w-full bg-white p-8 md:p-10 rounded-[32px] shadow-xl shadow-black/5">
                {!success ? (
                    <>
                        <h1 className="font-serif text-[32px] mb-2 leading-tight">Buat Password Baru</h1>
                        <p className="text-dagang-gray text-sm mb-8">
                            Masukkan password baru Anda di bawah ini untuk mengamankan akun.
                        </p>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-dagang-dark/70 uppercase">Password Baru</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dagang-gray/40 group-focus-within:text-dagang-green transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-4 py-4 bg-white border-1.5 border-black/5 rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 outline-none"
                                        placeholder="Min. 8 karakter"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-dagang-dark/70 uppercase">Ulangi Password Baru</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dagang-gray/40 group-focus-within:text-dagang-green transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-white border-1.5 border-black/5 rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 outline-none"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-base font-bold shadow-lg hover:bg-dagang-green-light transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-serif mb-3">Password Diperbarui!</h2>
                        <p className="text-dagang-gray mb-8">
                            Password Anda telah berhasil diubah. Mengalihkan Anda ke halaman login...
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
