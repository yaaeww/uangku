import React, { useState } from 'react';
import { AuthController } from '../controllers/AuthController';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/common/Logo';
import { Mail, Lock, Loader2, ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
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
            } else if (user.role === 'content_strategist') {
                navigate('/writing-room');
            } else {
                navigate(`/${encodeURIComponent(family_name)}/dashboard`);
            }
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            if (backendError === 'user_not_found') {
                setError(t('auth.login.errorUserNotFound'));
            } else if (backendError === 'incorrect_password') {
                setError(t('auth.login.errorInvalidPassword'));
            } else {
                setError(backendError || t('auth.login.errorDefault'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dagang-cream text-dagang-dark font-sans flex flex-col md:flex-row transition-colors duration-300">
            {/* Left Panel - Branding */}
            <div className="hidden md:flex md:w-[40%] bg-dagang-deep p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-dagang-green/20 blur-[120px] rounded-full" />

                <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity relative z-10">
                    <Logo variant="horizontal" />
                </Link>

                <div className="relative z-10">
                    <h2 
                        className="font-serif text-[42px] text-white leading-tight mb-6"
                        dangerouslySetInnerHTML={{ 
                            __html: `${t('auth.login.titlePart1')}<span class="text-dagang-green italic">${t('auth.login.titlePart2')}</span>` 
                        }}
                    />
                    <p className="text-white/40 text-lg max-w-sm mb-10 leading-relaxed">
                        {t('auth.login.subtitle')}
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-dagang-green group-hover:bg-dagang-green group-hover:text-white transition-all">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-white/70">{t('auth.login.securityDesc')}</div>
                        </div>
                    </div>
                </div>

                <div className="text-[12px] text-white/20 relative z-10">
                    {t('auth.login.copyright')}
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 p-6 md:p-12 lg:p-[100px] flex flex-col justify-center bg-dagang-cream relative">
                <div className="absolute top-6 right-6 md:top-12 md:right-12">
                    <button
                        onClick={toggleLanguage}
                        className="p-2.5 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-dagang-gray hover:text-dagang-green transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase">{i18n.language}</span>
                    </button>
                </div>

                <div className="max-w-[420px] mx-auto w-full">
                    <div className="mb-10">
                        <a href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold hover:text-dagang-green transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" /> {t('auth.login.backToHome')}
                        </a>
                        <h1 className="font-serif text-[42px] mb-2 leading-none text-[var(--text-main)]">{t('auth.login.heading')}</h1>
                        <p className="text-[var(--text-muted)] text-sm">
                            {t('auth.login.noAccount')}<a href="/register" className="text-dagang-green font-bold hover:underline ml-1">{t('auth.login.startTrial')}</a>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                                <span className="text-[16px]">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-[var(--text-muted)] opacity-70 tracking-wide uppercase">{t('auth.login.emailLabel')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green group-focus-within:opacity-100 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--surface-card)] border-[1.5px] border-[var(--border)] rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none shadow-sm text-[var(--text-main)]"
                                    placeholder={t('auth.login.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-bold text-[var(--text-muted)] opacity-70 tracking-wide uppercase">{t('auth.login.passwordLabel')}</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-[12px] font-bold text-dagang-green hover:underline"
                                >
                                    {t('auth.login.forgotPassword')}
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green group-focus-within:opacity-100 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--surface-card)] border-[1.5px] border-[var(--border)] rounded-2xl text-sm focus:border-dagang-green focus:ring-4 focus:ring-dagang-green/5 transition-all outline-none shadow-sm text-[var(--text-main)]"
                                    placeholder={t('auth.login.passwordPlaceholder')}
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
                            <label htmlFor="remember" className="text-[13px] text-dagang-gray font-medium cursor-pointer">{t('auth.login.rememberMe')}</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-dagang-green/10 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {t('auth.login.submitBtn')}
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-[var(--border)] flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-1.5 grayscale text-[var(--text-main)]">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-widest uppercase">{t('auth.login.safeSecure')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal 
                isOpen={isForgotModalOpen} 
                onClose={() => setIsForgotModalOpen(false)} 
            />
        </div>
    );
};

const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);
