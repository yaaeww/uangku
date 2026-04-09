import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Logo } from './Logo';
import { 
    Globe, 
    LayoutDashboard, 
    LogOut,
    Sun,
    Moon
} from 'lucide-react';

export const PublicHeader = () => {
    const { t, i18n } = useTranslation();
    const token = useAuthStore(state => state.token);
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'id' ? 'en' : 'id';
        i18n.changeLanguage(newLang);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 md:px-[60px] bg-[var(--bg-cream)]/92 backdrop-blur-md border-b border-[var(--primary)]/10 transition-all duration-500">
            <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
                <Logo />
            </Link>

            <ul className="hidden lg:flex gap-9 list-none">
                <li><a href="/#features" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{t('nav.features')}</a></li>
                <li><a href="/#how-it-works" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{t('nav.howItWorks')}</a></li>
                <li><a href="/#pricing" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{t('nav.pricing')}</a></li>
                <li><Link to="/blog" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{t('nav.blog')}</Link></li>
            </ul>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center justify-center shrink-0"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                    <div className="w-[1px] h-4 bg-[var(--border)] opacity-30" />
                    <button
                        onClick={toggleLanguage}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1 shrink-0"
                        title="Toggle Language"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase hidden sm:inline">{i18n.language}</span>
                    </button>
                </div>
                {token ? (
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Link
                            to={
                                user?.role === 'super_admin' 
                                    ? "/admin" 
                                    : user?.role === 'content_strategist' 
                                        ? "/writing-room" 
                                        : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")
                            }
                            className="px-3 sm:px-6 py-2 sm:py-2.5 bg-dagang-green text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-dagang-green-light transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap shrink-0"
                        >
                            <LayoutDashboard className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                        </Link>
                        <button 
                            onClick={() => logout()}
                            className="p-2 hover:bg-red-50 rounded-full text-dagang-gray hover:text-red-500 transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="text-[13px] sm:text-sm font-semibold text-dagang-green border border-dagang-green/30 hover:bg-dagang-green-pale px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all whitespace-nowrap">
                            {t('nav.login')}
                        </Link>
                        <Link to="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-dagang-green text-white rounded-full text-[13px] sm:text-sm font-semibold hover:bg-dagang-green-light transition-all shadow-sm whitespace-nowrap">
                            {t('nav.trial')}
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};
