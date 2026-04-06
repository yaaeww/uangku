import React, { useState } from 'react';
import { User, Shield, Lock, Phone, Mail, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AuthController } from '../../controllers/AuthController';

export const SettingsView: React.FC = () => {
    const user = useAuthStore(state => state.user);
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || (user as any)?.full_name || '',
        phoneNumber: user?.phoneNumber || (user as any)?.phone_number || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [forgotPwData, setForgotPwData] = useState({
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isForgotPwMode, setIsForgotPwMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const setUser = useAuthStore(state => state.setUser);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            const response = await AuthController.updateProfile({
                full_name: profileData.fullName,
                phone_number: profileData.phoneNumber
            });
            
            if (response.user) {
                // Real-time sync with global store
                setUser(response.user);
                
                // Update local form state to ensure naming conventions match
                setProfileData({
                    fullName: response.user.fullName || response.user.full_name,
                    phoneNumber: response.user.phoneNumber || response.user.phone_number
                });
            }

            setStatus({ type: 'success', message: 'Profil berhasil diperbarui!' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Gagal memperbarui profil' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setStatus({ type: 'error', message: 'Konfirmasi password tidak cocok' });
            return;
        }

        setLoading(true);
        setStatus(null);
        try {
            await AuthController.updatePassword({
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword
            });
            setStatus({ type: 'success', message: 'Password berhasil diubah!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Gagal mengubah password' });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async () => {
        setLoading(true);
        setStatus(null);
        try {
            if (user?.email) {
                await AuthController.requestResetOTP(user.email);
                setOtpSent(true);
                setStatus({ type: 'success', message: 'Kode OTP telah dikirim!' });
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Gagal mengirim OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetWithOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (forgotPwData.newPassword !== forgotPwData.confirmPassword) {
            setStatus({ type: 'error', message: 'Konfirmasi password tidak cocok' });
            return;
        }

        setLoading(true);
        setStatus(null);
        try {
            await AuthController.resetWithOTP({
                email: user?.email,
                otp: forgotPwData.otp,
                new_password: forgotPwData.newPassword
            });
            setStatus({ type: 'success', message: 'Password berhasil direset!' });
            setIsForgotPwMode(false);
            setOtpSent(false);
            setForgotPwData({ otp: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Gagal mereset password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-[32px] font-serif leading-tight text-[var(--text-main)]">Pengaturan</h2>
                <p className="text-[var(--text-muted)] opacity-80 text-sm mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-red-500/10 text-red-500'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{status.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Section */}
                <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-main)]">Data Diri</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                                <input
                                    type="text"
                                    value={profileData.fullName}
                                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Nomor WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                                <input
                                    type="text"
                                    value={profileData.phoneNumber}
                                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Email (Tidak dapat diubah)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-20" />
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none font-bold text-sm text-[var(--text-muted)] opacity-60"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>

                {/* Security Section */}
                <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-main)]">Keamanan</h3>
                    </div>

                    {!isForgotPwMode ? (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Password Sekarang</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Password Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Konfirmasi Password Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-[var(--accent)] text-black rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/10 disabled:opacity-50"
                                >
                                    {loading ? 'Mengubah...' : 'Ganti Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPwMode(true);
                                        setStatus(null);
                                    }}
                                    className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest hover:text-[var(--text-main)] transition-all"
                                >
                                    Lupa Password? Reset via OTP
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {!otpSent ? (
                                <div className="text-center space-y-4 py-4">
                                    <p className="text-sm text-[var(--text-muted)] opacity-70 italic leading-relaxed">
                                        Kode OTP akan dikirimkan ke Email dan WhatsApp Anda yang terdaftar ({user?.email}).
                                    </p>
                                    <button
                                        onClick={handleRequestOTP}
                                        disabled={loading}
                                        className="w-full py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/10 disabled:opacity-50"
                                    >
                                        {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                                    </button>
                                    <button
                                        onClick={() => setIsForgotPwMode(false)}
                                        className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest"
                                    >
                                        Kembali
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleResetWithOTP} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Kode OTP</label>
                                        <input
                                            type="text"
                                            value={forgotPwData.otp}
                                            onChange={(e) => setForgotPwData({ ...forgotPwData, otp: e.target.value })}
                                            placeholder="Masukan 6 digit OTP"
                                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-center tracking-[0.5em] text-lg text-[var(--text-main)]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Password Baru</label>
                                        <input
                                            type="password"
                                            value={forgotPwData.newPassword}
                                            onChange={(e) => setForgotPwData({ ...forgotPwData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            value={forgotPwData.confirmPassword}
                                            onChange={(e) => setForgotPwData({ ...forgotPwData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-sm text-[var(--text-main)]"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 bg-[var(--primary)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/10"
                                    >
                                        {loading ? 'Mereset...' : 'Reset Password Sekarang'}
                                    </button>
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleRequestOTP}
                                            className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 hover:underline"
                                        >
                                            <RefreshCcw className="w-3 h-3" /> Kirim Ulang OTP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOtpSent(false)}
                                            className="text-[10px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
