import {
    User,
    Mail,
    Lock,
    Phone,
    Home,
    CheckCircle2,
    ArrowLeft,
    ChevronRight,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import React, { useState, Fragment, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthController } from '../controllers/AuthController';
import { PricingSection } from '../components/PricingSection';
import { useAuthStore } from '../store/authStore';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [searchParams] = useSearchParams();
    const invitationId = searchParams.get('invitation_id');

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [trialDays, setTrialDays] = useState('7');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        familyName: '',
        selectedPlan: ''
    });

    useEffect(() => {
        const fetchInvitation = async () => {
            if (invitationId) {
                setStep(2); // Skip pricing if they have an invite
                setFormData(prev => ({ ...prev, selectedPlan: 'trial_link' }));
                
                try {
                    const inv = await AuthController.getInvitation(invitationId);
                    setFormData(prev => ({ 
                        ...prev, 
                        familyName: inv.family_name,
                        email: inv.email
                    }));
                } catch (err) {
                    console.error("Failed to fetch invitation details", err);
                }
            }
        };
        fetchInvitation();

        // Fetch trial duration from settings
        const fetchSettings = async () => {
            try {
                const settings = await AuthController.getPublicSettings();
                setTrialDays(settings.trial_duration_days || '7');
            } catch (err) {
                console.error("Failed to fetch trial duration", err);
            }
        };
        fetchSettings();
    }, [invitationId]);
    const [otp, setOtp] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await AuthController.register({
                email: formData.email,
                phone_number: formData.phoneNumber,
                password: formData.password,
                full_name: formData.fullName,
                family_name: formData.familyName,
                selected_plan: formData.selectedPlan,
                invitation_id: invitationId || ''
            });
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal registrasi. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { token, user, family_name } = await AuthController.verifyOTP(formData.email, otp);
            
            // Map snake_case to camelCase for frontend consistency
            const mappedUser = {
                ...user,
                fullName: user.full_name,
                phoneNumber: user.phone_number,
                familyName: family_name || ''
            };

            setAuth(mappedUser, token);
            setStep(4);
            
            // Auto redirect after 2 seconds
            setTimeout(() => {
                navigate(`/${encodeURIComponent(family_name || formData.familyName)}/dashboard`);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'OTP tidak valid atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dagang-cream text-dagang-dark font-sans flex flex-col md:flex-row">
            {/* Left Panel - Hero Branding */}
            <div className="w-full md:w-[42%] bg-gradient-to-br from-dagang-dark to-[#1e3d2b] p-10 md:p-[56px] flex flex-col justify-between relative overflow-hidden md:sticky md:top-0 md:h-screen">
                <div className="absolute top-[-100px] right-[-100px] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-dagang-green/30 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-80px] left-[-80px] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-dagang-accent/5 blur-[80px] rounded-full" />
 
                <div className="logo font-serif text-2xl text-white relative z-10 mb-12 md:mb-0">
                    Uang<span className="text-dagang-accent">ku</span>
                </div>
 
                <div className="relative z-10 mb-12 md:mb-0">
                    <h2 className="font-serif text-[28px] sm:text-[36px] md:text-[42px] text-white leading-[1.15] mb-4">
                        Kelola Keuangan Keluarga dengan <em className="text-dagang-accent not-italic font-serif italic">Lebih Bijak</em>
                    </h2>
                    <p className="text-white/55 text-[14px] md:text-[15px] leading-relaxed mb-6 md:mb-9">
                        Bergabunglah bersama ribuan keluarga Indonesia yang sudah menggunakan Uangku untuk mengelola keuangan mereka.
                    </p>
 
                    <div className="flex flex-col gap-3 md:gap-4">
                        {[
                            'Catat transaksi bersama seluruh anggota keluarga',
                            'Budget planning & tabungan tujuan otomatis',
                            'Laporan keuangan visual yang mudah dipahami',
                            'Notifikasi tagihan & pengingat budget'
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3 md:gap-3.5 text-left">
                                <div className="w-6 h-6 md:w-7 md:h-7 bg-dagang-green/30 border border-dagang-green/50 rounded-full flex items-center justify-center text-[#4ade80] text-[10px] md:text-[12px] flex-shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <div className="text-[13px] md:text-sm text-white/70">{text}</div>
                            </div>
                        ))}
                    </div>
                </div>
 
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 md:px-6 flex items-center gap-4 relative z-10">
                    <div className="text-[24px] md:text-[28px]">🎁</div>
                    <div className="text-[12px] md:text-[13px] text-white/70 text-left">
                        <strong className="block text-[14px] md:text-[15px] text-white mb-0.5">Trial {trialDays} Hari Gratis</strong>
                        Akses semua fitur lengkap. Tanpa kartu kredit.
                    </div>
                </div>
            </div>
 
            {/* Right Panel - Form */}
            <div className="flex-1 p-6 sm:p-12 md:p-[64px] flex flex-col justify-center bg-dagang-cream">
                <div className="max-w-[540px] mx-auto w-full">
                    <a href="/" className="inline-flex items-center gap-2 text-dagang-gray text-sm hover:text-dagang-green transition-colors mb-12">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
                    </a>

                    <div className="mb-10">
                        <h1 className="font-serif text-[32px] sm:text-[38px] mb-2 leading-tight">Buat Akun Keluarga</h1>
                        <p className="text-dagang-gray text-sm">
                            Sudah punya akun? <a href="/login" className="text-dagang-green font-semibold hover:underline">Masuk di sini</a>
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
                        {[
                            { num: 1, label: 'Pilih Paket' },
                            { num: 2, label: 'Data Akun' },
                            { num: 3, label: 'Verifikasi' },
                            { num: 4, label: 'Mulai Trial' }
                        ].map((s, i) => (
                            <Fragment key={s.num}>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step === s.num ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20' : step > s.num ? 'bg-dagang-green/10 text-dagang-green' : 'bg-black/5 text-dagang-gray'}`}>
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <div className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${step === s.num ? 'text-dagang-green' : 'text-dagang-gray'}`}>
                                        {s.label}
                                    </div>
                                </div>
                                {i < 3 && (
                                    <div className={`h-[1px] w-4 sm:w-8 flex-shrink-0 ${step > s.num ? 'bg-dagang-green' : 'bg-black/10'}`} />
                                )}
                            </Fragment>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PricingSection
                                selectedPlanId={formData.selectedPlan}
                                onSelectPlan={(id) => {
                                    setFormData({ ...formData, selectedPlan: id });
                                    setStep(2);
                                }}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <form className="space-y-5" onSubmit={handleRegister}>
                            {error && (
                                <div className="space-y-3">
                                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex flex-col gap-2">
                                        <span>{error}</span>
                                        {error.includes('undangan') && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const url = new URL(window.location.href);
                                                    url.searchParams.delete('invitation_id');
                                                    window.location.href = url.pathname;
                                                }}
                                                className="w-fit text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors uppercase tracking-wider"
                                            >
                                                Daftar sebagai Keluarga Baru
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* ... (rest of step 2 fields) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="text" placeholder="Budi Santoso" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">Nomor WhatsApp <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="tel" placeholder="08xxxxxxxxxx" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-dagang-dark">Email <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                    <input required type="email" placeholder="budi@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="password" placeholder="Min. 8 karakter" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">Konfirmasi Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="password" placeholder="Ulangi password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-dagang-green-pale border border-dagang-green/15 rounded-[16px] p-6 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-dagang-green">
                                    <Home className="w-4 h-4" /> Data Keluarga
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">Nama Keluarga {!invitationId && <span className="text-red-500">*</span>}</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input 
                                            required={!invitationId} 
                                            disabled={!!invitationId}
                                            type="text" 
                                            placeholder={invitationId ? "Otomatis diatur pengundang" : "Keluarga Budi"} 
                                            value={formData.familyName} 
                                            onChange={e => setFormData({ ...formData, familyName: e.target.value })} 
                                            className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-dagang-green/20 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none disabled:bg-dagang-gray/5 disabled:text-dagang-gray" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4.5 bg-dagang-green text-white rounded-xl text-base font-bold shadow-lg shadow-dagang-green/20 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 group disabled:opacity-70">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        🚀 Ajukan Join & Mulai Trial Gratis
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form className="space-y-6" onSubmit={handleVerify}>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-dagang-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-dagang-green">
                                    <Mail className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold">Verifikasi Email Anda</h2>
                                <p className="text-dagang-gray text-sm mt-2">Kami telah mengirimkan kode OTP ke <strong>{formData.email}</strong> dan <strong>WhatsApp ({formData.phoneNumber})</strong></p>
                            </div>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-dagang-dark text-center block uppercase tracking-wider">Masukkan 6-Digit Kode</label>
                                <input
                                    required
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                    }}
                                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-white border-1.5 border-black/10 rounded-2xl focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4.5 bg-dagang-green text-white rounded-xl text-base font-bold shadow-lg shadow-dagang-green/20 hover:bg-dagang-green-light transition-all flex items-center justify-center gap-2.5 disabled:opacity-70">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi & Lanjutkan'}
                            </button>
                            <p className="text-center text-[13px] text-dagang-gray">Tidak menerima kode? <button type="button" className="text-dagang-green font-bold hover:underline">Kirim ulang</button></p>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-serif mb-3">Selamat Datang!</h2>
                            <p className="text-dagang-gray mb-8">Permintaan join akun Anda berhasil diajukan dan sedang menunggu verifikasi Super Admin. Akses trial Anda akan aktif segera setelah disetujui.</p>
                            <a href="/login" className="block w-full py-4.5 bg-dagang-dark text-white rounded-xl text-base font-bold hover:bg-black transition-all">
                                Masuk ke Portal DagangFinance
                            </a>
                        </div>
                    )}

                    <div className="text-center text-[12px] text-dagang-gray flex items-center justify-center gap-1.5 mt-8">
                        <ShieldCheck className="w-3.5 h-3.5" /> Data Anda aman dan terenkripsi · SSL Protected
                    </div>
                </div>
            </div>
        </div>
    );
};
