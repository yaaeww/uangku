import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    Users,
    Settings,
    Bell,
    Target,
    LogOut,
    ChevronDown,
    Menu,
    Plus,
    X,
    Home,
    History,
    Banknote
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { FinanceController } from '../controllers/FinanceController';
import { Transaction, Wallet as WalletModel } from '../models';
import { useParams, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';

const CATEGORIES = [
    'Sembako', 'PLN', 'PDAM', 'Air Minum + Gas', 'Jajan', 'Warung Sayur',
    'Wifi', 'Internet HP', 'Cicilan', 'Gofood / Shopee Food', 'Healing',
    'Bensin', 'Parkir + Sampah', 'BPJS', 'Iuran RT', 'Pengeluaran Tabungan', 'Lainnya'
];

export const FamilyDashboard = () => {
    const { familyName: urlFamilyName } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallets, setWallets] = useState<WalletModel[]>([]);
    const [savings, setSavings] = useState<any[]>([]);
    const [debts, setDebts] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'transfer'>('income');

    // New Transaction State
    const [newTx, setNewTx] = useState({
        description: '',
        walletId: '',
        toWalletId: '',
        amount: 0,
        fee: 0,
        date: new Date().toISOString().split('T')[0],
        category: CATEGORIES[0],
        type: 'income' as 'income' | 'expense' | 'transfer',
        savingId: ''
    });

    useEffect(() => {
        if (!user) return;

        if (user.role === 'super_admin') {
            navigate('/admin');
            return;
        }

        const targetFamily = user.familyName || '';
        if (urlFamilyName !== targetFamily) {
            if (targetFamily) {
                navigate(`/${encodeURIComponent(targetFamily)}/dashboard`, { replace: true });
            } else {
                navigate('/');
            }
        }
    }, [user, urlFamilyName, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const [txData, summaryData, walletData, savingData, debtData] = await Promise.all([
                FinanceController.getMonthlyTransactions(now.getMonth() + 1, now.getFullYear()),
                FinanceController.getDashboardSummary(now.getMonth() + 1, now.getFullYear()),
                FinanceController.getWallets(),
                FinanceController.getSavings(),
                FinanceController.getDebts()
            ]);
            setTransactions(txData);
            setSummary(summaryData);
            setWallets(walletData);
            setSavings(savingData);
            setDebts(debtData);

            if (walletData.length > 0 && !newTx.walletId) {
                setNewTx(prev => ({ ...prev, walletId: walletData[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTransaction = async () => {
        if (!newTx.walletId || !newTx.amount || !newTx.description) {
            alert('Lengkapi data transaksi');
            return;
        }

        if (newTx.amount <= 0) {
            alert('Jumlah transaksi harus lebih dari 0');
            return;
        }

        if (newTx.type === 'expense' || newTx.type === 'transfer') {
            const wallet = wallets.find(w => w.id === newTx.walletId);
            if (wallet && wallet.balance < newTx.amount) {
                alert(`Saldo ${wallet.name} tidak mencukupi (Saldo: Rp ${wallet.balance.toLocaleString()})`);
                return;
            }
        }

        try {
            await FinanceController.createTransaction({
                ...newTx,
                amount: Math.max(0, newTx.amount),
                fee: Math.max(0, newTx.fee || 0),
                date: new Date(newTx.date).toISOString()
            });
            fetchData();
            setNewTx({
                ...newTx,
                amount: 0,
                fee: 0,
                description: '',
                date: new Date().toISOString().split('T')[0],
            });
            setIsSingleModalOpen(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal membuat transaksi');
        }
    };

    const handleBulkCreateTransactions = async (txs: any[]) => {
        try {
            const formattedTxs = txs.map(tx => ({
                ...tx,
                amount: Math.max(0, tx.amount),
                date: new Date(tx.date).toISOString()
            }));
            await FinanceController.createBulkTransactions(formattedTxs);
            fetchData();
            setIsBulkModalOpen(false);
        } catch (error: any) {
            console.error("Bulk Transaction Error:", error);
            const msg = error.response?.data?.error || error.message || 'Gagal membuat transaksi massal';
            alert(`Gagal: ${msg}`);
        }
    };

    const handleUpdateTransaction = async (id: string, tx: any) => {
        try {
            await FinanceController.updateTransaction(id, {
                ...tx,
                date: new Date(tx.date).toISOString()
            });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal memperbarui transaksi');
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Hapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) return;
        try {
            await FinanceController.deleteTransaction(id);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal menghapus transaksi');
        }
    };

    const handleCreateWallet = async (name: string, type: string, accountNumber: string, initialBalance: number) => {
        try {
            await FinanceController.createWallet({
                name,
                wallet_type: type,
                account_number: accountNumber,
                initialBalance: initialBalance
            });
            fetchData();
        } catch (error) {
            alert('Gagal membuat wallet');
        }
    };

    const handleUpdateWallet = async (wallet: any) => {
        try {
            await FinanceController.updateWallet(wallet);
            fetchData();
        } catch (error) {
            alert('Gagal memperbarui wallet');
        }
    };

    const handleUpdateSaving = async (saving: any) => {
        try {
            await FinanceController.updateSaving(saving);
            fetchData();
        } catch (error) {
            alert('Gagal memperbarui tabungan');
        }
    };

    const handleDeleteSaving = async (id: string) => {
        try {
            await FinanceController.deleteSaving(id);
            fetchData();
        } catch (error) {
            alert('Gagal menghapus tabungan');
        }
    };

    const handleDeleteWallet = async (id: string) => {
        if (!window.confirm('Hapus dompet ini?')) return;
        try {
            await FinanceController.deleteWallet(id);
            fetchData();
        } catch (error) {
            alert('Gagal menghapus wallet');
        }
    };

    const handleCreateSaving = async (name: string, target: number, initial: number, sourceWalletId?: string, category: string = 'savings', emoji: string = '💰', dueDate: number = 0) => {
        try {
            // 1. Create saving with 0 balance (or initial if no wallet selected, but we want to force wallet if initial > 0)
            const saving = await FinanceController.createSaving({
                name,
                targetAmount: target,
                category,
                emoji,
                dueDate,
                currentBalance: sourceWalletId ? 0 : initial
            });

            // 2. If source wallet is provided and initial > 0, record a transaction
            if (sourceWalletId && initial > 0) {
                await FinanceController.createTransaction({
                    walletId: sourceWalletId,
                    savingId: saving.id,
                    type: 'saving',
                    amount: initial,
                    date: new Date().toISOString(),
                    description: `Setoran awal budget: ${name}`
                });
            }
            fetchData();
        } catch (error) {
            alert('Gagal membuat budget');
        }
    };

    const handleCreateDebt = async (debt: any) => {
        try {
            await FinanceController.createDebt(debt);
            fetchData();
        } catch (error) {
            alert('Gagal mencatat hutang');
        }
    };

    const handleRecordPayment = async (payment: any) => {
        try {
            await FinanceController.recordDebtPayment(payment);
            fetchData();
        } catch (error) {
            alert('Gagal mencatat cicilan');
        }
    };

    const handleAllocateToSaving = async (walletId: string, savingId: string, amount: number) => {
        try {
            await FinanceController.createTransaction({
                walletId,
                savingId,
                type: 'saving',
                amount,
                date: new Date().toISOString(),
                description: 'Alokasi ke goal'
            });
            fetchData();
        } catch (error) {
            alert('Gagal mengalokasikan ke tabungan');
        }
    };

    const location = useLocation();
    const currentPath = location.pathname.split('/').pop() || 'overview';


    return (
        <div className="flex min-h-screen bg-dagang-cream/50 text-dagang-dark font-sans relative">
            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
                        <p className="text-sm font-bold text-dagang-dark/50 tracking-widest uppercase">Memuat Data...</p>
                    </div>
                </div>
            )}


            <aside className="w-[280px] bg-dagang-dark text-white p-7 hidden lg:flex flex-col fixed h-full z-[70] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-12">
                    <div className="logo font-serif text-2xl">
                        Dagang<span className="text-dagang-accent">Finance</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        active={currentPath === 'overview'}
                        to="overview"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <SidebarItem
                        icon={Wallet}
                        label="Dompet"
                        active={currentPath === 'wallets'}
                        to="wallets"
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={History}
                        label="Transaksi"
                        active={currentPath === 'transactions'}
                        to="transactions"
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={PieChart}
                        label="Analisa"
                        active={currentPath === 'analytics'}
                        to="analytics"
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Target}
                        label="Budget"
                        active={currentPath === 'budget'}
                        to="budget"
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Banknote} // Change icon to Banknote for Debt or keep DollarSign?
                        label="Hutang"
                        active={currentPath === 'debts'}
                        to="debts"
                        onClick={() => { }}
                    />
                    <div className="pt-8 pb-4">
                        <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Keluarga</span>
                    </div>
                    <SidebarItem icon={Users} label="Anggota" />
                    <SidebarItem icon={Bell} label="Notifikasi" />
                    <SidebarItem icon={Settings} label="Pengaturan" />
                </nav>

                <div className="mt-auto space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3 text-[11px] font-bold">
                            <span className="text-dagang-accent uppercase tracking-wider">Free Trial</span>
                            <span className="text-white/50">5 hari lagi</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-dagang-green w-[70%]" />
                        </div>
                        <a href="/pricing" className="block w-full py-2.5 bg-dagang-green text-white text-[12px] font-bold rounded-xl text-center hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10">
                            Upgrade Sekarang
                        </a>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-dagang-accent flex items-center justify-center font-bold text-sm text-dagang-dark shadow-lg shadow-dagang-accent/20">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold truncate max-w-[120px]">{user?.fullName || 'User'}</div>
                                <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">{user?.role?.replace('_', ' ') || 'Member'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 transition-transform hover:scale-110" />
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 lg:ml-[280px] p-4 sm:p-6 lg:p-10 w-full overflow-x-hidden pb-32 lg:pb-10">
                <header className="flex items-center justify-between gap-4 mb-8 lg:mb-10">
                    <div className="flex items-center gap-4">
                        {/* Removed mobile sidebar toggle */}
                        <div>
                            <h1 className="text-xl sm:text-[28px] font-serif leading-tight">Halo, {user?.fullName?.split(' ')[0]}! 👋</h1>
                            <p className="hidden sm:block text-dagang-gray text-sm mt-1">
                                Hari ini {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border border-black/5 rounded-2xl text-[13px] font-bold shadow-sm cursor-pointer hover:bg-dagang-cream/50 transition-all">
                            <Home className="w-4 h-4 text-dagang-green" /> {user?.familyName || 'Keluarga'} <ChevronDown className="w-4 h-4 opacity-40" />
                        </div>
                        <button className="p-3 bg-white border border-black/5 rounded-2xl text-dagang-gray hover:text-dagang-green transition-all relative shadow-sm">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <Outlet context={{
                    summary,
                    wallets,
                    transactions,
                    savings,
                    debts,
                    user,
                    activeTab,
                    setActiveTab,
                    newTx,
                    setNewTx,
                    handleCreateTransaction,
                    handleCreateWallet,
                    handleUpdateWallet,
                    handleDeleteWallet,
                    handleCreateSaving,
                    handleUpdateSaving,
                    handleDeleteSaving,
                    handleAllocateToSaving,
                    handleCreateDebt,
                    handleRecordPayment,
                    handleBulkCreateTransactions,
                    handleUpdateTransaction,
                    handleDeleteTransaction,
                    isSingleModalOpen,
                    setIsSingleModalOpen,
                    isBulkModalOpen,
                    setIsBulkModalOpen,
                    categories: CATEGORIES
                }} />
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[80]">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-2xl shadow-black/10 px-6 py-3 flex items-center justify-between">
                    <MobileNavLink to="overview" active={currentPath === 'overview'} icon={LayoutDashboard} />
                    <MobileNavLink to="wallets" active={currentPath === 'wallets'} icon={Wallet} />

                    {/* Floating Action Button */}
                    <button
                        onClick={() => navigate('transactions')}
                        className="w-14 h-14 bg-dagang-green text-white rounded-full flex items-center justify-center shadow-xl shadow-dagang-green/30 -mt-12 border-4 border-dagang-cream"
                    >
                        <Plus className="w-7 h-7" />
                    </button>

                    <MobileNavLink to="transactions" active={currentPath === 'transactions'} icon={History} />
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={`p-2 transition-all ${isMobileMenuOpen ? 'text-dagang-green scale-110' : 'text-dagang-gray/40'}`}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`
                fixed inset-0 bg-dagang-dark/95 backdrop-blur-xl z-[150] lg:hidden transition-all duration-500
                ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            `}>
                <div className="flex flex-col h-full p-8">
                    <div className="flex items-center justify-between mb-12">
                        <div className="logo font-serif text-2xl text-white">
                            Dagang<span className="text-dagang-accent">Finance</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-xl">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <MobileMenuItem
                            icon={LayoutDashboard}
                            label="Overview"
                            to="overview"
                            active={currentPath === 'overview'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Wallet}
                            label="Dompet"
                            to="wallets"
                            active={currentPath === 'wallets'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={History}
                            label="Transaksi"
                            to="transactions"
                            active={currentPath === 'transactions'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={PieChart}
                            label="Analisa"
                            to="analytics"
                            active={currentPath === 'analytics'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Target}
                            label="Budget"
                            to="budget"
                            active={currentPath === 'budget'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Banknote}
                            label="Hutang"
                            to="debts"
                            active={currentPath === 'debts'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <div className="pt-8 pb-4">
                            <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Keluarga</span>
                        </div>
                        <MobileMenuItem icon={Users} label="Anggota" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={Bell} label="Notifikasi" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={Settings} label="Pengaturan" onClick={() => setIsMobileMenuOpen(false)} />
                    </nav>

                    <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dagang-accent flex items-center justify-center font-bold text-dagang-dark">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-white font-bold">{user?.fullName || 'User'}</div>
                                <div className="text-white/30 text-xs uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Member'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                logout();
                            }}
                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MobileNavLink = ({ to, active, icon: Icon }: { to: string, active: boolean, icon: any }) => (
    <Link to={to} className={`p-2 transition-all ${active ? 'text-dagang-green scale-110' : 'text-dagang-gray/40'}`}>
        <Icon className={`w-6 h-6 ${active ? 'fill-current opacity-20' : ''}`} />
    </Link>
);

const MobileMenuItem = ({ icon: Icon, label, active = false, to, onClick }: { icon: any, label: string, active?: boolean, to?: string, onClick?: () => void }) => {
    const content = (
        <div className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 font-bold' : 'text-white/50 hover:text-white'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-base">{label}</span>
        </div>
    );

    if (to) {
        return (
            <Link to={to} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <button className="w-full text-left" onClick={onClick}>
            {content}
        </button>
    );
};

const SidebarItem = ({ icon: Icon, label, active = false, to, onClick }: { icon: any, label: string, active?: boolean, to?: string, onClick?: () => void }) => {
    const content = (
        <>
            <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
            <span className="text-[14px]">{label}</span>
        </>
    );

    const className = `w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 ${active
        ? 'bg-dagang-green text-white shadow-xl shadow-dagang-green/20 font-bold translate-x-1'
        : 'text-white/40 hover:text-white hover:bg-white/5'
        }`;

    if (to) {
        return (
            <Link to={to} className={className} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
};
