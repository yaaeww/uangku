import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Info,
    ArrowRight,
    Zap,
    BookOpen,
    FileText,
    Users,
    Compass,
    Sparkles,
    Activity,
    ShieldCheck,
    History
} from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';

interface Recommendation {
    priority: 'high' | 'warning' | 'critical' | 'info';
    text: string;
    action: string;
    impact: string;
}

interface Forecast {
    predicted_spending: number;
    confidence: string;
    alert: string;
}

interface CoachAnalysis {
    gelar_user: string;
    status: string;
    ringkasan: string;
    insight: string[];
    peringatan: string[];
    analisis_goals: string[];
    analisis_aset: string[];
    recommendations: string[]; // Legacy
    detailed_recommendations: Recommendation[];
    prediksi: string; // Legacy
    forecast: Forecast;
    coaching_style: string;
    score: number;
    savings_rate: number;
    expense_ratio: number;
    comparison?: string;
}

export const CoachView: React.FC = () => {
    const { user, selectedMonth, selectedYear } = useOutletContext<any>();
    const [behavior, setBehavior] = useState<any>(null);
    const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [behaviorLoading, setBehaviorLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');

    const periods = [
        { id: '7d', label: '7 Hari' },
        { id: '30d', label: '30 Hari' },
        { id: '90d', label: '3 Bulan' },
        { id: '1y', label: '1 Tahun' }
    ];

    const getPeriodLabel = (id: string) => periods.find(p => p.id === id)?.label || '30 Hari';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch basic coach analysis and blogs (usually monthly context)
                FinanceController.getBlogs('published', 'edukasi')
                    .then(data => setBlogs(data || []))
                    .catch(e => console.error("Blog fetch failed", e));
                
                FinanceController.getCoachAnalysis(selectedMonth, selectedYear)
                    .then(data => setAnalysis(data))
                    .catch(e => console.error("Analysis fetch failed", e));
            } catch (error) {
                console.error("Failed to fetch static data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedMonth, selectedYear]);

    // Independent effect for behavior analysis to support period switching
    useEffect(() => {
        const fetchBehavior = async () => {
            setBehaviorLoading(true);
            try {
                const data = await FinanceController.getBehaviorSummary(selectedPeriod);
                setBehavior(data);
            } catch (e) {
                console.error("Behavior fetch failed", e);
            } finally {
                setBehaviorLoading(false);
            }
        };
        fetchBehavior();
    }, [selectedPeriod]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">Menganalisis Perilaku Keuangan...</p>
        </div>
    );

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[var(--primary)]';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreDescription = (score: number) => {
        if (score >= 80) return 'Sangat Sehat';
        if (score >= 60) return 'Perlu Waspada';
        return 'Kurang Sehat';
    };

    const renderActionWithLinks = (action: string) => {
        if (!action) return null;
        
        const familySlug = encodeURIComponent(user?.familyName || '');
        const transPath = `/${familySlug}/dashboard/transactions`;
        const walletPath = `/${familySlug}/dashboard/wallets`;

        // Case: "Mulai catat transaksi atau tambah dompet pertamamu."
        if (action.includes("catat transaksi") && action.includes("tambah dompet")) {
            const parts = action.split(/(catat transaksi|tambah dompet)/);
            return (
                <>
                    {parts.map((part, i) => {
                        if (part === "catat transaksi") {
                            return <Link key={i} to={transPath} className="underline hover:text-[var(--primary-dark)]">catat transaksi</Link>;
                        }
                        if (part === "tambah dompet") {
                            return <Link key={i} to={walletPath} className="underline hover:text-[var(--primary-dark)]">tambah dompet</Link>;
                        }
                        return part;
                    })}
                </>
            );
        }

        // Generic fallback for other insights if they have these keywords
        if (action.includes("catat transaksi")) {
            const parts = action.split("catat transaksi");
            return <>{parts[0]}<Link to={transPath} className="underline">catat transaksi</Link>{parts[1]}</>;
        }
        
        if (action.includes("tambah dompet")) {
            const parts = action.split("tambah dompet");
            return <>{parts[0]}<Link to={walletPath} className="underline">tambah dompet</Link>{parts[1]}</>;
        }

        return action;
    };

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-serif text-[var(--text-main)]">Panduan & Insight Keluarga</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Saran dan analisis perilaku keuangan keluarga {user?.familyName}</p>
                </div>
                <div className="bg-[var(--surface-card)] px-6 py-4 rounded-[24px] border border-[var(--border)] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                        <Compass className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] opacity-70 uppercase tracking-widest">Fitur</div>
                        <div className="text-[14px] font-bold text-[var(--text-main)]">Panduan Cerdas v1.1</div>
                    </div>
                </div>
            </div>

            {/* AI Financial Coach Report - NEW SECTION */}
            <div className="bg-[#064E3B] text-white p-8 md:p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                <Zap className="w-7 h-7 text-[var(--accent)] animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif text-white">AI Financial Coach Analysis</h2>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Laporan Hyper-Intelligent v4.0</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                             {/* Mini Gauge instead of full section */}
                             <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                                    <circle 
                                        cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                        strokeDasharray={138.23}
                                        strokeDashoffset={138.23 - (138.23 * (analysis?.score || 0)) / 100}
                                        strokeLinecap="round"
                                        className={`${(analysis?.score || 0) >= 70 ? 'text-emerald-400' : (analysis?.score || 0) >= 50 ? 'text-amber-400' : 'text-red-400'} transition-all duration-1000`} 
                                    />
                                </svg>
                                <span className="absolute text-[13px] font-serif font-bold">{analysis?.score || 0}</span>
                             </div>

                             <div className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border shadow-lg ${
                                 analysis?.status === 'Sehat' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                 analysis?.status === 'Stabil' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                 analysis?.status === 'Rentan' || analysis?.status === 'Waspada' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                 'bg-red-500/20 border-red-500/30 text-red-400'
                             }`}>
                                 <CheckCircle2 className="w-5 h-5" /> {analysis?.status || 'Menganalisis...'}
                             </div>
                             <div className="hidden md:block bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white/60">
                                 {analysis?.comparison || 'Menghitung tren...'}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Gelar User</h3>
                                <div className="text-3xl font-serif text-[var(--accent)] drop-shadow-sm flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                    {analysis?.gelar_user || 'Si Calon Sultan'}
                                </div>
                                <p className="text-[15px] text-white/60 font-medium mt-2">
                                    {analysis?.ringkasan || 'Terus catat transaksi untuk mendapatkan gelar unik dari AI Coach!'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Analisis Mendalam</h3>
                                <div className="space-y-3">
                                    {analysis?.insight?.map((item: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-center text-white/80">
                                            <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full shrink-0" />
                                            <p className="text-[14px] leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Savings Rate</div>
                                    <div className="text-2xl font-serif text-[var(--accent)]">{(analysis?.savings_rate || 0).toFixed(1)}%</div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Expense Ratio</div>
                                    <div className="text-2xl font-serif text-white/90">{(analysis?.expense_ratio || 0).toFixed(1)}%</div>
                                </div>
                            </div>

                            {analysis?.peringatan && analysis.peringatan.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-red-400/50 uppercase tracking-[0.2em] mb-4">Peringatan Penting</h3>
                                    {analysis.peringatan.map((w: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-start bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <p className="text-[14px] text-red-100/80">{w}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4">Rekomendasi Forensik</h3>
                                <div className="space-y-4">
                                    {analysis?.detailed_recommendations?.map((r, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2 group transition-all hover:bg-white/10">
                                            <div className="flex items-center justify-between">
                                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    r.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                    r.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {r.priority} Priority
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">⚡ {r.impact}</div>
                                            </div>
                                            <p className="text-[14px] font-medium text-white/90">{r.text}</p>
                                            <div className="flex items-center gap-2 text-[12px] text-white/40 group-hover:text-white/70">
                                                <ArrowRight className="w-3 h-3" />
                                                <span className="italic">{r.action}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analysis?.detailed_recommendations || analysis.detailed_recommendations.length === 0) && (
                                        <div className="text-white/30 text-xs italic p-4 bg-white/5 rounded-2xl border border-dashed border-white/5">
                                            Kondisi terpantau stabil, belum ada rekomendasi mendesak.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white/10 to-transparent p-6 rounded-[32px] border border-white/10 relative overflow-hidden group">
                                <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                                <h3 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" /> Prediksi & Forecasting
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Estimasi Pengeluaran</div>
                                            <div className="text-2xl font-serif text-white/90">Rp{analysis?.forecast?.predicted_spending.toLocaleString('id-ID')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Conf.</div>
                                            <div className="text-sm font-bold text-emerald-400">{analysis?.forecast?.confidence}</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed italic">
                                        "{analysis?.forecast?.alert || 'Tren pengeluaran stabil, proyeksi aman untuk bulan depan.'}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 px-2">
                                <div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">Analisis Goals</span>
                                    <div className="space-y-1">
                                        {analysis?.analisis_goals?.map((g, idx) => (
                                            <div key={idx} className="text-[12px] font-bold text-white/60">• {g}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">Analisis Aset</span>
                                    <div className="space-y-1">
                                        {analysis?.analisis_aset?.map((a, idx) => (
                                            <div key={idx} className="text-[12px] font-bold text-white/60">• {a}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Profiles Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[11px] font-black text-[var(--text-muted)] opacity-70 tracking-[0.2em] uppercase">Karakter Pengeluaran Keluarga</h3>
                        <div className="text-[10px] font-bold text-[var(--primary)] flex items-center gap-1 bg-[var(--primary)]/10 px-2 py-1 rounded-full border border-[var(--primary)]/20 w-fit">
                             <Compass className="w-3 h-3" /> Berdasarkan Pola {getPeriodLabel(selectedPeriod)} Terakhir
                        </div>
                    </div>

                    {/* Period Switcher UI */}
                    <div className="flex items-center p-1.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl gap-1">
                        {periods.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPeriod(p.id)}
                                className={`
                                    px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300
                                    ${selectedPeriod === p.id 
                                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'}
                                `}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ${behaviorLoading ? 'opacity-40 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}>
                    {behavior?.is_data_sufficient && behavior?.member_profiles?.length > 0 ? behavior.member_profiles.map((profile: any, idx: number) => (
                        <div key={idx} className="bg-[var(--surface-card)] p-6 rounded-[28px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            {/* Accent Background for specific traits */}
                            {profile.trait === "Si Paling Boros" && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full" />}
                            {profile.trait === "Si Rajin Menabung" && <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--primary)]/5 rounded-bl-full" />}
                            
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-main)]">
                                    {profile.full_name?.[0] || '?'}
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold text-[var(--text-main)]">{profile.full_name}</div>
                                    <div className={`text-[11px] font-black uppercase tracking-wider ${
                                        profile.trait === "Si Paling Boros" ? 'text-red-500' :
                                        profile.trait === "Si Rajin Menabung" ? 'text-[var(--primary)]' :
                                        profile.trait === "Si Pelunas Hutang" ? 'text-blue-500' : 'text-[var(--primary)]'
                                    }`}>
                                        {profile.trait}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] opacity-70 leading-relaxed mb-4 line-clamp-3 relative z-10">
                                {profile.description}
                            </p>
                            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between relative z-10">
                                <div className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase">Saving Rate</div>
                                <div className="text-sm font-serif text-[var(--text-main)]">{profile.saving_rate?.toFixed(1)}%</div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-8 text-center text-[var(--text-muted)] opacity-50 italic bg-[var(--surface-card)] rounded-[28px] border border-dashed border-[var(--border)]">
                            {behavior?.is_data_sufficient ? "Belum ada profil karakter yang terdeteksi." : "Lengkapi profil keuangan keluarga dengan mulai mencatat transaksi harian."}
                        </div>
                    )}
                </div>
            </div>


            {/* Education Section (Blogs) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-[var(--text-muted)] opacity-70 tracking-[0.2em] uppercase">Edukasi & Tips</h3>
                            <div className="text-[14px] font-bold text-[var(--text-main)]">Panduan Pilihan Untukmu</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.length > 0 ? blogs.map((blog: any) => (
                        <a 
                            key={blog.id}
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/[0.03] transition-all group flex flex-col"
                        >
                            <div className="relative h-48 overflow-hidden bg-black/5">
                                {blog.featured_image ? (
                                    <img 
                                        src={blog.featured_image} 
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] opacity-20 capitalize text-4xl font-serif">
                                        {blog.title[0]}
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-dagang-dark uppercase tracking-widest shadow-sm">
                                    {blog.category?.name || 'EDUKASI'}
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h4 className="font-serif text-lg text-[var(--text-main)] leading-tight mb-3 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                                    {blog.title}
                                </h4>
                                <p className="text-xs text-[var(--text-muted)] opacity-70 leading-relaxed mb-6 line-clamp-3">
                                    {blog.meta_description || blog.content?.replace(/[#*`]/g, '').slice(0, 120) + '...'}
                                </p>
                                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[8px] font-black">
                                            {blog.author?.full_name?.[0] || 'A'}
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-60">
                                            {blog.author?.full_name?.split(' ')[0] || 'Admin'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Baca Selengkapnya <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    )) : (
                        <div className="col-span-full py-12 text-center bg-black/5 dark:bg-white/5 rounded-[32px] border-2 border-dashed border-[var(--border)]">
                            <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-[var(--text-muted)] opacity-50 font-medium">Belum ada panduan edukasi yang tersedia.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
