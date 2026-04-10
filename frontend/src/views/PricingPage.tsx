import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
    Check,
    ShieldCheck,
    ArrowLeft,
    Clock,
    ChevronRight,
    Loader2,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import { AuthController } from '../controllers/AuthController';
import { FinanceController } from '../controllers/FinanceController';
import { useModal } from '../providers/ModalProvider';
import { Logo } from '../components/common/Logo';

export const PricingPage = () => {
    const { t } = useTranslation();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const { settings, fetchSettings } = useSystemStore();
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [hideOverlay, setHideOverlay] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
    const [familyStatus, setFamilyStatus] = useState<string | null>(null);
    const [trialDays, setTrialDays] = useState('7');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [memberCount, setMemberCount] = useState(1);

    // Calculate trial remaining time
    const getRemainingTrialTime = (endsAt: string | null) => {
        if (!endsAt) return "";
        const ends = new Date(endsAt);
        const now = new Date();
        const diff = ends.getTime() - now.getTime();
        if (diff <= 0) return "Trial Berakhir";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days} hari ${hours} jam`;
    };

    // Simulate fetching member count for the logged in family
    // In a real app, this would be part of the family profile/stats
    useEffect(() => {
        fetchSettings();
        const fetchPricingData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const [plansData, settingsData, summaryData] = await Promise.all([
                    AuthController.getPublicPlans(),
                    AuthController.getPublicSettings(),
                    user ? FinanceController.getDashboardSummary(now.getMonth() + 1, now.getFullYear()).catch(err => {
                        if (err.response?.status === 403) {
                            return { family: { status: 'expired' }, is_expired: true };
                        }
                        return err.response?.data?.summary || null;
                    }) : Promise.resolve(null)
                ]);

                // Map plans to match PricingCard needs
                const mappedPlans = plansData.map((p: any) => ({
                    ...p,
                    priceReadable: `${(p.price / 1000)}`,
                    featuresArray: p.features ? p.features.split(';') : []
                }));

                setPlans(mappedPlans);
                setTrialDays(settingsData.trial_duration_days || '7');

                // If summaryData is null, it might be because it failed with 403
                // The actual error is caught above, but we need to handle the state here
                if (summaryData?.family?.status === 'active') {
                    setCurrentPlanName(summaryData.family.subscription_plan);
                    setFamilyStatus('active');
                } else if (summaryData?.family?.status === 'trial') {
                    setCurrentPlanName(null);
                    setFamilyStatus('trial');
                    setTrialEndsAt(summaryData.family.trial_ends_at);
                } else if (summaryData?.family?.status === 'expired' || summaryData?.is_expired) {
                    setFamilyStatus('expired');
                }

                if (summaryData?.member_count) {
                    setMemberCount(summaryData.member_count + (summaryData.invitation_count || 0));
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPricingData();
    }, []);

    const isExpired = user?.role !== 'super_admin' && ((user as any)?.familyStatus === 'expired' || familyStatus === 'expired');

    const scrollToPricing = () => {
        setHideOverlay(true);
        const pricingSection = document.getElementById('pricing-plans');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSelectPlan = (plan: any) => {
        if (memberCount > plan.max_members) {
            showAlert('Limit Anggota', `Maaf, keluarga Anda memiliki ${memberCount} anggota (termasuk undangan pending). Paket ini hanya mendukung maksimal ${plan.max_members} anggota.`, 'warning');
            return;
        }
        setSelectedPlan(plan.id);
        // Navigate to checkout with plan ID
        navigate(`/checkout?plan_id=${plan.id}`);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-[var(--primary)]/20 selection:text-[var(--primary)] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-dagang-green/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-dagang-accent/5 blur-[100px] rounded-full" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-[60px] bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <Logo />
                </Link>
                <div className="flex items-center gap-6">
                    <Link
                        to={user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")}
                        className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('pricingPage.nav.dashboard')}
                    </Link>
                    {user && (
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors pl-6 border-l border-black/10"
                        >
                            <LogOut className="w-4 h-4" /> {t('pricingPage.nav.logout')}
                        </button>
                    )}
                </div>
            </nav>

            <main className="pt-[140px] pb-24 px-6 md:px-[60px] max-w-[1280px] mx-auto relative z-10">
                <div id="pricing-plans" className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-[var(--primary)]/20 tracking-wide uppercase">
                        {t('pricingPage.hero.badge')}
                    </div>
                    <h1 className="font-serif text-[42px] md:text-[54px] leading-tight mb-4">{t('pricingPage.hero.title')} <br className="hidden md:block" /><em className="italic font-serif text-[var(--primary)] not-italic">{settings.website_name}</em></h1>
                    <p className="text-[var(--text-muted)] text-lg max-w-[620px] mx-auto leading-relaxed">
                        {t('pricingPage.hero.subtitle')}
                    </p>

                    {isExpired && (
                        <div className="mt-8 p-6 bg-red-500/10 border-2 border-red-500/20 rounded-[28px] max-w-[800px] mx-auto animate-in fade-in zoom-in duration-500 shadow-xl shadow-red-500/5">
                            <div className="flex flex-col md:flex-row items-center gap-6 text-left">
                                <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-2xl text-red-600 mb-1">{t('pricingPage.alerts.trialEndedTitle')}</h3>
                                    <p className="text-red-700/80 text-sm leading-relaxed mb-4">
                                        {t('pricingPage.alerts.trialEndedDesc', { days: trialDays })}
                                    </p>
                                    <button 
                                        onClick={() => {
                                            const el = document.getElementById('pricing-plans-grid');
                                            el?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                    >
                                        {t('pricingPage.alerts.viewPlansBtn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {familyStatus === 'trial' && !isExpired && (
                        <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl inline-block animate-in fade-in slide-in-from-top-4 duration-500">
                             <p className="text-orange-600 font-bold flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" /> {t('pricingPage.alerts.trialActive', { remaining: getRemainingTrialTime(trialEndsAt) })}
                             </p>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                        <p className="font-medium text-dagang-gray">{t('pricingPage.alerts.loading')}</p>
                    </div>
                ) : (
                    <div id="pricing-plans-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto scroll-mt-24">
                        {(() => {
                            const currentPlan = plans.find(p => p.name === currentPlanName);
                            const currentFeatures = currentPlan?.featuresArray || [];

                            return plans.map((plan) => (
                                <PricingCard
                                    key={plan.id}
                                    name={plan.name}
                                    price={plan.priceReadable}
                                    durationDays={plan.duration_days}
                                    maxMembers={plan.max_members}
                                    featured={plan.name.toLowerCase().includes('family')}
                                    isSelected={selectedPlan === plan.id}
                                    isCurrentPlan={familyStatus === 'active' && currentPlanName === plan.name}
                                    onSelect={() => handleSelectPlan(plan)}
                                    description={plan.description}
                                    features={plan.featuresArray}
                                    currentFeatures={currentFeatures}
                                    buttonText={
                                        (familyStatus === 'active' && currentPlanName === plan.name) 
                                            ? "Perpanjang" 
                                            : "Ganti Paket"
                                    }
                                    isLocked={memberCount > plan.max_members}
                                />
                            ));
                        })()}
                    </div>
                )}

                <div className="mt-20 flex flex-col items-center justify-center text-center">
                    <p className="text-[13px] text-[var(--text-muted)] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--primary)]" /> {t('pricingPage.trustFooter')}
                    </p>
                </div>
            </main>

            {/* Lockout Overlay (Trial Expired) */}
            {isExpired && !hideOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-[var(--bg-deep)]/90 backdrop-blur-sm" />
                    <div className="bg-[var(--surface-card)] rounded-[32px] max-w-[500px] w-full p-8 md:p-11 text-center relative z-10 shadow-[0_32px_120px_rgba(0,0,0,0.5)] animate-fade-in border border-[var(--border)]">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                            <Clock className="w-10 h-10" />
                        </div>

                        <h2 className="font-serif text-[38px] mb-4 leading-tight text-[var(--text-main)]">{t('pricingPage.overlay.titlePart1')} <br /><span className="text-red-500 italic">{t('pricingPage.overlay.titlePart2')}</span></h2>
                        <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-10">
                            {t('pricingPage.overlay.desc', { days: trialDays })}
                        </p>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-[16px] text-left border border-[var(--border)]">
                                <div className="w-9 h-9 bg-[var(--primary)]/10 text-dagang-green rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold text-[var(--text-main)]">{t('pricingPage.overlay.safeDataTitle')}</div>
                                    <div className="text-[12px] text-[var(--text-muted)]">{t('pricingPage.overlay.safeDataDesc')}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={scrollToPricing}
                            className="w-full py-4.5 bg-[var(--bg-deep)] text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/10 hover:opacity-90 transition-all flex items-center justify-center gap-3 group"
                        >
                            {t('pricingPage.overlay.upgradeBtn')} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PricingCard = ({ name, price, durationDays, description, features, currentFeatures = [], buttonText, featured = false, isSelected = false, isCurrentPlan = false, onSelect }: any) => {
    const { t } = useTranslation();
    return (
    <div 
        onClick={!isCurrentPlan ? onSelect : undefined}
        className={`bg-[var(--surface-card)] rounded-[32px] p-8 md:p-10 border transition-all relative flex flex-col ${isCurrentPlan ? 'border-dagang-green bg-[var(--primary)]/5 cursor-default' : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)]'} ${isSelected ? 'border-dagang-green ring-4 ring-dagang-green/10 bg-[var(--primary)]/5' : ''} ${featured ? (isSelected || isCurrentPlan ? 'border-dagang-green ring-dagang-green/20' : 'border-dagang-green/30 ring-4 ring-dagang-green/5 shadow-xl shadow-dagang-green/10') : 'border-[var(--border)] shadow-sm'}`}
    >
        {isCurrentPlan && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-dagang-green text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.1em] shadow-lg animate-bounce">{t('pricingPage.card.current')}</div>
        )}

        {featured && !isCurrentPlan && (
            <div className="bg-dagang-accent text-white text-[11px] font-bold px-4 py-1 rounded-full w-fit mb-6 mx-auto tracking-widest">{t('pricingPage.card.recommended')}</div>
        )}
        
        {isSelected && (
            <div className="absolute top-6 right-6 w-6 h-6 bg-dagang-green text-white rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <Check className="w-4 h-4" />
            </div>
        )}

        <div className="text-center mb-8">
            <div className={`text-[12px] font-bold tracking-[0.08em] mb-4 ${featured ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]/60'}`}>{name}</div>
            <div className="flex items-baseline justify-center gap-1.5 mb-2">
                <span className="text-[20px] font-bold text-[var(--text-muted)] mt-2">Rp</span>
                <span className="text-[42px] md:text-[54px] font-serif leading-none">{price}rb</span>
            </div>
            <div className="text-[13px] text-[var(--text-muted)]">/ {durationDays} Hari</div>
        </div>

        <p className="text-[14px] text-[var(--text-muted)] text-center mb-9 leading-relaxed line-clamp-2">
            {description}
        </p>

        <div className="flex-1 space-y-4 mb-10">
            {features.map((f: string, i: number) => {
                const isNewBenefit = !isCurrentPlan && currentFeatures.length > 0 && !currentFeatures.includes(f);
                return (
                    <div key={i} className="flex items-start gap-3.5 text-[14px]">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isNewBenefit ? 'bg-dagang-accent text-white animate-pulse' : featured || isSelected ? 'bg-dagang-green text-white' : 'bg-dagang-green-pale text-dagang-green'}`}>
                            <Check className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-dagang-dark/80 line-clamp-1 ${isNewBenefit ? 'font-bold text-dagang-dark' : ''}`}>{f}</span>
                            {isNewBenefit && <span className="text-[10px] text-dagang-accent font-black uppercase tracking-widest mt-0.5">{t('pricingPage.card.newBenefit')}</span>}
                        </div>
                    </div>
                );
            })}
        </div>

        <button
            disabled={isCurrentPlan}
            className={`w-full py-4 rounded-full text-center text-[15px] font-bold transition-all ${
                isCurrentPlan 
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] cursor-default' 
                    : isSelected 
                        ? 'bg-[var(--bg-deep)] text-white' 
                        : featured 
                            ? 'bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/30 hover:bg-[var(--primary)]/90' 
                            : 'bg-[var(--background)] text-[var(--text-main)] border-2 border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5'
            }`}
        >
            {isCurrentPlan ? t('pricingPage.card.btnCurrent') : isSelected ? t('pricingPage.card.btnSelected') : buttonText}
        </button>
    </div>
    );
};
