import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Check,
    ShieldCheck,
    ArrowLeft,
    Clock,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AuthController } from '../controllers/AuthController';
import { FinanceController } from '../controllers/FinanceController';

export const PricingPage = () => {
    const user = useAuthStore(state => state.user);
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
    const [trialDays, setTrialDays] = useState('7');
    const [loading, setLoading] = useState(true);
    const memberCount = 1; // Default to 1

    // Simulate fetching member count for the logged in family
    // In a real app, this would be part of the family profile/stats
    useEffect(() => {
        const fetchPricingData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const [plansData, settingsData, summaryData] = await Promise.all([
                    AuthController.getPublicPlans(),
                    AuthController.getPublicSettings(),
                    user ? FinanceController.getDashboardSummary(now.getMonth() + 1, now.getFullYear()) : Promise.resolve(null)
                ]);

                // Map plans to match PricingCard needs
                const mappedPlans = plansData.map((p: any) => ({
                    ...p,
                    priceReadable: `${(p.price / 1000)}`,
                    featuresArray: p.features ? p.features.split(';') : []
                }));

                setPlans(mappedPlans);
                setTrialDays(settingsData.trial_duration_days || '7');

                if (summaryData?.family?.subscription_plan) {
                    setCurrentPlanName(summaryData.family.subscription_plan);
                } else if (summaryData?.family?.status === 'trial') {
                    setCurrentPlanName('Trial');
                }

                // If user is logged in, we should ideally know their member count
                // For now, let's assume it's in the user object or fetch it
                // Since we don't have a specific "getMemberCount" endpoint ready, 
                // let's assume we can get it from the user's current session/profile if needed.
                // For demonstration, we'll try to find it in the dashboard stats if available.
                // But generally, the user just wants the UI to reflect this.
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPricingData();
    }, []);

    const isExpired = user?.role !== 'super_admin' && (user as any)?.familyStatus === 'expired';

    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricing-plans');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSelectPlan = (plan: any) => {
        if (memberCount > plan.max_members) {
            alert(`Maaf, keluarga Anda memiliki ${memberCount} anggota. Paket ini hanya mendukung maksimal ${plan.max_members} anggota.`);
            return;
        }
        setSelectedPlan(plan.id);
        // Navigate to checkout with plan ID
        navigate(`/checkout?plan_id=${plan.id}`);
    };

    return (
        <div className="min-h-screen bg-dagang-cream text-dagang-dark font-sans selection:bg-dagang-green-pale selection:text-dagang-green relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-dagang-green/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-dagang-accent/5 blur-[100px] rounded-full" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-[60px] bg-[#faf8f3]/80 backdrop-blur-md border-b border-black/5">
                <Link to="/" className="logo font-serif text-2xl text-dagang-green hover:opacity-80 transition-opacity">
                    Dagang<span className="text-dagang-accent">Finance</span>
                </Link>
                <Link
                    to={user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")}
                    className="flex items-center gap-2 text-sm font-semibold text-dagang-gray hover:text-dagang-green transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Masuk ke Dashboard
                </Link>
            </nav>

            <main className="pt-[140px] pb-24 px-6 md:px-[60px] max-w-[1280px] mx-auto relative z-10">
                <div id="pricing-plans" className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-dagang-green-pale text-dagang-green px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-dagang-green/15 tracking-wide uppercase">
                        Pricing Plans
                    </div>
                    <h1 className="font-serif text-[42px] md:text-[54px] leading-tight mb-4">Investasi untuk Masa Depan <br className="hidden md:block" /><em className="italic font-serif text-dagang-green not-italic">Keuangan Keluarga</em></h1>
                    <p className="text-dagang-gray text-lg max-w-[620px] mx-auto leading-relaxed">
                        Pilih paket yang sesuai dengan kebutuhan keluarga Anda. Harga transparan, fitur lengkap, dan dukungan penuh.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                        <p className="font-medium text-dagang-gray">Memuat paket pilihan...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
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
                                    isCurrentPlan={currentPlanName === plan.name}
                                    onSelect={() => handleSelectPlan(plan)}
                                    description={plan.description}
                                    features={plan.featuresArray}
                                    currentFeatures={currentFeatures}
                                    buttonText={currentPlanName === plan.name ? 'Paket Saat Ini' : `Pilih ${plan.name}`}
                                    isLocked={memberCount > plan.max_members}
                                />
                            ));
                        })()}
                    </div>
                )}

                <div className="mt-20 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-8 mb-8 opacity-40 grayscale pointer-events-none flex-wrap justify-center">
                        <span className="font-serif text-xl">DOKU</span>
                        <span className="font-serif text-xl tracking-tighter">Midtrans</span>
                        <span className="font-serif text-xl uppercase italic">Stripe</span>
                        <span className="font-serif text-xl uppercase">Xendit</span>
                    </div>
                    <p className="text-[13px] text-dagang-gray flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-dagang-green" /> Pembayaran aman dengan enkripsi 256-bit SSL · Jaminan uang kembali 30 hari
                    </p>
                </div>
            </main>

            {/* Lockout Overlay (Trial Expired) */}
            {isExpired && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-[#0c130d]/90 backdrop-blur-sm" />
                    <div className="bg-white rounded-[32px] max-w-[500px] w-full p-8 md:p-11 text-center relative z-10 shadow-[0_32px_120px_rgba(0,0,0,0.5)] animate-fade-in">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <Clock className="w-10 h-10" />
                        </div>

                        <h2 className="font-serif text-[38px] mb-4 leading-tight">Masa Trial Anda <br /><span className="text-red-500 italic">Telah Habis</span></h2>
                        <p className="text-dagang-gray text-[15px] leading-relaxed mb-10">
                            Terima kasih telah mencoba DagangFinance selama {trialDays} hari terakhir. Untuk melanjutkan pencatatan dan akses data keluarga, silakan pilih paket berlangganan di bawah ini.
                        </p>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-4 p-4 bg-dagang-cream rounded-[16px] text-left">
                                <div className="w-9 h-9 bg-dagang-green-pale text-dagang-green rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold">Semua data Anda tetap aman</div>
                                    <div className="text-[12px] text-dagang-gray">Pencatatan akan dilanjutkan tepat saat Anda berhenti.</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={scrollToPricing}
                            className="w-full py-4.5 bg-dagang-dark text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/10 hover:bg-[#202821] transition-all flex items-center justify-center gap-3 group"
                        >
                            Upgrade Sekarang <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="mt-5 text-[14px] text-dagang-gray font-medium hover:text-dagang-dark">
                            Tanya CS melalui WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PricingCard = ({ name, price, description, features, currentFeatures = [], buttonText, featured = false, isSelected = false, isCurrentPlan = false, onSelect }: any) => (
    <div 
        onClick={!isCurrentPlan ? onSelect : undefined}
        className={`bg-white rounded-[32px] p-8 md:p-10 border transition-all relative flex flex-col ${isCurrentPlan ? 'border-dagang-green bg-dagang-green-pale/5 cursor-default' : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)]'} ${isSelected ? 'border-dagang-green ring-4 ring-dagang-green/10 bg-dagang-green-pale/5' : ''} ${featured ? (isSelected || isCurrentPlan ? 'border-dagang-green ring-dagang-green/20' : 'border-dagang-green/30 ring-4 ring-dagang-green/5 shadow-xl shadow-dagang-green/10') : 'border-black/5 shadow-sm'}`}
    >
        {isCurrentPlan && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-dagang-green text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.1em] shadow-lg animate-bounce">PAKET SAAT INI</div>
        )}

        {featured && !isCurrentPlan && (
            <div className="bg-dagang-accent text-white text-[11px] font-bold px-4 py-1 rounded-full w-fit mb-6 mx-auto tracking-widest">DIREKOMENDASIKAN</div>
        )}
        
        {isSelected && (
            <div className="absolute top-6 right-6 w-6 h-6 bg-dagang-green text-white rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <Check className="w-4 h-4" />
            </div>
        )}

        <div className="text-center mb-8">
            <div className={`text-[12px] font-bold tracking-[0.08em] mb-4 ${featured ? 'text-dagang-green' : 'text-dagang-gray/60'}`}>{name}</div>
            <div className="flex items-baseline justify-center gap-1.5 mb-2">
                <span className="text-[20px] font-bold text-dagang-gray mt-2">Rp</span>
                <span className="text-[42px] md:text-[54px] font-serif leading-none">{price}rb</span>
            </div>
            <div className="text-[13px] text-dagang-gray">per bulan / keluarga</div>
        </div>

        <p className="text-[14px] text-dagang-gray text-center mb-9 leading-relaxed line-clamp-2">
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
                            {isNewBenefit && <span className="text-[10px] text-dagang-accent font-black uppercase tracking-widest mt-0.5">Benefit Baru!</span>}
                        </div>
                    </div>
                );
            })}
        </div>

        <button
            disabled={isCurrentPlan}
            className={`w-full py-4 rounded-full text-center text-[15px] font-bold transition-all ${isCurrentPlan ? 'bg-dagang-green/10 text-dagang-green cursor-default' : isSelected ? 'bg-dagang-dark text-white' : featured ? 'bg-dagang-green text-white shadow-xl shadow-dagang-green/30 hover:bg-dagang-green-light' : 'bg-dagang-cream text-dagang-dark border-1.5 border-black/10 hover:border-dagang-green hover:text-dagang-green'}`}
        >
            {isCurrentPlan ? 'Paket Saat Ini' : isSelected ? 'Paket Terpilih' : buttonText}
        </button>
    </div>
);
