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
                <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                <p className="font-medium text-dagang-gray">Memuat paket pilihan...</p>
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
                        className="inline-flex items-center gap-2 text-dagang-gray hover:text-dagang-dark transition-colors mb-4 group font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Anggota
                    </Link>
                    <h1 className="text-h2 font-heading text-dagang-dark">Pilih Paket Langganan</h1>
                    <p className="text-dagang-gray font-medium">Investasi terbaik untuk manajemen keuangan keluarga Anda.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-dagang-green/10 flex items-center justify-center text-dagang-green">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-dagang-gray uppercase tracking-widest">Status Keamanan</div>
                        <div className="text-sm font-bold text-dagang-dark uppercase leading-tight">Pembayaran Aman TriPay</div>
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
                        <div key={plan.id} className={`bg-white p-10 rounded-[48px] border-2 transition-all relative overflow-hidden group flex flex-col ${isCurrent ? 'border-dagang-green bg-dagang-green/[0.02]' : 'border-black/5 hover:border-black/10'}`}>
                            {isCurrent && (
                                <div className="absolute top-10 right-10 bg-dagang-green text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-dagang-green/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Paket Aktif
                                </div>
                            )}
                            
                            <div className="space-y-6 flex-1">
                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${plan.name === 'Premium' ? 'bg-dagang-dark text-dagang-accent' : plan.name === 'Family' ? 'bg-dagang-accent/10 text-dagang-accent' : 'bg-dagang-gray/10 text-dagang-gray'}`}>
                                    {plan.name === 'Premium' ? <Star className="w-8 h-8" /> : plan.name === 'Family' ? <Award className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-serif text-dagang-dark mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-dagang-dark">Rp {plan.price?.toLocaleString('id-ID')}</span>
                                        <span className="text-sm font-bold text-dagang-gray">/ {plan.duration_days} hari</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 pt-6 border-t border-black/5">
                                    <li className="flex items-center gap-3 text-[14px] text-dagang-dark font-medium leading-relaxed">
                                        <div className="w-6 h-6 rounded-full bg-dagang-green/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-dagang-green" />
                                        </div>
                                        <span>Hingga <strong>{plan.max_members} Anggota</strong> Keluarga</span>
                                    </li>
                                    {plan.features?.split(';').map((feature: string) => (
                                        <li key={feature} className="flex items-center gap-3 text-[14px] text-dagang-dark font-medium leading-relaxed">
                                            <div className="w-6 h-6 rounded-full bg-dagang-green/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-dagang-green" />
                                            </div>
                                            {feature.trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                disabled={!canAction || familyRole !== 'head_of_family'}
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full h-16 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all mt-10 flex items-center justify-center gap-3 ${
                                    isCurrent 
                                    ? 'bg-dagang-green text-white hover:bg-dagang-green-light shadow-xl shadow-dagang-green/30' 
                                    : canAction 
                                        ? 'bg-dagang-dark text-white hover:bg-black shadow-xl shadow-dagang-dark/20' 
                                        : 'bg-dagang-gray/10 text-dagang-gray cursor-not-allowed'
                                }`}
                            >
                                {isCurrent ? 'Perpanjang Paket' : canAction ? 'Upgrade Sekarang' : 'Sudah Maksimal'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="bg-dagang-cream/50 rounded-[40px] p-8 md:p-12 border border-black/5 text-center max-w-4xl mx-auto mt-20">
                <h3 className="text-2xl font-serif text-dagang-dark mb-4">Butuh bantuan memilih paket?</h3>
                <p className="text-dagang-gray mb-8 max-w-xl mx-auto leading-relaxed">
                    Tim dukungan kami siap membantu Anda menemukan paket yang paling sesuai dengan kebutuhan finansial keluarga Anda.
                </p>
                <button className="h-14 px-10 bg-white border border-black/10 rounded-full font-bold hover:bg-dagang-cream transition-all shadow-sm">
                    Hubungi Customer Service
                </button>
            </div>
        </div>
    );
};

// End of file
