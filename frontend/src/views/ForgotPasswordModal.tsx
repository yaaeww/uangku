import React, { useState } from 'react';
import { Mail, Lock, Loader2, X, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { AuthController } from '../controllers/AuthController';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await AuthController.requestResetOTP(email);
            setMessage(t('auth.forgotPassword.otpSent'));
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.forgotPassword.requestFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await AuthController.resetWithOTP({
                email,
                otp,
                new_password: newPassword
            });
            setMessage(t('auth.forgotPassword.resetSuccess'));
            setTimeout(() => {
                onClose();
                // Reset state for next time
                setStep('request');
                setEmail('');
                setOtp('');
                setNewPassword('');
                setMessage('');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.forgotPassword.resetFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="bg-[var(--surface-card)] w-full max-w-[440px] rounded-[32px] border border-[var(--border)] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="w-12 h-12 bg-dagang-green/10 rounded-2xl flex items-center justify-center text-dagang-green">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors text-[var(--text-muted)]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-serif text-[28px] text-[var(--text-main)] leading-tight mb-2">
                            {step === 'request' ? t('auth.forgotPassword.titleRequest') : t('auth.forgotPassword.titleReset')}
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm">
                            {step === 'request' 
                                ? t('auth.forgotPassword.descRequest') 
                                : t('auth.forgotPassword.descReset')}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-[12px] font-bold mb-6 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {message && !error && (
                        <div className="bg-dagang-green/10 border border-dagang-green/20 text-dagang-green px-4 py-3 rounded-2xl text-[12px] font-bold mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> {message}
                        </div>
                    )}

                    {step === 'request' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">{t('auth.forgotPassword.emailLabel')}</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green group-focus-within:opacity-100 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-sm focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none text-[var(--text-main)]"
                                        placeholder={t('auth.forgotPassword.emailPlaceholder')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-dagang-green/10 hover:bg-dagang-green-light transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {t('auth.forgotPassword.sendOtpBtn')}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">{t('auth.forgotPassword.otpLabel')}</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green group-focus-within:opacity-100 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-sm focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none tracking-[0.5em] font-mono text-center text-[var(--text-main)]"
                                        placeholder={t('auth.forgotPassword.otpPlaceholder')}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">{t('auth.forgotPassword.newPasswordLabel')}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green group-focus-within:opacity-100 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-sm focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none text-[var(--text-main)]"
                                        placeholder={t('auth.forgotPassword.newPasswordPlaceholder')}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-dagang-green/10 hover:bg-dagang-green-light transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.forgotPassword.updatePasswordBtn')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('request')}
                                className="w-full py-2 text-dagang-gray text-[12px] font-bold hover:text-dagang-dark transition-colors"
                            >
                                {t('auth.forgotPassword.resendBtn')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
