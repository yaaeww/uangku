import React from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Target,
    AlertCircle,
    ChevronRight,
    ArrowRightLeft
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction, Wallet as WalletModel } from '../../models';

interface DashboardOverviewProps {
    summary: any;
    wallets: WalletModel[];
    transactions: Transaction[];
    savings: any[];
    debts: any[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    summary,
    wallets,
    transactions,
    savings,
    debts
}) => {
    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalSavingBalance = savings.reduce((sum, s) => sum + s.currentBalance, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Trial Alert Banner */}
            <div className="bg-gradient-to-r from-dagang-green/10 to-transparent border-l-4 border-dagang-green rounded-r-xl p-6 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-dagang-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-dagang-green/20">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[16px] font-bold text-dagang-dark">Trial Gratis sedang aktif</div>
                        <p className="text-[14px] text-dagang-gray">Nikmati semua fitur premium selama 7 hari. Tersisa 5 hari lagi.</p>
                    </div>
                </div>
                <a href="/pricing" className="px-6 py-3 bg-dagang-green text-white rounded-full text-[14px] font-bold hover:bg-dagang-green-light transition-all whitespace-nowrap shadow-lg shadow-dagang-green/10 flex items-center gap-2 group">
                    Pilih Paket <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Posisi Uang Umum"
                    value={`Rp ${(totalWalletBalance || 0).toLocaleString()}`}
                    trend="Aktif"
                    trendUp={true}
                    color="green"
                    icon={Wallet}
                />
                <StatCard
                    title="Posisi Tabungan"
                    value={`Rp ${(totalSavingBalance || 0).toLocaleString()}`}
                    trend={`${savings.length} Target`}
                    trendUp={true}
                    color="amber"
                    icon={Target}
                />
                <StatCard
                    title="Pemasukan"
                    value={`Rp ${(summary?.total_income || 0).toLocaleString()}`}
                    trend="+5% "
                    trendUp={true}
                    color="blue"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Pengeluaran"
                    value={`Rp ${(summary?.total_expense || 0).toLocaleString()}`}
                    trend={summary?.total_expense > 0 ? "-8%" : "0%"}
                    trendUp={false}
                    color="red"
                    icon={TrendingDown}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <h3 className="text-lg font-bold mb-8 text-dagang-dark">Kategori Pengeluaran Terbesar</h3>
                    <div className="h-[280px] flex items-center justify-center">
                        <Doughnut
                            data={{
                                labels: Object.keys(summary?.category_expenses || {}),
                                datasets: [{
                                    data: Object.values(summary?.category_expenses || {}),
                                    backgroundColor: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6'],
                                    hoverBackgroundColor: ['#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb'],
                                    borderWidth: 0,
                                    spacing: 10
                                }]
                            }}
                            options={{
                                maintainAspectRatio: false,
                                cutout: '75%',
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 16,
                                            boxWidth: 8,
                                            font: { weight: 'bold', size: 11 }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <h3 className="text-lg font-bold mb-8 text-dagang-dark">Pemasukan vs Pengeluaran</h3>
                    <div className="h-[280px]">
                        <Bar
                            data={{
                                labels: ['Pemasukan', 'Pengeluaran'],
                                datasets: [{
                                    label: 'Total',
                                    data: [summary?.total_income || 0, summary?.total_expense || 0],
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
                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-dagang-dark">Status Hutang Keluarga</h3>
                        <div className="text-sm font-bold text-red-500">
                            Total Hutang: Rp {debts.reduce((s, d) => s + (d.remainingAmount || 0), 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {debts.map((debt: any) => {
                            const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                            return (
                                <div key={debt.id} className="p-5 bg-dagang-cream/10 rounded-[24px] border border-black/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="font-bold text-[14px]">{debt.name}</div>
                                        <div className="text-[12px] font-black text-dagang-green">{progress.toFixed(0)}%</div>
                                    </div>
                                    <div className="h-1.5 bg-black/5 rounded-full mb-3 overflow-hidden">
                                        <div
                                            className="h-full bg-dagang-green transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold text-dagang-gray">
                                        <span>Rp {((debt.totalAmount || 0) - (debt.remainingAmount || 0)).toLocaleString()}</span>
                                        <span>Rp {(debt.totalAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Transactions Preview */}
            <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-black/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Transaksi Terakhir</h3>
                    <button className="text-sm font-bold text-dagang-green hover:underline">Lihat Semua</button>
                </div>
                <div className="divide-y divide-black/5">
                    {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-dagang-cream/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' :
                                    tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> :
                                        tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="text-[15px] font-bold text-dagang-dark">{tx.description}</div>
                                    <div className="text-[12px] text-dagang-gray">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
                                </div>
                            </div>
                            <div className={`text-[16px] font-bold ${tx.type === 'income' ? 'text-dagang-green' :
                                tx.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                                }`}>
                                {tx.type === 'income' ? '+' : '-'} Rp {(tx.amount || 0).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="p-12 text-center text-dagang-gray italic">Belum ada aktivitas baru.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, trend, trendUp, color, icon: Icon }: any) => {
    const colors: any = {
        green: 'bg-green-50 text-dagang-green',
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div className={`text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </div>
            </div>
            <div className="text-[12px] font-black text-dagang-gray/50 tracking-[0.1em] uppercase mb-2">{title}</div>
            <div className="text-[30px] font-serif text-dagang-dark leading-none">{value}</div>
        </div>
    );
};
