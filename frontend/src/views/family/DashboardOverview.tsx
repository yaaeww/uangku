import React, { useState } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Target,
    AlertCircle,
    ChevronRight,
    ArrowRightLeft,
    CheckCircle2,
    Circle,
    Camera,
    CreditCard,
    Banknote,
    PieChart,
    UserPlus,
    Clock,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction, Wallet as WalletModel } from '../../models';

interface DashboardOverviewProps {
    summary: any;
    wallets: WalletModel[];
    transactions: Transaction[];
    savings: any[];
    goals: any[];
    debts: any[];
    assets?: any[];
    budgetCategories?: any[];
    familyMembers?: any[];
    familyRole?: string;
    currentUserId?: string;
}

const formatCompact = (val: number) => {
    if (!val) return '0';
    if (val < 1000) return val.toString();
    if (val < 1000000) return `${Math.round(val / 1000)}K`;
    if (val < 1000000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}Jt`;
    return `${(val / 1000000000).toFixed(1).replace(/\.0$/, '')}M`;
};

const SubscriptionBanner = ({ family }: { family: any }) => {
    if (!family || (family.status !== 'trial' && family.status !== 'active')) return null;

    const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = family.status === 'trial' ? family.trial_ends_at : family.subscription_ends_at;
            if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            
            const target = new Date(targetDate).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [family.trial_ends_at, family.subscription_ends_at, family.status]);

    const isTrial = family.status === 'trial';
    const planName = family.subscription_plan || 'Standard';

    return (
        <div className={`bg-gradient-to-r ${isTrial ? 'from-dagang-green/10' : 'from-dagang-accent/10'} to-transparent border-l-4 ${isTrial ? 'border-dagang-green' : 'border-dagang-accent'} rounded-r-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700`}>
            <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${isTrial ? 'bg-dagang-green' : 'bg-dagang-accent'} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ${isTrial ? 'shadow-dagang-green/20' : 'shadow-dagang-accent/20'} shrink-0`}>
                    {isTrial ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div>
                    <div className="text-[13px] sm:text-[16px] font-bold text-[var(--text-main)] flex items-center gap-2">
                        {isTrial ? 'Trial Gratis sedang aktif' : `Paket ${planName} Aktif`}
                        {!isTrial && (
                            <span className="px-1.5 py-0.5 bg-dagang-accent/20 text-dagang-accent text-[8px] sm:text-[10px] font-black uppercase rounded-md tracking-widest">Premium</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:mt-1">
                        <span className="text-[11px] sm:text-[14px] text-[var(--text-muted)]">
                            {isTrial ? 'Tersisa:' : 'Masa aktif:'}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-1">
                            {[
                                { val: timeLeft.days, unit: 'H' },
                                { val: timeLeft.hours, unit: 'J' },
                                { val: timeLeft.minutes, unit: 'M' },
                                { val: timeLeft.seconds, unit: 'D' }
                            ].map((t, i) => (
                                <React.Fragment key={t.unit}>
                                    <div className={`flex items-baseline gap-0.5 px-1.5 py-0.5 ${isTrial ? 'bg-dagang-green/10' : 'bg-dagang-accent/10'} rounded-md`}>
                                        <span className={`text-[11px] sm:text-[13px] font-black ${isTrial ? 'text-dagang-green' : 'text-dagang-accent'} tabular-nums`}>
                                            {String(t.val).padStart(2, '0')}
                                        </span>
                                        <span className={`text-[8px] sm:text-[9px] font-bold ${isTrial ? 'text-dagang-green/40' : 'text-dagang-accent/40'}`}>{t.unit}</span>
                                    </div>
                                    {i < 3 && <span className={`${isTrial ? 'text-dagang-green/20' : 'text-dagang-accent/20'} font-bold text-[10px]`}>:</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {isTrial ? (
                    <Link to={`/${encodeURIComponent(family.name)}/dashboard/family/pricing`} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-dagang-green text-white rounded-full text-[12px] sm:text-[14px] font-bold hover:bg-dagang-green-light transition-all whitespace-nowrap shadow-lg shadow-dagang-green/10 flex items-center justify-center gap-2 group">
                        Pilih Paket <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                ) : (
                    <>
                        <Link to={`/${encodeURIComponent(family.name)}/dashboard/family/pricing`} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-dagang-green text-white rounded-full text-[12px] sm:text-[14px] font-bold hover:bg-dagang-green-light transition-all whitespace-nowrap shadow-lg shadow-dagang-green/10 flex items-center justify-center gap-2 group">
                            Perpanjang <Clock className="w-4 h-4" />
                        </Link>
                        <Link to={`/${encodeURIComponent(family.name)}/dashboard/family/pricing`} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[var(--surface-card)] text-[var(--text-main)] border border-[var(--border)] rounded-full text-[12px] sm:text-[14px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all whitespace-nowrap shadow-sm flex items-center justify-center gap-2 group">
                            Ganti Paket <ArrowRightLeft className="w-4 h-4" />
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    summary,
    wallets,
    transactions,
    savings,
    goals = [],
    debts,
    budgetCategories = [],
    familyMembers = [],
    familyRole = 'member',
    currentUserId,
    assets = []
}) => {
    // Filter wallets: members only see their own
    const displayedWallets = (familyRole === 'head_of_family' || familyRole === 'treasurer')
        ? wallets
        : wallets.filter(w => w.userId === currentUserId);

    const totalWalletBalance = displayedWallets.reduce((sum, w) => sum + w.balance, 0);
    const totalGoalsBalance = goals.reduce((sum, g) => sum + (g.currentBalance || 0), 0);
    const totalSavingBalance = savings.reduce((sum, s) => sum + (s.currentBalance || 0), 0) + totalGoalsBalance;
    const totalAssetValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);
    const totalRemainingDebt = debts.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

    // netWorth uses summary data if available (already RBAC-filtered in backend)
    // but we can also use frontend state for real-time reactivity
    const netWorth = totalWalletBalance + totalAssetValue - totalRemainingDebt;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Subscription & Trial Status */}
            <SubscriptionBanner family={summary?.family} />

            {/* Setup Checklist Guide */}
            <SetupChecklist
                summary={summary}
                wallets={displayedWallets}
                transactions={transactions}
                budgetCategories={budgetCategories}
                familyMembers={familyMembers}
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Kekayaan Bersih"
                    value={`Rp ${(netWorth || 0).toLocaleString('id-ID')}`}
                    trend="Total"
                    trendUp={true}
                    color="green"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Posisi Tabungan"
                    value={`Rp ${(totalSavingBalance || 0).toLocaleString('id-ID')}`}
                    trend={`${savings.length + goals.length} Target`}
                    trendUp={true}
                    color="amber"
                    icon={Target}
                />
                <StatCard
                    title="Pemasukan"
                    value={`Rp ${(summary?.totalIncome || 0).toLocaleString('id-ID')}`}
                    trend={`${(summary?.trendIncome || 0).toFixed(1)}%`}
                    trendUp={(summary?.trendIncome || 0) >= 0}
                    color="blue"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Pengeluaran"
                    value={`Rp ${(summary?.totalExpense || 0).toLocaleString('id-ID')}`}
                    trend={`${Math.abs(summary?.trendExpense || 0).toFixed(1)}%`}
                    trendUp={(summary?.trendExpense || 0) < 0} // Expense trend up is bad for wallet, but "trendUp" as a UI prop usually means "is the number higher than before". Let's follow typical dashboard logic: green for good (income up, expense down).
                    color="red"
                    icon={TrendingDown}
                />
            </div>

            {/* Activity Calendar & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <MonthlyCalendar dailyActivity={summary?.dailyActivity} />
                </div>

                <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-300">
                    <div className="p-8 border-b border-[var(--border)] flex items-center justify-between">
                        <h3 className="text-h4 font-heading text-[var(--text-main)]">Transaksi Terbaru</h3>
                        <Link 
                            to={`/${encodeURIComponent(summary?.family?.name)}/dashboard/transactions`} 
                            className="text-body-s font-bold text-dagang-green hover:underline"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="divide-y divide-[var(--border)] flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                        {transactions.slice(0, 8).map((tx) => (
                            <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-dagang-green/10 text-dagang-green' :
                                        tx.type === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> :
                                            tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-[var(--text-main)] truncate max-w-[120px]">{tx.description}</div>
                                        <div className="text-[11px] text-[var(--text-muted)] opacity-60">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                                    </div>
                                </div>
                                <div className={`text-[14px] font-bold ${tx.type === 'income' ? 'text-dagang-green' :
                                    tx.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                    {tx.type === 'income' ? '+' : '-'}Rp{(tx.amount || 0).toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="p-12 text-center text-[var(--text-muted)] italic opacity-70">Belum ada aktivitas baru.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Charts Section - Secondary focus now */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--surface-card)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm transition-colors duration-300">
                    <h3 className="text-h4 font-heading mb-8 text-[var(--text-main)]">Alokasi Target Budget</h3>
                    <div className="h-[280px] flex items-center justify-center relative">
                        {(() => {
                            if (!budgetCategories || budgetCategories.length === 0) return (
                                <div className="text-center w-full">
                                    <AlertCircle className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                                    <p className="text-[var(--text-muted)] text-sm opacity-60">Belum ada pengaturan budget.</p>
                                    <Link to={`/${encodeURIComponent(summary?.family?.name || '')}/dashboard/budget`} className="text-dagang-green text-xs font-bold mt-2 inline-block">Atur Budget Sekarang</Link>
                                </div>
                            );

                            const colorMap: Record<string, string> = {
                                'text-blue-500': '#3b82f6',
                                'text-red-500': '#ef4444',
                                'text-green-500': '#22c55e',
                                'text-emerald-500': '#10b981',
                                'text-purple-500': '#a855f7',
                                'text-yellow-500': '#eab308',
                                'text-amber-500': '#f59e0b',
                                'text-orange-500': '#f97316',
                                'text-pink-500': '#ec4899',
                                'text-indigo-500': '#6366f1',
                                'text-teal-500': '#14b8a6',
                                'text-cyan-500': '#06b6d4',
                                'text-rose-500': '#f43f5e',
                                'text-fuchsia-500': '#d946ef',
                            };

                            const parentLabels: string[] = [];
                            const parentData: number[] = [];
                            const parentBg: string[] = [];

                            const subLabels: string[] = [];
                            const subData: number[] = [];
                            const subBg: string[] = [];

                            const totalBudgetBase = summary?.totalFamilyBudget || summary?.userBudget || 0;

                            budgetCategories.forEach((cat: any) => {
                                parentLabels.push(cat.name);
                                const catBudget = totalBudgetBase > 0 ? (totalBudgetBase * cat.percentage) / 100 : cat.percentage; 
                                parentData.push(catBudget);
                                
                                const baseColor = colorMap[cat.color] || '#94a3b8';
                                parentBg.push(baseColor);

                                const items = cat.items || [];
                                if (items.length === 0) {
                                    subLabels.push(`${cat.name} (Utuh)`);
                                    subData.push(catBudget);
                                    subBg.push(baseColor + '80'); // 50% opacity hex
                                } else {
                                    let unallocated = catBudget;
                                    items.forEach((item: any) => {
                                        const target = item.targetAmount || item.target_amount || 0;
                                        subLabels.push(item.name);
                                        subData.push(target);
                                        subBg.push(baseColor + 'CC'); // 80% opacity
                                        unallocated -= target;
                                    });
                                    if (unallocated > 0) {
                                        subLabels.push(`Sisa ${cat.name}`);
                                        subData.push(unallocated);
                                        subBg.push('#e2e8f0'); // gray for unallocated
                                    }
                                }
                            });

                            return (
                                <Doughnut
                                    key={`budget-chart-${budgetCategories.length}`}
                                    id="budget-doughnut"
                                    data={{
                                        labels: [...parentLabels, ...subLabels],
                                        datasets: [
                                            {
                                                data: parentData,
                                                backgroundColor: parentBg,
                                                borderWidth: 2,
                                                borderColor: 'var(--surface-card)',
                                                hoverOffset: 4,
                                            },
                                            {
                                                data: subData,
                                                backgroundColor: subBg,
                                                borderWidth: 2,
                                                borderColor: 'var(--surface-card)',
                                                hoverOffset: 4,
                                            }
                                        ]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        cutout: '50%',
                                        plugins: {
                                            legend: {
                                                display: false // Too many labels to show standard legend, rely on hover
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context: any) {
                                                        const label = context.chart.data.labels[context.dataIndex] || '';
                                                        const val = context.raw || 0;
                                                        return ` ${label}: Rp ${val.toLocaleString('id-ID')}`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            );
                        })()}
                    </div>
                </div>

                <div className="bg-[var(--surface-card)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm transition-colors duration-300">
                    <h3 className="text-h4 font-heading mb-8 text-[var(--text-main)]">Pemasukan vs Pengeluaran</h3>
                    <div className="h-[280px]">
                        <Bar
                            id="income-expense-bar"
                            data={{
                                labels: ['Pemasukan', 'Pengeluaran'],
                                datasets: [{
                                    label: 'Total',
                                    data: [summary?.totalIncome || 0, summary?.totalExpense || 0],
                                    backgroundColor: ['#22c55e', '#ef4444'],
                                    borderRadius: 12,
                                    barThickness: 64
                                }]
                            }}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        grid: { color: '#f8fafc' },
                                        border: { display: false },
                                        ticks: { font: { weight: 'bold' } }
                                    },
                                    x: {
                                        grid: { display: false },
                                        border: { display: false },
                                        ticks: { font: { weight: 'bold' } }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Debt Progress Section */}
            {debts.length > 0 && (
                <div className="bg-[var(--surface-card)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm transition-colors duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-h4 font-heading text-[var(--text-main)]">Status Hutang Keluarga</h3>
                            <Link 
                                to={`/${encodeURIComponent(summary?.family?.name)}/dashboard/debts`} 
                                className="text-body-s font-bold text-dagang-green hover:underline"
                            >
                                Kelola Hutang
                            </Link>
                        </div>
                        <div className="text-body-s font-bold text-red-500">
                            Total Hutang: Rp {debts.reduce((s, d) => s + (d.remainingAmount || 0), 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {debts.map((debt: any) => {
                            const total = Number(debt.totalAmount) || 0;
                            const remaining = Number(debt.remainingAmount) || 0;
                            const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
                            return (
                                <div key={debt.id} className="p-5 bg-black/5 dark:bg-white/5 rounded-[24px] border border-[var(--border)]">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="font-bold text-[14px] text-[var(--text-main)]">{debt.name}</div>
                                        <div className="text-[12px] font-black text-dagang-green">{progress.toFixed(0)}%</div>
                                    </div>
                                    <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full mb-3 overflow-hidden">
                                        <div
                                            className="h-full bg-dagang-green transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold text-[var(--text-muted)] opacity-60">
                                        <span>Rp {(total - remaining).toLocaleString('id-ID')}</span>
                                        <span>Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MonthlyCalendar = ({ dailyActivity }: { dailyActivity: any }) => {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());

    const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

    const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const dayLabels = ['SM', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'];

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const goToToday = () => {
        setViewMonth(today.getMonth());
        setViewYear(today.getFullYear());
    };

    return (
        <div className="bg-[var(--surface-card)] p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[var(--border)] shadow-sm h-full transition-colors duration-300 overflow-x-hidden">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase mb-1 opacity-70">Aktivitas Keuangan</h3>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="text-lg sm:text-xl md:text-h3 font-heading text-[var(--text-main)]">{monthName}</div>
                <div className="flex items-center gap-1 sm:gap-2">
                    {!isCurrentMonth && (
                        <button
                            onClick={goToToday}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/20 transition-all"
                        >
                            Hari Ini
                        </button>
                    )}
                    <button
                        onClick={goToPrevMonth}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                {dayLabels.map(label => (
                    <div key={label} className="text-center text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] opacity-60 pb-2 sm:pb-4">{label}</div>
                ))}

                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

                    const activity = isCurrentMonth && dailyActivity ? dailyActivity[day] : null;
                    const isToday = isCurrentMonth && day === today.getDate();
                    const isPast = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth()) || (isCurrentMonth && day < today.getDate());

                    return (
                        <div
                            key={day}
                            className={`aspect-square rounded-[12px] sm:rounded-[18px] border border-[var(--border)] p-1 flex flex-col items-center justify-between relative transition-all group hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-sm
                                ${isToday ? 'bg-dagang-green/10 border-dagang-green/30 ring-2 ring-dagang-green/10' : 'bg-black/5 dark:bg-white/5'}
                                ${!isCurrentMonth && isPast ? 'opacity-50' : ''}
                            `}
                        >
                            <span className={`text-[10px] sm:text-[12px] font-bold ${isToday ? 'text-dagang-green' : 'text-[var(--text-main)] opacity-50 group-hover:opacity-100'}`}>{day}</span>
                            <div className="flex flex-col gap-0.5 items-center w-full overflow-hidden">
                                 {activity && activity.expense > 0 && (
                                     <div className="text-[6px] sm:text-[8px] font-black text-red-500 bg-red-500/10 px-0.5 sm:px-1 rounded-md py-0.5 w-full text-center truncate mb-0.5 sm:mb-1">
                                         -{formatCompact(activity.expense)}
                                     </div>
                                 )}
                                 {activity && activity.income > 0 && (
                                     <div className="text-[6px] sm:text-[8px] font-black text-dagang-green bg-dagang-green/10 px-0.5 sm:px-1 rounded-md py-0.5 w-full text-center truncate">
                                         +{formatCompact(activity.income)}
                                     </div>
                                 )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isCurrentMonth && (
                <div className="mt-4 text-center text-[9px] sm:text-[10px] text-[var(--text-muted)] opacity-60 font-bold italic">
                    Data aktivitas tersedia untuk bulan ini saja
                </div>
            )}
        </div>
    );
}


const StatCard = ({ title, value, trend, trendUp, color, icon: Icon }: any) => {
    const colors: any = {
        green: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-700',
        red: 'bg-red-50 text-red-700',
        amber: 'bg-amber-50 text-amber-700'
    };

    return (
        <div className="bg-[var(--surface-card)] rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 border border-[var(--border)] shadow-sm group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${colors[color]} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div className={`text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2.5 py-1 rounded-lg uppercase tracking-wider ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </div>
            </div>
            <div className="text-[10px] sm:text-[12px] font-black text-[var(--text-main)] tracking-[0.1em] uppercase mb-1 sm:mb-2 opacity-80">{title}</div>
            <div className="text-[20px] sm:text-[30px] font-serif text-[var(--text-main)] font-black leading-none break-all">{value}</div>
        </div>
    );
};

const SetupChecklist = ({ summary, wallets, transactions, budgetCategories = [], familyMembers = [] }: any) => {
    const [isVisible, setIsVisible] = React.useState(!localStorage.getItem('hide_setup_guide'));
    
    const steps = [
        {
            id: 'profile',
            title: 'Lengkapi Profil Keluarga',
            desc: 'Tambahkan nama dan foto resmi keluarga bosku.',
            completed: !!summary?.family?.photo_url,
            icon: Camera,
            link: 'family'
        },
        {
            id: 'wallet',
            title: 'Tambah Dompet Utama',
            desc: 'Buat dompet pertama (Cash, Bank, atau E-Wallet).',
            completed: wallets.length > 0,
            icon: CreditCard,
            link: 'wallets'
        },
        {
            id: 'transaction',
            title: 'Catat Transaksi Pertama',
            desc: 'Coba input pemasukan atau pengeluaran pertama.',
            completed: transactions.length > 0,
            icon: Banknote,
            link: 'transactions'
        },
        {
            id: 'budget',
            title: 'Buat Anggaran Pertama',
            desc: 'Atur limit pengeluaran bulanan agar gaji tidak numpang lewat.',
            completed: budgetCategories.length > 0 || (summary?.family?.monthly_budget > 0),
            icon: PieChart,
            link: 'budget'
        },
        {
            id: 'invite',
            title: 'Ajak Anggota Keluarga',
            desc: 'Undang istri atau anak agar pencatatan jadi satu pintu.',
            completed: familyMembers.length > 1 || (summary?.memberCount > 1) || (summary?.invitationCount > 0),
            icon: UserPlus,
            link: 'family'
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    if (progress === 100 || !isVisible) return null; // Hide if 100% done or closed

    return (
        <div className="bg-[var(--surface-card)] rounded-[24px] sm:rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden p-5 sm:p-8 animate-in fade-in zoom-in duration-500 transition-colors duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg sm:text-xl font-serif text-[var(--text-main)]">Panduan Pengaturan 🚀</h3>
                        <button 
                            onClick={() => {
                                setIsVisible(false);
                                localStorage.setItem('hide_setup_guide', 'true');
                            }}
                            className="p-2 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                            title="Tutup Panduan"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[12px] sm:text-sm text-[var(--text-muted)]">Selesaikan langkah berikut agar dashboard berjalan maksimal.</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 bg-black/5 dark:bg-white/5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
                    <div className="text-right sm:text-left">
                        <div className="text-[9px] sm:text-label font-black uppercase tracking-widest text-[var(--text-muted)] opacity-70">Progres Setup</div>
                        <div className="text-h6 sm:text-h4 font-heading text-dagang-green">{progress}% Selesai</div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-dagang-green/10 border-t-dagang-green flex items-center justify-center text-[11px] sm:text-[12px] font-bold text-dagang-green">
                        {completedCount}/{steps.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`group relative p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border transition-all duration-300 ${step.completed
                                ? 'bg-dagang-green/5 border-dagang-green/10 shadow-sm'
                                : 'bg-black/5 dark:bg-white/5 border-[var(--border)] hover:border-dagang-green/20 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${step.completed ? 'bg-dagang-green text-white' : 'bg-black/10 dark:bg-white/10 text-[var(--text-muted)]'
                                }`}>
                                <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            {step.completed ? (
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-dagang-green animate-in zoom-in" />
                            ) : (
                                <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)] opacity-40" />
                            )}
                        </div>
                        <div className="font-bold text-[14px] sm:text-[15px] mb-1 text-[var(--text-main)]">{step.title}</div>
                        <p className="text-[11px] sm:text-[12px] text-[var(--text-muted)] leading-relaxed mb-4">{step.desc}</p>

                        {!step.completed && (
                            <a
                                href={step.link}
                                className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-dagang-green hover:text-dagang-green-light transition-colors flex items-center gap-1"
                            >
                                Setup Sekarang <ChevronRight className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
