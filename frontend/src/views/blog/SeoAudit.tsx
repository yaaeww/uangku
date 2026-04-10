import { useState } from 'react';
import { 
    Activity,
    Search,
    RefreshCw,
    Globe,
    Zap,
    ShieldCheck,
    Layout,
    ChevronUp,
    ChevronDown,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SeoAudit = () => {
    const [url, setUrl] = useState('https://uangku.id');
    const [isLoading, setIsLoading] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

    const runAudit = () => {
        setIsLoading(true);
        // Simulate audit delay
        setTimeout(() => {
            setAuditData({
                scores: {
                    performance: 92,
                    accessibility: 88,
                    bestPractices: 100,
                    seo: 95
                },
                audits: [
                    { id: 'lcp', title: 'Largest Contentful Paint', score: 95, status: 'pass', desc: 'LCP is 1.2s, which is well within the healthy range.' },
                    { id: 'cls', title: 'Cumulative Layout Shift', score: 100, status: 'pass', desc: 'Your page layout is stable.' },
                    { id: 'meta', title: 'Document has a meta description', score: 100, status: 'pass', desc: 'Meta description is present and properly formatted.' },
                    { id: 'alt', title: 'Image elements have [alt] attributes', score: 80, status: 'average', desc: 'Some images are missing alt tags, which affects accessibility and SEO.' },
                ],
                opportunities: [
                    { title: 'Optimize Images', saving: '1.2s', desc: 'Serving images in next-gen formats (WebP/AVIF) could save bandwidth.' },
                    { title: 'Remove Unused CSS', saving: '0.5s', desc: 'Cleaning up unused styles can speed up initial rendering.' }
                ]
            });
            setIsLoading(false);
        }, 2000);
    };

    const ScoreCircle = ({ score, label, icon: Icon, color }: any) => (
        <div className="flex flex-col items-center gap-3">
            <div className={`relative w-24 h-24 rounded-full border-4 ${color.border} flex flex-col items-center justify-center bg-[var(--surface-card)] shadow-inner`}>
                <Icon className={`w-5 h-5 ${color.text} opacity-50 mb-1`} />
                <span className={`text-2xl font-serif font-bold ${color.text}`}>{score}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
        </div>
    );

    const colors: any = {
        emerald: { text: 'text-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-500/5' },
        amber: { text: 'text-amber-500', border: 'border-amber-500', bg: 'bg-amber-500/5' },
        blue: { text: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-500/5' },
        purple: { text: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-500/5' }
    };

    return (
        <div className="space-y-10">
            {/* Action Bar */}
            <div className="bg-[var(--surface-card)] border border-[var(--border)] p-6 rounded-[32px] shadow-sm flex items-center justify-between gap-6">
                <div className="flex-1 flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-3 gap-4">
                    <Globe className="w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="bg-transparent border-none focus:ring-0 text-sm font-mono flex-1 text-[var(--text-main)]"
                    />
                </div>
                <button 
                    onClick={runAudit}
                    disabled={isLoading}
                    className="bg-[var(--text-main)] text-[var(--background)] px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/5"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Scanning...' : 'Run New Audit'}
                </button>
            </div>

            <main className="">
                {!auditData && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-20 h-20 bg-[var(--primary)]/5 rounded-full flex items-center justify-center text-[var(--primary)] mb-6 border border-[var(--primary)]/10">
                            <Search className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-serif mb-3 text-[var(--text-main)]">Ready for a check-up?</h2>
                        <p className="text-[var(--text-muted)] max-w-md mx-auto">Enter your URL and we'll analyze your site's SEO, performance, and accessibility in real-time.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 text-center animate-pulse">
                        <RefreshCw className="w-16 h-16 text-[var(--primary)] animate-spin mb-6" />
                        <h2 className="text-2xl font-serif mb-2 text-[var(--text-main)]">Analyzing Website...</h2>
                        <p className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-widest">Scanning {url}</p>
                    </div>
                )}

                {auditData && !isLoading && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 bg-[var(--surface-card)] p-10 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[100px] -z-0" />
                            <ScoreCircle score={auditData.scores.performance} label="Performance" icon={Zap} color={colors.emerald} />
                            <ScoreCircle score={auditData.scores.accessibility} label="Accessibility" icon={Activity} color={colors.blue} />
                            <ScoreCircle score={auditData.scores.bestPractices} label="Best Practices" icon={ShieldCheck} color={colors.purple} />
                            <ScoreCircle score={auditData.scores.seo} label="SEO Health" icon={Search} color={colors.amber} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Detailed Results */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-serif flex items-center gap-3 text-[var(--text-main)]">
                                    <Layout className="w-5 h-5 text-[var(--primary)]" /> Detailed Audit
                                </h3>
                                <div className="space-y-3">
                                    {auditData.audits.map((audit: any) => (
                                        <div key={audit.id} className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                                            <div 
                                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface)] transition-colors"
                                                onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${audit.status === 'pass' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className="text-sm font-bold text-[var(--text-main)]">{audit.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-sm font-black mono ${audit.status === 'pass' ? 'text-emerald-500' : 'text-amber-500'}`}>{audit.score}</span>
                                                    {expandedAudit === audit.id ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {expandedAudit === audit.id && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-10 pb-4"
                                                    >
                                                        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{audit.desc}</p>
                                                        <a href="#" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 hover:underline">
                                                            Learn more about this <Info className="w-3 h-3" />
                                                        </a>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Opportunities */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-serif flex items-center gap-3 text-[var(--text-main)]">
                                    <Zap className="w-5 h-5 text-amber-500" /> Opportunities
                                </h3>
                                <div className="space-y-4">
                                    {auditData.opportunities.map((opp: any, i: number) => (
                                        <div key={i} className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[28px] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Zap className="w-12 h-12 text-amber-500" />
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-[var(--text-main)]">{opp.title}</h4>
                                                <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-1 rounded-md uppercase tracking-widest">
                                                    Save ~{opp.saving}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{opp.desc}</p>
                                        </div>
                                    ))}
                                    
                                    {/* Pro Tip */}
                                    <div className="bg-[var(--text-main)] text-[var(--background)] p-8 rounded-[32px] shadow-xl relative overflow-hidden mt-8">
                                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--background)]/5 rounded-full translate-x-10 translate-y-10" />
                                        <h4 className="font-serif text-xl mb-2">Pro SEO Tip 💡</h4>
                                        <p className="text-xs opacity-60 leading-relaxed mb-6">
                                            Content length and high-quality keywords are great, but page speed is the new "King" of ranking. Always optimize your images before uploading!
                                        </p>
                                        <button className="text-[10px] font-black uppercase tracking-widest bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
                                            Download Report (PDF)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
