import { useState, useEffect } from 'react';
// Dummy comment to trigger re-index
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { 
    Zap, 
    Star, 
    Award, 
    CheckCircle2, 
    ArrowLeft,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export const PlanPricingView = () => {
    const { user, familyRole } = useOutletContext<any>();
    const navigate = useNavigate();
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [familyData, setFamilyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [familyStatus, setFamilyStatus] = useState('trial');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [plansResp, profileResp] = await Promise.all([
                    api.get('/public/plans'),
                    api.get('/finance/families/profile')
                ]);
                setAvailablePlans(plansResp.data);
                setFamilyData(profileResp.data.family);
                setFamilyStatus(profileResp.data.family.status);
            } catch (error) {
                console.error("Failed to load pricing data", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSelectPlan = (plan: any) => {
        // Redirect to checkout with plan ID
        navigate(`/checkout?plan_id=${plan.id}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                <p className="font-medium text-[var(--text-muted)] opacity-60">Memuat paket pilihan...</p>
            </div>
        );
    }

    const familyName = user?.familyName || '';

    return (
        <div className="space-y-10 pb-20">
            {/* Header with Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link 
                        to={`/${encodeURIComponent(familyName)}/dashboard/family`}
                        className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-4 group font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Anggota
                    </Link>
                    <h1 className="text-h2 font-heading text-[var(--text-main)]">Pilih Paket Langganan</h1>
                    <p className="text-[var(--text-muted)] opacity-70 font-medium">Investasi terbaik untuk manajemen keuangan keluarga Anda.</p>
                </div>

                <div className="flex items-center gap-4 bg-[var(--surface-card)] p-4 rounded-[24px] border border-[var(--border)] shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest">Status Keamanan</div>
                        <div className="text-sm font-bold text-[var(--text-main)] uppercase leading-tight">Pembayaran Aman TriPay</div>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availablePlans.map((plan) => {
                    const isCurrent = familyData?.subscription_plan === plan.name;
                    const isHigher = (familyData?.subscription_plan === 'Standard' && (plan.name === 'Family' || plan.name === 'Premium')) || 
                                     (familyData?.subscription_plan === 'Family' && plan.name === 'Premium') ||
                                     (familyStatus === 'trial');
                    
                    const canAction = isHigher || isCurrent;

                    return (
                        <div key={plan.id} className={`bg-[var(--surface-card)] p-10 rounded-[48px] border-2 transition-all relative overflow-hidden group flex flex-col ${isCurrent ? 'border-[var(--primary)] bg-[var(--primary)]/[0.02]' : 'border-[var(--border)] hover:border-[var(--primary)]/30'}`}>
                            {isCurrent && (
                                <div className="absolute top-10 right-10 bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-[var(--primary)]/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Paket Aktif
                                </div>
                            )}
                            
                            <div className="space-y-6 flex-1">
                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${plan.name === 'Premium' ? 'bg-dagang-dark text-[var(--accent)]' : plan.name === 'Family' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                                    {plan.name === 'Premium' ? <Star className="w-8 h-8" /> : plan.name === 'Family' ? <Award className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-serif text-[var(--text-main)] mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-[var(--text-main)]">Rp {plan.price?.toLocaleString('id-ID')}</span>
                                        <span className="text-sm font-bold text-[var(--text-muted)] opacity-60">/ {plan.duration_days} hari</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 pt-6 border-t border-[var(--border)]">
                                    <li className="flex items-center gap-3 text-[14px] text-[var(--text-main)] font-medium leading-relaxed">
                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                                        </div>
                                        <span>Hingga <strong>{plan.max_members} Anggota</strong> Keluarga</span>
                                    </li>
                                    {plan.features?.split(';').map((feature: string) => (
                                        <li key={feature} className="flex items-center gap-3 text-[14px] text-[var(--text-main)] font-medium leading-relaxed">
                                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                                            </div>
                                            {feature.trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full h-14 md:h-16 rounded-[20px] md:rounded-[24px] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all mt-8 md:mt-10 flex items-center justify-center gap-3 ${
                                    isCurrent 
                                    ? 'bg-[var(--primary)] text-white hover:opacity-90 shadow-xl shadow-[var(--primary)]/30' 
                                    : canAction 
                                        ? 'bg-dagang-dark text-white hover:opacity-90 shadow-xl shadow-black/20' 
                                        : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {isCurrent ? 'Perpanjang Paket' : canAction ? 'Upgrade Sekarang' : 'Sudah Maksimal'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="bg-dagang-cream/10 dark:bg-white/5 rounded-[40px] p-8 md:p-12 border border-[var(--border)] text-center max-w-4xl mx-auto mt-20">
                <h3 className="text-2xl font-serif text-[var(--text-main)] mb-4">Butuh bantuan memilih paket?</h3>
                <p className="text-[var(--text-muted)] opacity-70 mb-8 max-w-xl mx-auto leading-relaxed">
                    Tim dukungan kami siap membantu Anda menemukan paket yang paling sesuai dengan kebutuhan finansial keluarga Anda.
                </p>
                <button 
                    onClick={() => navigate(`/${encodeURIComponent(familyName)}/dashboard/support`)}
                    className="h-14 px-10 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-main)] rounded-full font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
                >
                    Hubungi Customer Service
                </button>
            </div>
        </div>
    );
};

// End of file
