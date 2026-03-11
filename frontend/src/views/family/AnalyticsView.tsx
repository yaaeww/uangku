import React from 'react';
import {
    PieChart,
    BarChart3,
    TrendingUp,
    ChevronRight,
    Search,
    Download
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Transaction, Wallet as WalletModel } from '../../models';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AnalyticsViewProps {
    transactions: Transaction[];
    wallets: WalletModel[];
    summary: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    transactions,
    // wallets,
    // summary
}) => {
    // Helper to calculate category distribution
    const categoryData = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((acc: any, tx) => {
            const cat = tx.category || 'Lainnya';
            acc[cat] = (acc[cat] || 0) + tx.amount;
            return acc;
        }, {});

    const sortedCategories = Object.entries(categoryData)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 6);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif text-dagang-dark">Analisa Keuangan Lanjutan</h2>
                    <p className="text-dagang-gray text-sm mt-1">Dapatkan wawasan mendalam tentang pola pengeluaran dan kesehatan finansial keluarga.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white border border-black/5 rounded-xl text-dagang-gray hover:text-dagang-green transition-all shadow-sm">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="px-6 py-3 bg-white border border-black/5 text-dagang-dark rounded-xl font-bold hover:bg-dagang-cream/50 transition-all shadow-sm flex items-center gap-2">
                        <Download className="w-5 h-5" /> Export Laporan
                    </button>
                </div>
            </div>

            {/* Performance Overview Line Chart */}
            <div className="bg-white rounded-[32px] p-10 border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-lg font-bold text-dagang-dark">Tren Kas Bulanan</h3>
                        <p className="text-xs text-dagang-gray mt-1">Perbandingan Pemasukan vs Pengeluaran 6 bulan terakhir</p>
                    </div>
                    <div className="flex p-1 bg-dagang-cream rounded-lg">
                        <button className="px-4 py-1.5 text-[11px] font-bold bg-white text-dagang-green rounded-md shadow-sm">Income</button>
                        <button className="px-4 py-1.5 text-[11px] font-bold text-dagang-gray hover:text-dagang-dark">Expense</button>
                    </div>
                </div>
                <div className="h-[350px]">
                    <Line
                        data={{
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                            datasets: [
                                {
                                    label: 'Pemasukan',
                                    data: [5000000, 6200000, 5800000, 7500000, 7000000, 8200000],
                                    borderColor: '#22c55e',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: '#22c55e',
                                    pointBorderWidth: 4,
                                    pointBorderColor: '#fff',
                                    pointRadius: 6,
                                    pointHoverRadius: 8
                                },
                                {
                                    label: 'Pengeluaran',
                                    data: [4200000, 4000000, 4500000, 5200000, 4800000, 5500000],
                                    borderColor: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: '#ef4444',
                                    pointBorderWidth: 4,
                                    pointBorderColor: '#fff',
                                    pointRadius: 6,
                                    pointHoverRadius: 8
                                }
                            ]
                        }}
                        options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: { usePointStyle: true, boxWidth: 6, font: { weight: 'bold', size: 12 } }
                                },
                                tooltip: {
                                    backgroundColor: '#111',
                                    padding: 12,
                                    titleFont: { size: 14, weight: 'bold' },
                                    bodyFont: { size: 13 },
                                    intersect: false,
                                    mode: 'index'
                                }
                            },
                            scales: {
                                y: {
                                    grid: { color: 'rgba(0,0,0,0.03)' },
                                    border: { display: false },
                                    ticks: { font: { weight: 'bold' }, callback: (v: any) => `Rp ${v / 1000000}jt` }
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Distribution */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-black/5 shadow-sm">
                    <h3 className="text-lg font-bold mb-10 text-dagang-dark flex items-center gap-3">
                        <PieChart className="w-5 h-5 text-dagang-accent" /> Struktur Pengeluaran
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="h-[250px]">
                            <Doughnut
                                data={{
                                    labels: sortedCategories.map(([k]) => k),
                                    datasets: [{
                                        data: sortedCategories.map(([, v]) => v),
                                        backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#06b6d4'],
                                        borderWidth: 0,
                                        spacing: 10
                                    }]
                                }}
                                options={{
                                    maintainAspectRatio: false,
                                    cutout: '80%',
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <div className="space-y-5">
                            {sortedCategories.map(([cat, amount]: any, i) => (
                                <div key={cat} className="space-y-1.5 text-xs font-bold">
                                    <div className="flex justify-between items-center bg-dagang-cream/30 p-3 rounded-xl border border-black/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#06b6d4'][i] }} />
                                            <span className="text-dagang-dark">{cat}</span>
                                        </div>
                                        <span className="text-dagang-gray">Rp {amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1 bg-dagang-cream/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(amount / (transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0) || 1)) * 100}%`,
                                                backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#06b6d4'][i]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Growth Insights */}
                <div className="bg-dagang-green text-white rounded-[32px] p-10 border border-black/5 shadow-xl shadow-dagang-green/10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 blur-3xl" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-serif mb-4 leading-tight">Tabungan Anda Tumbuh 12%</h3>
                        <p className="text-white/70 text-sm leading-relaxed mb-6">Bagus! Pengeluaran bulan ini turun 8% dibanding bulan lalu, memungkinkan Anda menabung lebih banyak.</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-3">
                                <span className="text-white/60">Status Target Liburan</span>
                                <span>85%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-dagang-accent w-[85%]" />
                            </div>
                        </div>
                    </div>
                    <button className="mt-10 py-4 bg-white text-dagang-green rounded-xl font-bold text-sm hover:bg-dagang-cream transition-all flex items-center justify-center gap-2 group relative z-10">
                        Rincian Profit <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Monthly Recap Bar Chart */}
            <div className="bg-white rounded-[32px] p-10 border border-black/5 shadow-sm">
                <h3 className="text-lg font-bold mb-10 text-dagang-dark flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-dagang-accent" /> Rekapitulasi Kas Per Bulan
                </h3>
                <div className="h-[300px]">
                    <Bar
                        data={{
                            labels: ['Mar', 'Apr', 'Mei', 'Jun'],
                            datasets: [{
                                label: 'Laba Bersih',
                                data: [1300000, 2300000, 2200000, 2700000],
                                backgroundColor: '#22c55e',
                                borderRadius: 16,
                                barThickness: 45,
                                hoverBackgroundColor: '#16a34a'
                            }]
                        }}
                        options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: {
                                    grid: { color: 'rgba(0,0,0,0.03)' },
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
    );
};
