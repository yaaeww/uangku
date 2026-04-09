import React, { useState, useEffect } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { AuthController } from '../controllers/AuthController';

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    color: string;
}

interface PricingSectionProps {
    onSelectPlan?: (planId: string) => void;
    selectedPlanId?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, selectedPlanId }) => {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [trialDays, setTrialDays] = useState('7');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansData, settingsData] = await Promise.all([
                    AuthController.getPublicPlans(),
                    AuthController.getPublicSettings()
                ]);
                
                // Map the backend plans to the internal PricingPlan interface
                const mappedPlans = plansData.map((p: any) => ({
                    id: p.id, // Using actual UUID from database
                    name: p.name.toUpperCase(),
                    price: `${(p.price / 1000)}rb`,
                    period: `${p.duration_days} hari`,
                    description: p.description || `Nikmati semua fitur premium gratis selama ${settingsData.trial_duration_days || '7'} hari pertama.`,
                    features: p.features && typeof p.features === 'string' && p.features.trim() !== "" 
                        ? p.features.split(';').map((f: string) => f.trim()).filter((f: string) => f !== "")
                        : [
                            'Anggota keluarga tak terbatas',
                            'Semua fitur premium terbuka',
                            'Analitik & laporan mendalam',
                            'Lansiran anggaran real-time',
                            'Sinkronisasi antar perangkat'
                        ],
                    isPopular: p.name.toLowerCase() === 'premium', // Only "Premium" is popular by default
                    color: 'bg-dagang-accent'
                }));

                setPlans(mappedPlans);
                setTrialDays(settingsData.trial_duration_days || '7');
            } catch (err) {
                console.error("Failed to fetch public pricing info", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-dagang-green animate-spin" />
                <p className="text-dagang-gray font-bold">Memuat Penawaran Spesial...</p>
            </div>
        );
    }

    return (
        <section className="py-12 px-4 bg-transparent" id="pricing">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-serif mb-3 text-[var(--text-main)]">Mulai Uji Coba Gratis Anda</h2>
                    <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto">
                        Coba gratis {trialDays} hari. Batalkan kapan saja jika tidak sesuai.
                    </p>
                </div>

                <div className="flex justify-center flex-wrap gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                                relative p-8 md:p-10 rounded-[40px] border-2 transition-all duration-300 w-full max-w-md bg-[var(--surface-card)]
                                ${plan.isPopular ? 'border-dagang-accent shadow-2xl shadow-dagang-accent/5 z-10' : 'border-[var(--border)]'}
                                ${selectedPlanId === plan.id ? 'ring-4 ring-dagang-green/20' : ''}
                            `}
                        >
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-dagang-accent text-white px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                                <Star className="w-3.5 h-3.5 fill-current" /> Trial {trialDays} Hari
                            </div>

                            <div className="mb-10 text-center">
                                <h3 className="text-sm font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] mb-4">{plan.name}</h3>
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-xl text-[var(--text-muted)] opacity-40 line-through font-serif mb-1">Rp {plan.price}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-serif text-[var(--text-main)]">Rp 0</span>
                                        <span className="text-[var(--text-muted)] text-lg font-medium">/ {trialDays} hari</span>
                                    </div>
                                    <p className="text-xs font-bold text-dagang-green mt-3 bg-dagang-green/10 px-4 py-1.5 rounded-full">
                                        Kemudian Rp {plan.price} / {plan.period}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => onSelectPlan?.(plan.id)}
                                className="w-full h-16 bg-dagang-accent text-white rounded-2xl font-black text-sm tracking-wide hover:bg-dagang-accent/90 shadow-xl shadow-dagang-accent/20 transition-all mb-10 active:scale-[0.98]"
                            >
                                MULAI TRIAL GRATIS
                            </button>

                            <div className="space-y-5">
                                <p className="text-[11px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest mb-2">Fitur Termasuk:</p>
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-dagang-green/10 text-dagang-green flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                                        </div>
                                        <span className="text-[14px] font-medium text-[var(--text-main)] opacity-80">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
