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
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthController } from '../controllers/AuthController';
import { PricingSection } from '../components/PricingSection';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/common/Logo';
import { useTranslation } from 'react-i18next';

export const RegisterPage = () => {
    const { t } = useTranslation();
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
    const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [resendLimit, setResendLimit] = useState(60);

    useEffect(() => {
        // Restore registration state from localStorage
        const savedData = localStorage.getItem('uangku_pending_reg');
        let restoredFromStorage = false;
        if (savedData) {
            const parsed = JSON.parse(savedData);
            const now = new Date().getTime();
            const expiry = new Date(parsed.otpExpiresAt).getTime();
            
            if (expiry > now) {
                setFormData(parsed.formData);
                setOtpExpiresAt(parsed.otpExpiresAt);
                setStep(3);
                setTimeLeft(Math.floor((expiry - now) / 1000));
                restoredFromStorage = true;
                
                // Restore cooldown if applicable
                if (parsed.cooldownExpiresAt) {
                    const cdExpiry = new Date(parsed.cooldownExpiresAt).getTime();
                    if (cdExpiry > now) {
                        setResendCooldown(Math.floor((cdExpiry - now) / 1000));
                    }
                }
            } else {
                localStorage.removeItem('uangku_pending_reg');
            }
        }

        const fetchInvitation = async () => {
            if (invitationId && !restoredFromStorage) {
                setStep(2); // Skip pricing if they have an invite
                setFormData(prev => ({ ...prev, selectedPlan: 'trial_link' }));
                
                try {
                    const inv = await AuthController.getInvitation(invitationId);
                    setFormData(prev => ({ 
                        ...prev, 
                        familyName: inv.family_name,
                        email: inv.email,
                        fullName: inv.full_name || prev.fullName,
                        phoneNumber: inv.phone_number || prev.phoneNumber
                    }));

                    // If user already exists but not verified, skip to OTP step
                    if (inv.is_user_exists && !inv.is_verified) {
                        setStep(3);
                        // We don't have the expiry yet, but the user can click Resend if expired
                    }
                } catch (err) {
                    console.error("Failed to fetch invitation details", err);
                }
            }
        };
        fetchInvitation();

        // Fetch settings (trial duration & resend cooldown)
        const fetchSettings = async () => {
            try {
                const settings = await AuthController.getPublicSettings();
                setTrialDays(settings.trial_duration_days || '7');
                if (settings.resend_otp_duration) {
                    setResendLimit(parseInt(settings.resend_otp_duration));
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, [invitationId]);
    const [otp, setOtp] = useState('');

    // Timer Effect (OTP Expiry & Resend Cooldown)
    useEffect(() => {
        let interval: any;
        if (step === 3) {
            interval = setInterval(() => {
                const now = new Date().getTime();
                
                // OTP Expiry Timer
                if (otpExpiresAt) {
                    const expiry = new Date(otpExpiresAt).getTime();
                    const distance = Math.floor((expiry - now) / 1000);
                    setTimeLeft(distance > 0 ? distance : 0);
                }

                // Resend Cooldown Timer
                setResendCooldown(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, otpExpiresAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.register.passwordMismatch'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await AuthController.register({
                email: formData.email,
                phone_number: formData.phoneNumber,
                password: formData.password,
                full_name: formData.fullName,
                family_name: formData.familyName,
                selected_plan: formData.selectedPlan,
                invitation_id: invitationId || ''
            });
            
            setOtpExpiresAt(response.otp_expires_at);
            setStep(3);
            setResendCooldown(resendLimit);
            
            // Save to localStorage for persistence
            localStorage.setItem('uangku_pending_reg', JSON.stringify({
                formData,
                otpExpiresAt: response.otp_expires_at,
                step: 3,
                cooldownExpiresAt: new Date(new Date().getTime() + resendLimit * 1000).toISOString()
            }));
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.register.registerFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (loading || resendCooldown > 0) return;
        setLoading(true);
        setError('');
        try {
            const response = await AuthController.resendOTP(formData.email);
            setOtpExpiresAt(response.otp_expires_at);
            setResendCooldown(resendLimit);
            setOtp(''); // Clear previous OTP input
            
            // Update localStorage
            const savedData = localStorage.getItem('uangku_pending_reg');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                parsed.otpExpiresAt = response.otp_expires_at;
                parsed.cooldownExpiresAt = new Date(new Date().getTime() + resendLimit * 1000).toISOString();
                localStorage.setItem('uangku_pending_reg', JSON.stringify(parsed));
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Gagal mengirim ulang kode");
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
            localStorage.removeItem('uangku_pending_reg');
            
            // Auto redirect after 2 seconds
            setTimeout(() => {
                navigate(`/${encodeURIComponent(family_name || formData.familyName)}/dashboard`);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.register.otpInvalid'));
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
 
                <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity relative z-10 mb-12 md:mb-0">
                    <Logo variant="horizontal" />
                </Link>
 
                <div className="relative z-10 mb-12 md:mb-0">
                    <h2 className="font-serif text-[28px] sm:text-[36px] md:text-[42px] text-white leading-[1.15] mb-4">
                        {t('auth.register.heroTitlePrefix')} <em className="text-dagang-accent not-italic font-serif italic">{t('auth.register.heroTitleHighlight')}</em>
                    </h2>
                    <p className="text-white/55 text-[14px] md:text-[15px] leading-relaxed mb-6 md:mb-9">
                        {t('auth.register.heroSubtitle')}
                    </p>
 
                    <div className="flex flex-col gap-3 md:gap-4">
                        {(t('auth.register.features', { returnObjects: true }) as string[]).map((text, i) => (
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
                        <strong className="block text-[14px] md:text-[15px] text-white mb-0.5">{t('auth.register.trialTitle', { days: trialDays })}</strong>
                        {t('auth.register.trialDesc')}
                    </div>
                </div>
            </div>
 
            {/* Right Panel - Form */}
            <div className="flex-1 p-6 sm:p-12 md:p-[64px] flex flex-col justify-center bg-dagang-cream">
                <div className="max-w-[540px] mx-auto w-full">
                    {step < 3 && (
                        <a href="/" className="inline-flex items-center gap-2 text-dagang-gray text-sm hover:text-dagang-green transition-colors mb-12">
                            <ArrowLeft className="w-4 h-4" /> {t('auth.register.backToHome')}
                        </a>
                    )}

                    <div className="mb-10">
                        <h1 className="font-serif text-[32px] sm:text-[38px] mb-2 leading-tight">{t('auth.register.heading')}</h1>
                        <p className="text-dagang-gray text-sm">
                            {t('auth.register.haveAccount')} <a href="/login" className="text-dagang-green font-semibold hover:underline">{t('auth.register.loginHere')}</a>
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
                        {(t('auth.register.steps', { returnObjects: true }) as string[]).map((label, i) => {
                            const num = i + 1;
                            return (
                            <Fragment key={num}>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step === num ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20' : step > num ? 'bg-dagang-green/10 text-dagang-green' : 'bg-black/5 text-dagang-gray'}`}>
                                        {step > num ? '✓' : num}
                                    </div>
                                    <div className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${step === num ? 'text-dagang-green' : 'text-dagang-gray'}`}>
                                        {label}
                                    </div>
                                </div>
                                {num < 4 && (
                                    <div className={`h-[1px] w-4 sm:w-8 flex-shrink-0 ${step > num ? 'bg-dagang-green' : 'bg-black/10'}`} />
                                )}
                            </Fragment>
                        )})}
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
                                                {t('auth.register.newFamilyBtn')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* ... (rest of step 2 fields) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.fullName')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="text" placeholder={t('auth.register.fullNamePlaceholder')} value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.whatsapp')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="tel" placeholder={t('auth.register.whatsappPlaceholder')} value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.email')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                    <input required type="email" placeholder={t('auth.register.emailPlaceholder')} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.password')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="password" placeholder={t('auth.register.passwordPlaceholder')} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.confirmPassword')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input required type="password" placeholder={t('auth.register.confirmPasswordPlaceholder')} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-1.5 border-black/10 rounded-xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-dagang-green-pale border border-dagang-green/15 rounded-[16px] p-6 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-dagang-green">
                                    <Home className="w-4 h-4" /> {t('auth.register.familyData')}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-dagang-dark">{t('auth.register.familyName')} {!invitationId && <span className="text-red-500">*</span>}</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/60" />
                                        <input 
                                            required={!invitationId} 
                                            disabled={!!invitationId}
                                            type="text" 
                                            placeholder={invitationId ? t('auth.register.autoSetByInviter') : t('auth.register.familyPlaceholder')} 
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
                                        {t('auth.register.submitBtn')}
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
                                <h2 className="text-xl font-bold">{t('auth.register.verifyHeading')}</h2>
                                <p className="text-dagang-gray text-sm mt-2">
                                    {t('auth.register.verifyDescP1')}<strong>{formData.email}</strong>{t('auth.register.verifyDescP2')}<strong>WhatsApp ({formData.phoneNumber})</strong>
                                </p>
                                {timeLeft > 0 ? (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-dagang-green/5 text-dagang-green rounded-full text-sm font-bold border border-dagang-green/10">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Kode berakhir dalam: {formatTime(timeLeft)}
                                    </div>
                                ) : (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-100">
                                        Kode telah kadaluarsa
                                    </div>
                                )}
                            </div>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-dagang-dark text-center block uppercase tracking-wider">{t('auth.register.enterCode')}</label>
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
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.register.verifyBtn')}
                            </button>
                            <p className="text-center text-[13px] text-dagang-gray">
                                {t('auth.register.noCode')}
                                <button 
                                    type="button" 
                                    disabled={loading || resendCooldown > 0}
                                    onClick={handleResendOTP}
                                    className={`ml-1 font-bold ${resendCooldown > 0 ? 'text-dagang-gray cursor-not-allowed' : 'text-dagang-green hover:underline'}`}
                                >
                                    {resendCooldown > 0 
                                        ? `Coba lagi dalam ${resendCooldown} detik` 
                                        : t('auth.register.resend')}
                                </button>
                                {timeLeft === 0 && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            localStorage.removeItem('uangku_pending_reg');
                                            setStep(2);
                                            setOtpExpiresAt(null);
                                            setError('');
                                        }}
                                        className="block mx-auto mt-4 text-[11px] text-dagang-gray hover:text-dagang-dark underline uppercase tracking-widest"
                                    >
                                        Reset Pendaftaran
                                    </button>
                                )}
                            </p>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-serif mb-3">{t('auth.register.welcomeHeading')}</h2>
                            <p className="text-dagang-gray mb-8">{t('auth.register.welcomeDesc')}</p>
                            <a href="/login" className="block w-full py-4.5 bg-dagang-dark text-white rounded-xl text-base font-bold hover:bg-black transition-all">
                                {t('auth.register.goToPortal')}
                            </a>
                        </div>
                    )}

                    <div className="text-center text-[12px] text-dagang-gray flex items-center justify-center gap-1.5 mt-8">
                        <ShieldCheck className="w-3.5 h-3.5" /> {t('auth.register.secureData')}
                    </div>
                </div>
            </div>
        </div>
    );
};
