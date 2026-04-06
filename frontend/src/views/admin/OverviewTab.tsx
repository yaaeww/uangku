import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    TrendingUp,
    History,
    Package,
    Users2,
    PiggyBank,
    AlertTriangle
} from 'lucide-react';

interface OverviewTabProps {
    stats: any;
    theme: string;
    plans: any[];
    financialSummary?: any;
    chartDays?: number;
    setChartDays?: (days: number) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats, theme, plans, financialSummary, chartDays = 7, setChartDays }) => {
    // Use financialSummary (from /reports) as primary source, fallback to stats
    const revenue = financialSummary?.total_revenue ?? stats?.total_revenue ?? 0;
    const expenses = financialSummary?.total_expenses ?? stats?.total_expenses ?? 0;
    const allocPct = financialSummary?.allocation_pct || 60;
    const profitPct = 100 - allocPct;
    const expenseTarget = revenue * (allocPct / 100);
    const profitTarget = revenue * (profitPct / 100);
    const actualLabaBersih = revenue - expenses;
    const labaDiff = actualLabaBersih - profitTarget;

    return (
        <div className="space-y-10">
            {/* The heading is now handled by DashboardLayout */}

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Revenue Card */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-5 sm:p-6 rounded-2xl sm:rounded-[32px] text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl">
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Pendapatan Kotor</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xl sm:text-2xl md:text-3xl font-heading font-black break-all">
                                Rp {revenue.toLocaleString('id-ID')}
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-medium opacity-80">Penjualan Paket Berhasil</div>
                        </div>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 p-5 sm:p-6 rounded-2xl sm:rounded-[32px] text-white shadow-xl shadow-rose-500/20 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/30">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl">
                                <History className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Pengeluaran</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xl sm:text-2xl md:text-3xl font-heading font-black break-all">
                                Rp {expenses.toLocaleString('id-ID')}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium opacity-80">
                                <span>Anggaran: Rp {expenseTarget.toLocaleString('id-ID')}</span>
                                {expenses > expenseTarget && expenseTarget > 0 && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black">OVER</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit Card — Dynamic */}
                <div className={`relative group overflow-hidden p-5 sm:p-6 rounded-2xl sm:rounded-[32px] text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl ${
                    actualLabaBersih >= 0 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/30' 
                    : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-500/20 hover:shadow-red-500/30'
                }`}>
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl">
                                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Laba Bersih</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xl sm:text-2xl md:text-3xl font-heading font-black break-all">
                                Rp {actualLabaBersih.toLocaleString('id-ID')}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium opacity-80">
                                {expenses > 0 ? (
                                    labaDiff >= 0 ? (
                                        <span>+Rp {labaDiff.toLocaleString('id-ID')} dari target</span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            -Rp {Math.abs(labaDiff).toLocaleString('id-ID')} dari target
                                        </span>
                                    )
                                ) : (
                                    <span>Target: Rp {profitTarget.toLocaleString('id-ID')} ({profitPct}%)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Distribution Card */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 rounded-2xl sm:rounded-[32px] text-white shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/30">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl">
                                <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">User Distribusi</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-xl sm:text-2xl md:text-3xl font-heading font-black">
                                    {stats?.total_users || 0}
                                </div>
                                <div className="text-[9px] sm:text-[10px] font-medium opacity-80 font-black uppercase tracking-tighter">Total Pengguna</div>
                            </div>
                            <div className="text-right">
                                <div className="text-base sm:text-lg font-black">{stats?.pending_applications || 0}</div>
                                <div className="text-[7px] sm:text-[8px] font-black uppercase opacity-70">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 bg-[var(--surface-card)] p-4 sm:p-8 rounded-2xl sm:rounded-[40px] border border-[var(--border)] shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-2">
                        <div>
                            <h3 className="text-lg sm:text-xl font-heading font-bold text-[var(--text-main)]">Aktivitas Pendapatan</h3>
                            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Estimasi {chartDays === 7 ? '7 Hari' : chartDays === 30 ? '1 Bulan' : '1 Tahun'} Terakhir</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                                {[
                                    { label: '1 Minggu', value: 7 },
                                    { label: '1 Bulan', value: 30 },
                                    { label: '1 Tahun', value: 365 }
                                ].map((period) => (
                                    <button
                                        key={period.value}
                                        onClick={() => setChartDays && setChartDays(period.value)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                                            chartDays === period.value
                                                ? 'bg-[var(--surface-card)] text-[var(--text-main)] shadow-sm'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Revenue</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <Line 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                        titleColor: theme === 'dark' ? '#ffffff' : '#111827',
                                        bodyColor: theme === 'dark' ? '#d1d5db' : '#4b5563',
                                        borderColor: 'rgba(0,0,0,0.1)',
                                        borderWidth: 1,
                                        padding: 12,
                                        bodyFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
                                        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
                                        callbacks: {
                                            label: (context) => `Rp ${context.parsed.y?.toLocaleString('id-ID') || 0}`
                                        }
                                    }
                                },
                                scales: {
                                    x: { 
                                        grid: { display: false },
                                        ticks: { 
                                            color: 'gray',
                                            font: { size: 10, weight: 'bold' }
                                        }
                                    },
                                    y: { 
                                        beginAtZero: true,
                                        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                                        ticks: { 
                                            color: 'gray',
                                            font: { size: 10, weight: 'bold' },
                                            callback: (value) => value.toLocaleString('id-ID')
                                        }
                                    }
                                }
                            }}
                            data={{
                                labels: stats?.activity_chart?.map((a: any) => {
                                    const d = new Date(a.date);
                                    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                                }) || [],
                                datasets: [{
                                    label: 'Pendapatan',
                                    data: stats?.activity_chart?.map((a: any) => a.revenue) || [],
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16,185,129,0.1)',
                                    borderWidth: 4,
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 4,
                                    pointBackgroundColor: '#10b981',
                                    pointBorderColor: '#fff',
                                    pointHoverRadius: 6,
                                }]
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-black/5 dark:bg-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-[40px] border border-[var(--border)]">
                        <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)] mb-4 sm:mb-6">Status Keluarga</h3>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--surface-card)] rounded-xl sm:rounded-2xl border border-[var(--border)]">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)]">Masa Trial</span>
                                </div>
                                <span className="text-base sm:text-lg font-black text-amber-500">{stats?.trial_families || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--surface-card)] rounded-xl sm:rounded-2xl border border-[var(--border)]">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-2 h-2 rounded-full bg-dagang-orange shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                                    <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)]">Berlangganan</span>
                                </div>
                                <span className="text-base sm:text-lg font-black text-dagang-orange">{stats?.active_families || 0}</span>
                            </div>
                            <div className="pt-3 sm:pt-4 border-t border-[var(--border)] flex justify-between items-center px-1 sm:px-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase text-[var(--text-muted)] opacity-60">Total Entitas</span>
                                <span className="text-xs sm:text-sm font-black text-[var(--text-main)]">{stats?.total_families || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--sidebar-bg)] p-5 sm:p-8 rounded-2xl sm:rounded-[40px] text-[var(--sidebar-text)] relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-xl border border-[var(--sidebar-border)] transition-colors">
                        <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-dagang-green/5 dark:bg-white/5 rounded-full blur-3xl group-hover:bg-dagang-green/10 dark:group-hover:bg-white/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                                <h3 className="text-base sm:text-lg font-heading font-black tracking-tight">Kesehatan Sistem</h3>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center text-[11px] sm:text-xs opacity-80">
                                    <span>API Backend</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">AKTIF</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] sm:text-xs opacity-80">
                                    <span>Database PG</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">TERHUBUNG</span>
                                </div>
                                <div className="pt-3 sm:pt-4 mt-2 border-t border-[var(--sidebar-border)]">
                                    <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60">Uptime Session</div>
                                    <div className="text-xs sm:text-sm font-black mt-1">99.98% Reliable</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
