import React, { useState, useEffect } from 'react';
import { 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Info,
    ArrowRight,
    Zap
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';

export const CoachView: React.FC = () => {
    const { user } = useOutletContext<any>();
    const [behavior, setBehavior] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBehavior = async () => {
            try {
                const data = await FinanceController.getBehaviorSummary();
                setBehavior(data);
            } catch (error) {
                console.error("Failed to fetch behavior data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBehavior();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
            <p className="text-sm font-bold text-dagang-dark/40 tracking-widest uppercase">Menganalisis Psikologi Kamu...</p>
        </div>
    );

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-dagang-green';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreDescription = (score: number) => {
        if (score >= 80) return 'Sangat Sehat';
        if (score >= 60) return 'Perlu Waspada';
        return 'Kurang Sehat';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif text-dagang-dark">Behavioral AI Coach</h1>
                    <p className="text-dagang-gray text-sm mt-1">Analisis psikologi pengeluaran keluarga {user?.familyName}</p>
                </div>
                <div className="bg-white px-6 py-4 rounded-[24px] border border-black/5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-dagang-green/10 rounded-2xl flex items-center justify-center text-dagang-green">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest">Model AI</div>
                        <div className="text-[14px] font-bold text-dagang-dark">Behavioral v1.0.2</div>
                    </div>
                </div>
            </div>

            {/* Score & Main Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Gauge */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-black/5 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-[11px] font-black text-dagang-gray/50 tracking-[0.2em] uppercase mb-8">Financial Behavior Score</h3>
                    <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                        {/* Circular Progress (simplified) */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor" strokeWidth="12"
                                fill="transparent"
                                className="text-black/5"
                            />
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor" strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={552.92}
                                strokeDashoffset={552.92 - (552.92 * (behavior?.score || 0)) / 100}
                                strokeLinecap="round"
                                className={`${getScoreColor(behavior?.score)} transition-all duration-1000`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-serif text-dagang-dark">{behavior?.score || 0}</span>
                            <span className={`text-[12px] font-black uppercase tracking-wider ${getScoreColor(behavior?.score)}`}>
                                {getScoreDescription(behavior?.score)}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-dagang-gray font-medium leading-relaxed px-4">
                        Skor kamu dihitung berdasarkan rasio menabung, stabilitas pengeluaran, dan pola belanja akhir pekan.
                    </p>
                </div>

                {/* Behavioral Insights */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[11px] font-black text-dagang-gray/50 tracking-[0.2em] uppercase px-4">AI Coach Insights</h3>
                    {behavior?.insights?.map((insight: any, idx: number) => (
                        <div key={idx} className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm flex gap-5 hover:translate-x-1 transition-transform cursor-default group">
                            <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${
                                insight.type === 'success' ? 'bg-dagang-green/10 text-dagang-green' :
                                insight.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                            }`}>
                                {insight.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                 insight.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h4 className="font-bold text-[16px] text-dagang-dark">{insight.title}</h4>
                                    <span className="text-[10px] font-black text-dagang-gray/30 uppercase tracking-widest group-hover:text-dagang-dark transition-colors">Real-time Analysis</span>
                                </div>
                                <p className="text-[14px] text-dagang-gray leading-relaxed mb-4">{insight.description}</p>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-dagang-green bg-dagang-green/5 w-fit px-3 py-1.5 rounded-lg border border-dagang-green/10">
                                    < Zap className="w-3.5 h-3.5 fill-current" /> Rekomendasi: {insight.action}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!behavior?.insights || behavior.insights.length === 0) && (
                        <div className="bg-white p-12 rounded-[32px] border border-black/5 shadow-sm text-center text-dagang-gray italic">
                            Belum ada anomali perilaku yang terdeteksi. Terus catat transaksi kamu!
                        </div>
                    )}
                </div>
            </div>

            {/* Behavioral Challenges & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-dagang-dark to-black p-8 rounded-[32px] text-white shadow-xl shadow-dagang-dark/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-[11px] font-black text-white/30 tracking-[0.2em] uppercase mb-1">Challenge Minggu Ini</div>
                        <h4 className="text-xl font-serif mb-4">{behavior?.challenge?.title || 'No-Spend Day'}</h4>
                        <p className="text-sm text-white/60 mb-8 leading-relaxed">
                            {behavior?.challenge?.description || 'Tantang diri sendiri untuk mengontrol pengeluaran harian kamu.'}
                        </p>
                        <button className="flex items-center gap-2 text-[13px] font-bold text-dagang-accent hover:gap-3 transition-all">
                            Ikuti Tantangan <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Abstract background element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-dagang-accent/10 rounded-bl-[100px] -mr-8 -mt-8 blur-2xl" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                        <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest mb-4">Savings Rate</div>
                        <div className="text-2xl font-serif text-dagang-dark">{(behavior?.savings_rate || 0).toFixed(1)}%</div>
                        <div className="text-[11px] font-bold text-dagang-green mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Stabil
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
                        <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest mb-4">Inflation</div>
                        <div className="text-2xl font-serif text-dagang-dark">{(behavior?.lifestyle_inflation || 0).toFixed(1)}%</div>
                        <div className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${behavior?.lifestyle_inflation > 10 ? 'text-red-500' : 'text-dagang-green'}`}>
                            {behavior?.lifestyle_inflation > 10 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />} 
                            {behavior?.lifestyle_inflation > 10 ? 'Waspada' : 'Aman'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
