import React from 'react';
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
    UserPlus
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);
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
            {summary?.family?.status === 'trial' && (
                <div className="bg-gradient-to-r from-dagang-green/10 to-transparent border-l-4 border-dagang-green rounded-r-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-dagang-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-dagang-green/20 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[14px] sm:text-[16px] font-bold text-dagang-dark">Trial Gratis sedang aktif</div>
                            <p className="text-[12px] sm:text-[14px] text-dagang-gray">
                                {(() => {
                                    const trialEnds = new Date(summary.family.trial_ends_at);
                                    const diff = trialEnds.getTime() - new Date().getTime();
                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                    const remaining = days > 0 ? days : 0;
                                    return `Nikmati semua fitur premium. Tersisa ${remaining} hari lagi.`;
                                })()}
                            </p>
                        </div>
                    </div>
                    <a href="/pricing" className="w-full sm:w-auto px-6 py-3 bg-dagang-green text-white rounded-full text-[14px] font-bold hover:bg-dagang-green-light transition-all whitespace-nowrap shadow-lg shadow-dagang-green/10 flex items-center justify-center sm:justify-start gap-2 group">
                        Pilih Paket <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            )}

            {/* Setup Checklist Guide */}
            <SetupChecklist 
                summary={summary} 
                wallets={wallets} 
                transactions={transactions} 
            />

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
                    value={`Rp ${(summary?.totalIncome || 0).toLocaleString()}`}
                    trend={`${(summary?.trendIncome || 0).toFixed(1)}%`}
                    trendUp={(summary?.trendIncome || 0) >= 0}
                    color="blue"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Pengeluaran"
                    value={`Rp ${(summary?.totalExpense || 0).toLocaleString()}`}
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

                <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-8 border-b border-black/5 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Transaksi Terbaru</h3>
                        <button className="text-sm font-bold text-dagang-green hover:underline">Lihat Semua</button>
                    </div>
                    <div className="divide-y divide-black/5 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                        {transactions.slice(0, 8).map((tx) => (
                            <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-dagang-cream/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' :
                                        tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> :
                                            tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-dagang-dark truncate max-w-[120px]">{tx.description}</div>
                                        <div className="text-[11px] text-dagang-gray">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                                    </div>
                                </div>
                                <div className={`text-[14px] font-bold ${tx.type === 'income' ? 'text-dagang-green' :
                                    tx.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                    {tx.type === 'income' ? '+' : '-'}Rp{(tx.amount || 0).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="p-12 text-center text-dagang-gray italic">Belum ada aktivitas baru.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Charts Section - Secondary focus now */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <h3 className="text-lg font-bold mb-8 text-dagang-dark">Kategori Pengeluaran Terbesar</h3>
                    <div className="h-[280px] flex items-center justify-center">
                        <Doughnut
                            id="expense-doughnut"
                            data={{
                                labels: Object.keys(summary?.expenseByCategory || {}),
                                datasets: [{
                                    data: Object.values(summary?.expenseByCategory || {}),
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
        </div>
    );
};

const MonthlyCalendar = ({ dailyActivity }: { dailyActivity: any }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthName = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const dayLabels = ['SM', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'];

    return (
        <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm h-full">
            <h3 className="text-[11px] font-black text-dagang-gray/50 tracking-[0.2em] uppercase mb-1">Aktivitas Bulan Ini</h3>
            <div className="text-xl font-serif mb-8 text-dagang-dark">{monthName}</div>

            <div className="grid grid-cols-7 gap-3">
                {dayLabels.map(label => (
                    <div key={label} className="text-center text-[10px] font-black text-dagang-gray/40 pb-4">{label}</div>
                ))}

                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

                    const activity = dailyActivity ? dailyActivity[day] : null;
                    const isToday = day === today.getDate();

                    return (
                        <div
                            key={day}
                            className={`aspect-square rounded-[18px] border border-black/[0.03] p-1.5 flex flex-col items-center justify-between relative transition-all group hover:bg-dagang-cream/50 hover:shadow-sm
                                ${isToday ? 'bg-dagang-green/5 border-dagang-green/20 ring-2 ring-dagang-green/20' : 'bg-dagang-cream/5'}
                            `}
                        >
                            <span className={`text-[12px] font-bold ${isToday ? 'text-dagang-green' : 'text-dagang-dark/30 group-hover:text-dagang-dark'}`}>{day}</span>
                            <div className="flex flex-col gap-0.5 items-center w-full">
                                {activity && activity.expense > 0 && (
                                    <div className="text-[8px] font-black text-red-500 bg-red-50 px-1 rounded-md py-0.5 w-full text-center truncate">
                                        -{Math.round(activity.expense / 1000)}RB
                                    </div>
                                )}
                                {activity && activity.income > 0 && (
                                    <div className="text-[8px] font-black text-dagang-green bg-green-50 px-1 rounded-md py-0.5 w-full text-center truncate">
                                        +{Math.round(activity.income / 1000)}RB
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const StatCard = ({ title, value, trend, trendUp, color, icon: Icon }: any) => {
    const colors: any = {
        green: 'bg-green-50 text-dagang-green',
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border border-black/5 shadow-sm group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${colors[color]} shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className={`text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-lg uppercase tracking-wider ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </div>
            </div>
            <div className="text-[11px] sm:text-[12px] font-black text-dagang-gray/50 tracking-[0.1em] uppercase mb-2">{title}</div>
            <div className="text-[24px] sm:text-[30px] font-serif text-dagang-dark leading-none break-words">{value}</div>
        </div>
    );
};

