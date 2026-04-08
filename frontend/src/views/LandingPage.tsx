import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Check
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';
import api from '../services/api';
import { motion } from 'framer-motion';

// Animation variants
const fadeInUpVariants: any = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainerVariants: any = {
    initial: {},
    whileInView: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: any = {
    initial: { opacity: 0, y: 20 },
    whileInView: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};



export const LandingPage = () => {
    const { t } = useTranslation();
    const token = useAuthStore(state => state.token);
    const user = useAuthStore(state => state.user);
    const [plans, setPlans] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, settingsRes] = await Promise.all([
                    api.get('/public/plans'),
                    api.get('/public/settings')
                ]);
                setPlans(plansRes.data);
                setSettings(settingsRes.data);
            } catch (error) {
                console.error("Failed to fetch landing data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    const formatPrice = (price: number) => {
        if (price === 0) return t('pricingSection.free');
        return `Rp ${(price / 1000).toFixed(0)}rb`;
    };

    const trialDuration = settings.trial_duration_days || "7";

    return (
        <div className="bg-dagang-cream text-dagang-dark font-sans selection:bg-dagang-green-pale selection:text-dagang-green">
            {/* Navigation */}
            <PublicHeader />

            {/* HERO */}
            <section className="min-h-screen flex items-center px-6 md:px-[60px] pt-[120px] pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-[-100px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(26,107,74,0.08)_0%,transparent_70%)] rounded-full -z-10" />

                {/* Decorative Grid */}
                <div className="absolute top-[120px] right-20 grid grid-cols-8 gap-5 opacity-15">
                    {Array.from({ length: 32 }).map((_, i) => (
                        <span key={i} className="w-1 h-1 bg-dagang-green rounded-full block" />
                    ))}
                </div>

                <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="max-w-[620px] z-10 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 bg-dagang-green-pale text-dagang-green px-4 py-1.5 rounded-full text-sm font-semibold mb-7 border border-dagang-green/15 before:content-['✦'] before:text-[10px]">
                            {t('hero.badge', { days: trialDuration })}
                        </div>
                        <h1 className="font-heading text-h1 mobile:text-display-l desktop:text-display-xl leading-[1.05] text-dagang-dark mb-6" dangerouslySetInnerHTML={{ __html: t('hero.title') }} />
                        <motion.p 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-body-l text-dagang-gray leading-relaxed mb-11 max-w-[480px] mx-auto lg:mx-0"
                        >
                            {t('hero.subtitle')}
                        </motion.p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-14">
                            <a
                                href={
                                    token 
                                        ? (user?.role === 'super_admin' 
                                            ? "/admin" 
                                            : user?.role === 'content_strategist'
                                                ? "/writing-room"
                                                : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")) 
                                        : "/register"
                                }
                                className="btn-primary w-full sm:w-auto"
                            >
                                {token ? 'Ke Dashboard' : t('hero.cta_trial', { days: trialDuration })}
                                {!token && <span className="opacity-70 text-xs font-normal">— {t('hero.cta_trial_sub')}</span>}
                            </a>
                            <button className="btn-secondary w-full sm:w-auto">
                                {t('hero.cta_demo')}
                            </button>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-2.5">
                                {['B', 'S', 'R', 'A'].map((char, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-dagang-green to-dagang-green-light flex items-center justify-center text-[12px] font-bold text-white">
                                        {char}
                                    </div>
                                ))}
                            </div>
                            <div className="text-[13px] text-dagang-gray" dangerouslySetInnerHTML={{ __html: t('hero.trust') }} />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: 40 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="lg:w-[480px] relative z-10 w-full animate-float"
                    >
                        <div className="bg-white rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] p-7 overflow-hidden">
                            <div className="flex justify-between items-center mb-5">
                                <div className="text-[13px] font-semibold text-dagang-dark">{t('appPreview.familyBudi')}</div>
                                <div className="bg-dagang-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{t('appPreview.trialBadge', { days: trialDuration })}</div>
                            </div>

                            <div className="bg-gradient-to-br from-dagang-green to-dagang-green-light rounded-[16px] p-5 mb-4 text-white">
                                <div className="text-[12px] opacity-80 mb-1.5">{t('appPreview.netBalance')}</div>
                                <div className="font-serif text-[32px]">Rp 8.450.000</div>
                                <div className="text-[12px] opacity-70 mt-1">{t('appPreview.balanceChange')}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 mb-4">
                                <div className="bg-dagang-cream rounded-[12px] p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">💚</div>
                                    <div>
                                        <div className="text-[13px] font-semibold">Rp 12,5 jt</div>
                                        <div className="text-[11px] text-dagang-gray">{t('appPreview.income')}</div>
                                    </div>
                                </div>
                                <div className="bg-dagang-cream rounded-[12px] p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">❤️</div>
                                    <div>
                                        <div className="text-[13px] font-semibold">Rp 4,05 jt</div>
                                        <div className="text-[11px] text-dagang-gray">{t('appPreview.expense')}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between py-2 border-b border-black/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-[28px] h-[28px] rounded-lg bg-dagang-green-pale flex items-center justify-center text-[12px]">🛒</div>
                                        <div>
                                            <div className="text-[12px] font-medium">{t('appPreview.groceries')}</div>
                                            <div className="text-[11px] text-dagang-gray">{t('appPreview.today')}</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-semibold text-red-500">- Rp 450k</div>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-black/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-[28px] h-[28px] rounded-lg bg-dagang-green-pale flex items-center justify-center text-[12px]">💰</div>
                                        <div>
                                            <div className="text-[12px] font-medium">{t('appPreview.salary')}</div>
                                            <div className="text-[11px] text-dagang-gray">1 Mar</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-semibold text-dagang-green">+ Rp 8jt</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="absolute bottom-[-20px] left-[-60px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-3 px-4 flex items-center gap-2.5"
                        >
                            <div className="w-9 h-9 bg-amber-100 rounded-[10px] flex items-center justify-center text-base">📊</div>
                            <div className="text-[12px]">
                                <strong className="block font-semibold">{t('appPreview.groceryBudget')}</strong>
                                <span className="text-dagang-gray">{t('appPreview.budgetUsed')}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="px-6 md:px-[60px] py-32 bg-white/50 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-dagang-green/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-dagang-accent/5 blur-[120px] rounded-full -z-10" />

                <div className="max-w-[1280px] mx-auto">
                    <motion.div 
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        variants={fadeInUpVariants}
                        className="mb-16"
                    >
                        <div className="text-xs font-bold text-dagang-green tracking-[0.15em] uppercase mb-4 opacity-70">{t('featuresSection.label')}</div>
                        <h2 className="font-serif text-5xl mobile:text-h1 leading-[1.1] mb-6">{t('featuresSection.title')}</h2>
                        <p className="text-dagang-gray text-lg max-w-[520px] leading-relaxed">
                            {t('featuresSection.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainerVariants}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true, amount: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {[
                            { icon: '📝', title: t('featuresSection.items.0.title'), desc: t('featuresSection.items.0.desc') },
                            { icon: '🎯', title: t('featuresSection.items.1.title'), desc: t('featuresSection.items.1.desc') },
                            { icon: '🏦', title: t('featuresSection.items.2.title'), desc: t('featuresSection.items.2.desc') },
                            { icon: '📊', title: t('featuresSection.items.3.title'), desc: t('featuresSection.items.3.desc') },
                            { icon: '👨‍👩‍👧‍👦', title: t('featuresSection.items.4.title'), desc: t('featuresSection.items.4.desc') },
                            { icon: '🔔', title: t('featuresSection.items.5.title'), desc: t('featuresSection.items.5.desc') }
                        ].map((f, i) => (
                            <motion.div 
                                key={i} 
                                variants={itemVariants}
                                className="group bg-white/60 backdrop-blur-md rounded-[28px] p-9 border border-dagang-green/10 transition-all hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(26,107,74,0.15)] relative overflow-hidden"
                            >
                                <div className="w-[56px] h-[56px] rounded-[18px] bg-dagang-green-pale flex items-center justify-center text-[24px] mb-6 transition-transform group-hover:scale-110 duration-300 ring-4 ring-dagang-green/5">{f.icon}</div>
                                <h3 className="text-[19px] font-bold mb-3">{f.title}</h3>
                                <p className="text-[15px] text-dagang-gray leading-relaxed opacity-85">{f.desc}</p>
                                <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-dagang-green to-dagang-green-light scale-x-0 transition-transform group-hover:scale-x-100 origin-left duration-300" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="mx-6 md:mx-10 mb-20 px-6 md:px-[60px] py-28 bg-dagang-dark text-white rounded-[40px] relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(6,19,15,0.4)]">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(26,107,74,0.15),transparent_40%)]" />
                <div className="max-w-[1280px] mx-auto text-center relative z-10">
                    <motion.div 
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        variants={fadeInUpVariants}
                    >
                        <div className="text-xs font-bold text-dagang-accent tracking-[0.15em] uppercase mb-4">{t('howItWorksSection.label')}</div>
                        <h2 className="font-serif text-5xl mobile:text-h1 text-white mb-6">{t('howItWorksSection.title')}</h2>
                        <p className="text-white/60 text-lg mb-20 mx-auto max-w-[500px]">{t('howItWorksSection.subtitle')}</p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainerVariants}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative"
                    >
                        <div className="hidden lg:block absolute top-7 left-[60px] right-[60px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {[
                            { num: '1', title: t('howItWorksSection.items.0.title'), desc: t('howItWorksSection.items.0.desc') },
                            { num: '2', title: t('howItWorksSection.items.1.title'), desc: t('howItWorksSection.items.1.desc') },
                            { num: '3', title: t('howItWorksSection.items.2.title'), desc: t('howItWorksSection.items.2.desc') },
                            { num: '4', title: t('howItWorksSection.items.3.title'), desc: t('howItWorksSection.items.3.desc') }
                        ].map((s, i) => (
                            <motion.div 
                                key={i} 
                                variants={itemVariants}
                                className="flex flex-col items-center group"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-serif text-[24px] text-dagang-accent mb-6 relative z-10 transition-all group-hover:bg-dagang-accent group-hover:text-white duration-300">
                                    {s.num}
                                </div>
                                <h3 className="text-lg font-semibold mb-3">{s.title}</h3>
                                <p className="text-[14px] text-white/50 leading-relaxed max-w-[200px]">{s.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="px-6 md:px-[60px] py-20">
                <div className="max-w-[1280px] mx-auto">
                    <div className="text-center mb-14">
                        <div className="text-xs font-bold text-dagang-green tracking-[0.08em] uppercase mb-3">{t('pricingSection.label')}</div>
                        <h2 className="font-serif text-5xl mb-4">{t('pricingSection.title')}</h2>
                        <p className="text-dagang-gray text-lg">{t('pricingSection.subtitle', { days: trialDuration })}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9 max-w-[1100px] mx-auto items-stretch">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
                            </div>
                        ) : plans.length > 0 ? (
                            plans.map((plan, pIdx) => {
                                const features = plan.features ? plan.features.split(';').map((f: string) => f.trim()) : [];
                                const isPopular = plan.name.toLowerCase().includes('family') || plan.name.toLowerCase().includes('populer');
                                
                                return (
                                    <motion.div 
                                        key={plan.id} 
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: pIdx * 0.15, duration: 0.6 }}
                                        viewport={{ once: true }}
                                        className={`${isPopular ? 'bg-dagang-green text-white scale-[1.04] shadow-2xl shadow-dagang-green/20' : 'bg-white border border-black/5'} rounded-[40px] p-10 flex flex-col items-center relative transition-all hover:-translate-y-2`}
                                    >
                                        {isPopular && (
                                            <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-dagang-accent text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap z-10">
                                                {t('pricingSection.popular')}
                                            </div>
                                        )}
                                        <div className={`text-xs font-bold ${isPopular ? 'text-white/70' : 'opacity-70'} mb-4 tracking-wider uppercase`}>
                                            {plan.name}
                                        </div>
                                        <div className={`font-serif text-[40px] mb-1 ${isPopular ? 'text-white' : 'text-dagang-dark'}`}>
                                            {formatPrice(plan.price)}
                                        </div>
                                        <div className={`text-[13px] ${isPopular ? 'text-white/60' : 'text-dagang-gray'} mb-7`}>
                                            {t('pricingSection.perDays', { days: plan.duration_days })}
                                        </div>
                                        
                                        <ul className="w-full list-none space-y-4 mb-10 flex-1">
                                            {features.map((feature: string, fIdx: number) => (
                                                <li key={fIdx} className="text-[14px] flex items-start gap-3">
                                                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPopular ? 'text-dagang-accent' : 'text-dagang-green'}`} />
                                                    <span className={isPopular ? 'text-white/90' : 'text-dagang-dark/80'}>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        <a 
                                            href="/register" 
                                            className={`w-full py-4 rounded-full text-sm font-bold transition-all text-center ${
                                                isPopular 
                                                ? 'bg-white text-dagang-green hover:bg-white/90' 
                                                : 'border-[1.5px] border-black/15 hover:border-dagang-green hover:text-dagang-green'
                                            }`}
                                        >
                                            {t('pricingSection.choosePlan')} {plan.name}
                                        </a>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-black/5">
                                <p className="text-dagang-gray">{t('pricingSection.unavailable')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-6 md:mx-10 mb-20 px-6 md:px-[60px] py-28 bg-gradient-to-br from-dagang-dark via-[#1a3d2e] to-[#0a1f18] text-white text-center rounded-[40px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-dagang-green/30 blur-[120px] rounded-full" />
                <motion.div 
                    initial="initial"
                    whileInView="whileInView"
                    viewport={{ once: true }}
                    variants={fadeInUpVariants}
                    className="relative z-10"
                >
                    <h2 className="font-serif text-[56px] mobile:text-h1 mb-6 leading-tight">{t('ctaSection.title')}</h2>
                    <p className="text-white/70 text-lg mb-12 max-w-[600px] mx-auto">{t('ctaSection.subtitle', { days: trialDuration })}</p>
                    <a
                        href={
                            token 
                                ? (user?.role === 'super_admin' 
                                    ? "/admin" 
                                    : user?.role === 'content_strategist'
                                        ? "/writing-room"
                                        : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")) 
                                : "/register"
                        }
                        className="inline-block bg-dagang-accent text-white px-11 py-4.5 rounded-full text-base font-bold shadow-[0_8px_32px_rgba(245,158,11,0.4)] hover:-translate-y-px hover:shadow-[0_16px_48px_rgba(245,158,11,0.5)] transition-all"
                    >
                        {token ? t('ctaSection.buttonDashboard') : t('ctaSection.buttonTrial')}
                    </a>
                    <p className="text-[13px] text-white/40 mt-6 tracking-wide uppercase">{t('ctaSection.trust')}</p>
                </motion.div>
            </section>

            <PublicFooter />
        </div>
    );
};
