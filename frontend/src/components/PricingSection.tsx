import React from 'react';
import { Check, Star } from 'lucide-react';

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

const PLANS: PricingPlan[] = [
    {
        id: 'basic',
        name: 'BASIC',
        price: '29rb',
        period: 'bulan',
        description: 'Mulai gratis 7 hari, lanjutkan sesuai kebutuhan.',
        features: [
            'Hingga 3 anggota',
            'Catat transaksi tak terbatas',
            'Budget dasar',
            'Laporan bulanan',
            'Support email'
        ],
        color: 'bg-dagang-green'
    },
    {
        id: 'family',
        name: 'FAMILY',
        price: '49rb',
        period: 'bulan',
        description: 'Pilihan terbaik untuk keluarga harmonis.',
        features: [
            'Hingga 6 anggota',
            'Semua fitur Basic',
            'Tabungan tujuan',
            'Pelacak utang & piutang',
            'Notifikasi otomatis'
        ],
        isPopular: true,
        color: 'bg-dagang-accent'
    },
    {
        id: 'premium',
        name: 'PREMIUM',
        price: '79rb',
        period: 'bulan',
        description: 'Fitur lengkap untuk kontrol finansial total.',
        features: [
            'Anggota tak terbatas',
            'Semua fitur Family',
            'Analitik lanjutan',
            'Referral & rewards',
            'Priority support'
        ],
        color: 'bg-dagang-dark'
    }
];

interface PricingSectionProps {
    onSelectPlan?: (planId: string) => void;
    selectedPlanId?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, selectedPlanId }) => {
    return (
        <section className="py-20 px-6 bg-white" id="pricing">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-serif mb-4 text-dagang-dark">Pilih Paket Keluarga Anda</h2>
                    <p className="text-dagang-gray max-w-2xl mx-auto">
                        Mulai gratis 7 hari, lanjutkan dengan paket yang sesuai kebutuhan keluarga.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                                relative p-8 rounded-[32px] border-2 transition-all duration-300 hover:-translate-y-2
                                ${plan.isPopular ? 'border-dagang-accent shadow-2xl shadow-dagang-accent/10 scale-105 z-10' : 'border-black/5 hover:border-dagang-green/20'}
                                ${selectedPlanId === plan.id ? 'ring-4 ring-dagang-green/20' : ''}
                            `}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-dagang-accent text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                                    <Star className="w-3 h-3 fill-current" /> ⭐ Paling Populer
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-dagang-gray mb-1">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-serif text-dagang-dark">Rp {plan.price}</span>
                                    <span className="text-dagang-gray text-sm">/{plan.period}</span>
                                </div>
                                <p className="text-[13px] text-dagang-gray/70 mt-3 leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <button
                                onClick={() => onSelectPlan?.(plan.id)}
                                className={`
                                    w-full py-4 rounded-2xl font-bold transition-all mb-8
                                    ${plan.isPopular
                                        ? 'bg-dagang-accent text-white hover:bg-dagang-accent/90 shadow-lg shadow-dagang-accent/20'
                                        : plan.id === 'premium' ? 'bg-dagang-dark text-white hover:bg-black' : 'bg-dagang-cream text-dagang-dark hover:bg-dagang-cream/70'}
                                    ${selectedPlanId === plan.id ? 'ring-2 ring-offset-2 ring-dagang-green' : ''}
                                `}
                            >
                                Pilih {plan.name.charAt(0) + plan.name.slice(1).toLowerCase()}
                            </button>

                            <div className="space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full ${plan.id === 'premium' ? 'bg-dagang-dark/10 text-dagang-dark' : 'bg-dagang-green/10 text-dagang-green'} flex items-center justify-center`}>
                                            <Check className="w-3 h-3" strokeWidth={3} />
                                        </div>
                                        <span className="text-[14px] text-dagang-dark/80">{feature}</span>
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
