import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Wallet,
    Users,
    Settings,
    Bell,
    Target,
    Plus,
    X,
    Home,
    History,
    Banknote,
    Brain,
    LogOut,
    ChevronDown,
    Menu,
    Clock,
    Info,
    Trash2
} from 'lucide-react';
import { NotificationController } from '../controllers/NotificationController';
import { BudgetController, BudgetCategory } from '../controllers/BudgetController';
import { useAuthStore } from '../store/authStore';
import { FinanceController } from '../controllers/FinanceController';
import { Transaction, Wallet as WalletModel } from '../models';
import { useParams, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';

const CATEGORIES = [
    'Sembako', 'PLN', 'PDAM', 'Air Minum + Gas', 'Jajan', 'Warung Sayur',
    'Wifi', 'Internet HP', 'Cicilan', 'Gofood / Shopee Food', 'Healing',
    'Bensin', 'Parkir + Sampah', 'BPJS', 'Iuran RT', 'Pengeluaran Tabungan', 'Lainnya'
];

import { getStorageUrl } from '../services/api';

export const FamilyDashboard = () => {
    const { familyName: urlFamilyName } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const setUser = useAuthStore(state => state.setUser);
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
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);

    // Initial state for resetting
    const initialTxState = {
        description: '',
        walletId: '',
        toWalletId: '',
        amount: 0,
        fee: 0,
        date: new Date().toISOString().split('T')[0],
        category: '',
        type: 'income' as 'income' | 'expense' | 'transfer',
        savingId: ''
    };

    // New Transaction State
    const [newTx, setNewTx] = useState(initialTxState);

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

    const fetchTransactions = async () => {
        const now = new Date();
        const data = await FinanceController.getMonthlyTransactions(now.getMonth() + 1, now.getFullYear());
        setTransactions(data);
        return data;
    };

    const fetchSummary = async () => {
        const now = new Date();
        const data = await FinanceController.getDashboardSummary(now.getMonth() + 1, now.getFullYear());
        setSummary(data);
        
        // Sync family name and status to user store if changed
        if (user && data.family) {
            const needsSync = user.familyName !== data.family.name || 
                             user.familyStatus !== data.family.status ||
                             user.trialEndsAt !== data.family.trial_ends_at;
            
            if (needsSync) {
                setUser({ 
                    ...user, 
                    familyName: data.family.name,
                    familyStatus: data.family.status,
                    trialEndsAt: data.family.trial_ends_at
                });
            }
        }
        return data;
    };

    const fetchWallets = async () => {
        const data = await FinanceController.getWallets();
        setWallets(data);
        if (data.length > 0 && !newTx.walletId) {
            setNewTx(prev => ({ ...prev, walletId: data[0].id }));
        }
        return data;
    };

    const fetchSavings = async () => {
        const data = await FinanceController.getSavings();
        setSavings(data);
        return data;
    };

    const fetchBudgetCategories = async () => {
        const data = await BudgetController.getCategories();
        setBudgetCategories(data);
        return data;
    };

    const fetchMembers = async () => {
        const data = await FinanceController.getMembers();
        setFamilyMembers(data || []);
        return data;
    };

    const fetchNotifications = async () => {
        const data = await NotificationController.getNotifications();
        setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
        return data;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTransactions(),
                fetchSummary(),
                fetchWallets(),
                fetchSavings(),
                FinanceController.getDebts().then(setDebts),
                fetchNotifications(),
                fetchBudgetCategories(),
                fetchMembers()
            ]);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshDashboard = async (target?: 'transactions' | 'wallets' | 'savings' | 'budget' | 'members' | 'summary' | 'notifs' | 'debts') => {
        try {
            if (!target) {
                await fetchData();
                return;
            }

            switch (target) {
                case 'transactions':
                    await Promise.all([fetchTransactions(), fetchSummary(), fetchWallets()]);
                    break;
                case 'wallets':
                    await fetchWallets();
                    break;
                case 'savings':
                    await Promise.all([fetchSavings(), fetchSummary()]);
                    break;
                case 'budget':
                    await fetchBudgetCategories();
                    break;
                case 'members':
                    await fetchMembers();
                    break;
                case 'summary':
                    await fetchSummary();
                    break;
                case 'notifs':
                    await fetchNotifications();
                    break;
                case 'debts':
                    await Promise.all([FinanceController.getDebts().then(setDebts), fetchSummary()]);
                    break;
            }
        } catch (error) {
            console.error(`Failed to refresh ${target || 'dashboard'}`, error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTransaction = async () => {
        
        if (!newTx.walletId || !newTx.amount || !newTx.description) {
            alert(`Lengkapi data transaksi:\n${!newTx.walletId ? '- Pilih Dompet\n' : ''}${!newTx.amount ? '- Isi Jumlah\n' : ''}${!newTx.description ? '- Isi Catatan/Deskripsi' : ''}`);
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
            // If date is today, use current time. If past, use date from picker.
            const now = new Date();
            const selectedDate = new Date(newTx.date);
            const isToday = now.toDateString() === selectedDate.toDateString();
            
            const finalDate = isToday ? now.toISOString() : selectedDate.toISOString();

            await FinanceController.createTransaction({
                ...newTx,
                amount: Math.max(0, newTx.amount),
                fee: Math.max(0, newTx.fee || 0),
                date: finalDate
            });
            refreshDashboard('transactions');
            setNewTx({
                ...initialTxState,
                walletId: wallets[0]?.id || ''
            });
            setIsSingleModalOpen(false);
        } catch (error: any) {
            console.error("[ERROR] Failed to create transaction:", error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal membuat transaksi';
            alert(`Gagal: ${errorMsg}\n\nPastikan koneksi internet stabil dan tunnel Cloudflare aktif.`);
        }
    };

    const handleBulkCreateTransactions = async (txs: any[]) => {
        try {
            const now = new Date();
            const formattedTxs = txs.map(tx => {
                const selectedDate = new Date(tx.date);
                const isToday = now.toDateString() === selectedDate.toDateString();
                return {
                    ...tx,
                    amount: Math.max(0, tx.amount),
                    date: isToday ? now.toISOString() : selectedDate.toISOString()
                };
            });
            await FinanceController.createBulkTransactions(formattedTxs);
            refreshDashboard('transactions');
            setIsBulkModalOpen(false);
        } catch (error: any) {
            console.error("Bulk Transaction Error:", error);
            const msg = error.response?.data?.error || error.message || 'Gagal membuat transaksi massal';
            alert(`Gagal: ${msg}`);
        }
    };

    const handleUpdateTransaction = async (id: string, tx: any) => {

        if (!tx.amount || tx.amount <= 0) {
            alert('Jumlah transaksi harus lebih dari 0');
            return;
        }

        try {
            const now = new Date();
            let finalDate: string;
            
            try {
                const selectedDate = new Date(tx.date);
                if (isNaN(selectedDate.getTime())) {
                    throw new Error("Invalid Date");
                }
                const isToday = now.toDateString() === selectedDate.toDateString();
                finalDate = isToday ? now.toISOString() : selectedDate.toISOString();
            } catch (dateErr) {
                console.error("[ERROR] Date parsing failed:", dateErr);
                finalDate = now.toISOString(); // fallback to now
            }

            const payload = {
                ...tx,
                amount: Math.max(0, tx.amount),
                fee: Math.max(0, tx.fee || 0),
                date: finalDate
            };
            await FinanceController.updateTransaction(id, payload);
            await fetchData();
            // alert('Perubahan berhasil disimpan!');
        } catch (error: any) {
            console.error("[ERROR] Failed to update transaction:", error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal memperbarui transaksi';
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            await FinanceController.deleteTransaction(id);
            refreshDashboard('transactions');
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
            refreshDashboard('wallets');
        } catch (error) {
            alert('Gagal membuat wallet');
        }
    };

    const handleUpdateWallet = async (wallet: any) => {
        try {
            await FinanceController.updateWallet(wallet);
            refreshDashboard('wallets');
        } catch (error) {
            alert('Gagal memperbarui wallet');
        }
    };

    const handleUpdateSaving = async (saving: any) => {
        try {
            await FinanceController.updateSaving({
                id: saving.id,
                name: saving.name,
                targetAmount: saving.targetAmount,
                currentBalance: saving.currentBalance,
                category: saving.category,
                budgetCategoryId: saving.budgetCategoryId, // Ensure this is mapped
                emoji: saving.emoji,
                dueDate: saving.dueDate
            });
            refreshDashboard('savings');
        } catch (error) {
            alert('Gagal memperbarui tabungan');
        }
    };

    const handleDeleteSaving = async (id: string) => {
        try {
            await FinanceController.deleteSaving(id);
            refreshDashboard('savings');
        } catch (error) {
            alert('Gagal menghapus tabungan');
        }
    };

    const handleDeleteWallet = async (id: string) => {
        if (!window.confirm('Hapus dompet ini?')) return;
        try {
            await FinanceController.deleteWallet(id);
            refreshDashboard('wallets');
        } catch (error) {
            alert('Gagal menghapus wallet');
        }
    };

    const handleCreateSaving = async (name: string, target: number, initial: number, sourceWalletId?: string, category: string = 'savings', emoji: string = '💰', dueDate: number = 0) => {
        try {
            // 1. Create saving
            const saving = await FinanceController.createSaving({
                name,
                targetAmount: target,
                category,
                budgetCategoryId: category, // 'category' passed from BudgetView is the UUID
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
            refreshDashboard('savings');
        } catch (error: any) {
            console.error('[ERROR] Failed to create budget:', error);
            alert('Gagal membuat budget: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCreateDebt = async (debt: any) => {
        try {
            await FinanceController.createDebt(debt);
            refreshDashboard('debts');
        } catch (error) {
            alert('Gagal mencatat hutang');
        }
    };

    const handleRecordPayment = async (payment: any) => {
        try {
            await FinanceController.recordDebtPayment(payment);
            refreshDashboard('debts');
        } catch (error) {
            alert('Gagal mencatat cicilan');
        }
    };
    
    const handleDeleteDebt = async (id: string) => {
        if (!confirm('Hapus catatan hutang ini?')) return;
        try {
            await FinanceController.deleteDebt(id);
            refreshDashboard('debts');
        } catch (error) {
            alert('Gagal menghapus hutang');
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
            refreshDashboard('savings');
        } catch (error) {
            alert('Gagal mengalokasikan ke tabungan');
        }
    };

    const location = useLocation();
    const currentPath = location.pathname.split('/').pop() || 'overview';
    const currentUserFamilyMember = familyMembers.find(m => m.user_id === user?.id);
    const currentUserFamilyRole = currentUserFamilyMember?.role || (user as any)?.familyRole || 'member';

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
                        Uang<span className="text-dagang-accent">ku</span>
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
                        icon={Brain}
                        label="AI Coach"
                        active={currentPath === 'coach'}
                        to="coach"
                        onClick={() => { }}
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
                    <SidebarItem 
                        icon={History} 
                        label="Riwayat Pembelian" 
                        active={currentPath === 'history'}
                        to="family/history"
                        onClick={() => { }}
                    />
                    <div className="pt-8 pb-4">
                        <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Keluarga</span>
                    </div>
                     <SidebarItem 
                         icon={Users} 
                         label="Keluarga" 
                         active={currentPath === 'members'}
                         to="family"
                         onClick={() => { }}
                     />
                     <SidebarItem 
                        icon={Bell} 
                        label="Notifikasi" 
                        active={currentPath === 'notifications'}
                        to="notifications"
                        onClick={() => { }}
                    />
                     <SidebarItem 
                        icon={Settings} 
                        label="Pengaturan" 
                        active={currentPath === 'settings'}
                        to="settings"
                        onClick={() => { }}
                    />
                </nav>

                <div className="mt-auto space-y-6">
                    {summary?.family?.status === 'trial' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3 text-[11px] font-bold">
                                <span className="text-dagang-accent uppercase tracking-wider">Free Trial</span>
                                <span className="text-white/50">
                                    {(() => {
                                        const trialEnds = new Date(summary.family.trial_ends_at);
                                        const diff = trialEnds.getTime() - new Date().getTime();
                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                        return days > 0 ? `${days} hari lagi` : 'Berakhir';
                                    })()}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-dagang-green transition-all duration-1000"
                                    style={{
                                        width: `${(() => {
                                            const trialEnds = new Date(summary.family.trial_ends_at);
                                            const diff = trialEnds.getTime() - new Date().getTime();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            // Using 10 as fallback if not provided, but making it more resilient
                                    return Math.max(0, Math.min(100, (days / (summary?.trial_duration || 7)) * 100));
                                        })()}%`
                                    }}
                                />
                            </div>
                            <a href="/pricing" className="block w-full py-2.5 bg-dagang-green text-white text-[12px] font-bold rounded-xl text-center hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10">
                                Upgrade Sekarang
                            </a>
                        </div>
                    )}

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-dagang-accent flex items-center justify-center font-bold text-sm text-dagang-dark shadow-lg shadow-dagang-accent/20">
                                {user?.fullName?.charAt(0) || (user as any)?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold truncate max-w-[120px]">{user?.fullName || (user as any)?.full_name || 'User'}</div>
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
                            <h1 className="text-h4 mobile:text-h2 font-heading leading-tight">Halo, {(user?.fullName || (user as any)?.full_name)?.split(' ')[0]}! 👋</h1>
                            <p className="hidden sm:block text-dagang-gray text-sm mt-1">
                                Hari ini {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => navigate('family')}
                            className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border border-black/5 rounded-2xl text-[13px] font-bold shadow-sm cursor-pointer hover:bg-dagang-cream/50 transition-all active:scale-95"
                        >
                            {summary?.family?.photo_url ? (
                                <img 
                                    src={getStorageUrl(summary.family.photo_url)} 
                                    className="w-5 h-5 rounded-md object-cover" 
                                    alt="Family"
                                />
                            ) : (
                                <Home className="w-4 h-4 text-dagang-green" />
                            )}
                            <span className="truncate max-w-[150px]">{summary?.family?.name || user?.familyName || 'Keluarga'}</span>
                            <ChevronDown className="w-4 h-4 opacity-40" />
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-3 border border-black/5 rounded-2xl transition-all relative shadow-sm ${isNotificationOpen ? 'bg-dagang-green text-white shadow-lg' : 'bg-white text-dagang-gray hover:text-dagang-green'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm" >
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationOpen && (
                                <NotificationDropdown 
                                    onClose={() => setIsNotificationOpen(false)}
                                    unreadCount={unreadCount}
                                    refreshDashboard={refreshDashboard}
                                />
                            )}
                        </div>
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
                    handleDeleteDebt,
                    handleBulkCreateTransactions,
                    handleUpdateTransaction,
                    handleDeleteTransaction,
                    isSingleModalOpen,
                    setIsSingleModalOpen,
                    isBulkModalOpen,
                    setIsBulkModalOpen,
                    budgetCategories,
                    familyMembers,
                    familyRole: currentUserFamilyRole,
                    handleCreateBudgetCategory: async (cat: any) => { 
                        try { await BudgetController.createCategory(cat); refreshDashboard('budget'); } 
                        catch (err: any) { alert(err.response?.data?.error || 'Gagal membuat kategori'); }
                    },
                    handleUpdateBudgetCategory: async (id: string, cat: any) => { 
                        try { await BudgetController.updateCategory(id, cat); refreshDashboard('budget'); } 
                        catch (err: any) { alert(err.response?.data?.error || 'Gagal memperbarui kategori'); }
                    },
                    handleDeleteBudgetCategory: async (id: string) => { 
                        try { 
                            await BudgetController.deleteCategory(id); 
                            await refreshDashboard('budget'); 
                        } 
                        catch (err: any) { 
                            alert(err.response?.data?.error || 'Gagal menghapus kategori'); 
                        }
                    },
                    categories: CATEGORIES,
                    refreshDashboard: refreshDashboard
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
                            icon={Brain}
                            label="AI Coach"
                            to="coach"
                            active={currentPath === 'coach'}
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
                        <MobileMenuItem 
                            icon={Users} 
                            label="Anggota" 
                            to="members" 
                            active={currentPath === 'members'}
                            onClick={() => setIsMobileMenuOpen(false)} 
                        />
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
            <span className="text-body-m">{label}</span>
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
            <span className="text-body-m">{label}</span>
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

const NotificationDropdown = ({ onClose, unreadCount, refreshDashboard }: { onClose: () => void, unreadCount: number, refreshDashboard: () => void }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await NotificationController.getNotifications();
            // Show only latest 5 for dropdown
            setNotifications(data.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationController.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            // Trigger parent refresh to update badge count
            refreshDashboard();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'reminder': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'alert': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'info': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-dagang-green" />;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-[320px] sm:w-[380px] bg-white rounded-[24px] border border-black/5 shadow-2xl shadow-black/10 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-body-m font-black text-dagang-dark">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-dagang-green/10 text-dagang-green text-[10px] font-black rounded-full uppercase tracking-widest">
                            {unreadCount} Baru
                        </span>
                    )}
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                >
                    <X className="w-4 h-4 text-dagang-gray" />
                </button>
            </div>

            <div className="divide-y divide-black/5 max-h-[360px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-10 text-center text-dagang-gray text-body-s animate-pulse">Memuat...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-10 text-center text-dagang-gray text-body-s italic">Tidak ada notifikasi baru.</div>
                ) : (
                    notifications.map((n: any) => (
                        <div 
                            key={n.id} 
                            className={`p-5 flex items-start gap-4 transition-all hover:bg-dagang-cream/10 cursor-pointer ${!n.is_read ? 'bg-dagang-green/5' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!n.is_read) handleMarkAsRead(n.id);
                            }}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-dagang-green/10' : 'bg-black/5'}`}>
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className={`text-[13px] truncate ${!n.is_read ? 'font-black' : 'font-bold'} text-dagang-dark uppercase tracking-tight`}>
                                        {n.title}
                                    </h4>
                                    <span className="text-[9px] font-black text-dagang-gray/30 uppercase shrink-0">
                                        {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-[12px] text-dagang-gray leading-relaxed line-clamp-2">
                                    {n.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    navigate('notifications');
                    onClose();
                }}
                className="w-full p-4 text-body-s font-black text-dagang-green hover:bg-dagang-green hover:text-white transition-all border-t border-black/5 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
                Lihat Semua Notifikasi <ChevronDown className="w-3 h-3 -rotate-90" />
            </button>
        </div>
    );
};