const SetupChecklist = ({ summary, wallets, transactions }: any) => {
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
            completed: !!summary?.expenseByCategory && Object.keys(summary.expenseByCategory).length > 0,
            icon: PieChart,
            link: 'budget'
        },
        {
            id: 'invite',
            title: 'Ajak Anggota Keluarga',
            desc: 'Undang istri atau anak agar pencatatan jadi satu pintu.',
            completed: summary?.family?.memberCount > 1,
            icon: UserPlus,
            link: 'family'
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    if (progress === 100) return null; // Hide if 100% done

    return (
        <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden p-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-xl font-serif text-dagang-dark mb-1">Panduan Pengaturan 🚀</h3>
                    <p className="text-sm text-dagang-gray">Selesaikan langkah berikut agar dashboard berjalan maksimal.</p>
                </div>
                <div className="flex items-center gap-4 bg-dagang-cream/30 px-5 py-3 rounded-2xl">
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-dagang-gray/50">Progres Setup</div>
                        <div className="text-lg font-serif text-dagang-green">{progress}% Selesai</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-dagang-green/10 border-t-dagang-green flex items-center justify-center text-[12px] font-bold text-dagang-green">
                        {completedCount}/{steps.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step) => (
                    <div 
                        key={step.id}
                        className={`group relative p-6 rounded-[28px] border transition-all duration-300 ${
                            step.completed 
                            ? 'bg-dagang-green/5 border-dagang-green/10' 
                            : 'bg-white border-black/5 hover:border-dagang-green/20 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                step.completed ? 'bg-dagang-green text-white' : 'bg-dagang-cream text-dagang-gray'
                            }`}>
                                <step.icon className="w-6 h-6" />
                            </div>
                            {step.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-dagang-green animate-in zoom-in" />
                            ) : (
                                <Circle className="w-6 h-6 text-dagang-gray/20" />
                            )}
                        </div>
                        <div className="font-bold text-[15px] mb-1">{step.title}</div>
                        <p className="text-[12px] text-dagang-gray leading-relaxed mb-4">{step.desc}</p>
                        
                        {!step.completed && (
                            <a 
                                href={step.link} 
                                className="text-[12px] font-black uppercase tracking-widest text-dagang-green hover:text-dagang-dark transition-colors flex items-center gap-1"
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
