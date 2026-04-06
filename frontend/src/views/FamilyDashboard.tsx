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
    Trash2,
    Landmark,
    MessageCircle,
    Target as GoalIcon
} from 'lucide-react';
import { useModal } from '../providers/ModalProvider';
import { NotificationController } from '../controllers/NotificationController';
import { BudgetController, BudgetCategory } from '../controllers/BudgetController';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/common/Logo';
import { FinanceController } from '../controllers/FinanceController';
import { AuthController } from '../controllers/AuthController';
import { Transaction, Wallet as WalletModel } from '../models';
import { useParams, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { Moon, Sun } from 'lucide-react';

const CATEGORIES = [
    'Sembako', 'PLN', 'PDAM', 'Air Minum + Gas', 'Jajan', 'Warung Sayur',
    'Wifi', 'Internet HP', 'Cicilan', 'Gofood / Shopee Food', 'Healing',
    'Bensin', 'Parkir + Sampah', 'BPJS', 'Iuran RT', 'Pengeluaran Tabungan', 'Lainnya'
];

import { getStorageUrl } from '../services/api';

export const FamilyDashboard = () => {
    const { familyName: urlFamilyName } = useParams();
    const basePath = `/${encodeURIComponent(urlFamilyName || '')}/dashboard`;
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const setUser = useAuthStore(state => state.setUser);
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();
    const { showAlert, showConfirm } = useModal();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallets, setWallets] = useState<WalletModel[]>([]);
    const [savings, setSavings] = useState<any[]>([]);
    const [debts, setDebts] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'transfer'>('income');
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

    useEffect(() => {
        fetchCurrentUser();
        fetchSummary(selectedMonth, selectedYear);
        fetchWallets();
        fetchSavings();
    }, []);

    const fetchTransactions = async (month = selectedMonth, year = selectedYear) => {
        const data = await FinanceController.getMonthlyTransactions(month, year);
        setTransactions(data);
        return data;
    };

    const fetchSummary = async (month = selectedMonth, year = selectedYear) => {
        const data = await FinanceController.getDashboardSummary(month, year);
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

    const fetchCurrentUser = async () => {
        try {
            const data = await AuthController.getCurrentUser();
            if (data.user) {
                // Ensure field names are mapped correctly
                const updatedUser = {
                    ...data.user,
                    fullName: data.user.full_name || data.user.fullName,
                    phoneNumber: data.user.phone_number || data.user.phoneNumber,
                    familyName: data.user.familyName || (user?.familyName) // Keep family name if not returned
                };
                setUser(updatedUser);
            }
        } catch (error) {
            console.error("Failed to sync user data:", error);
        }
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
        const data = await FinanceController.getSavings(selectedMonth, selectedYear);
        setSavings(data);
        return data;
    };

    const fetchBudgetCategories = async (userId?: string) => {
        const data = await BudgetController.getCategories(selectedMonth, selectedYear, userId);
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

    const fetchGoals = async () => {
        try {
            const data = await FinanceController.getGoals();
            setGoals(data);
            return data;
        } catch (err) {
            console.error("Failed to fetch goals", err);
            return [];
        }
    };

    const fetchAssets = async () => {
        try {
            const data = await FinanceController.getAssets();
            setAssets(data);
            return data;
        } catch (err) {
            console.error("Failed to fetch assets", err);
            return [];
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            // 1. Fetch Summary first as it contains family profile and member counts
            const summaryData = await fetchSummary();
            
            // 2. Fetch other essential data in parallel
            await Promise.all([
                fetchTransactions(),
                fetchWallets(),
                fetchSavings(),
                FinanceController.getDebts().then(setDebts),
                fetchNotifications(),
                fetchBudgetCategories(),
                fetchGoals(),
                fetchAssets()
            ]);

            // 3. Populate familyMembers from summary to avoid extra /finance/members call
            if (summaryData.family && summaryData.family.members) {
                const mappedMembers = summaryData.family.members.map((m: any) => ({
                    id: m.id,
                    familyId: m.family_id,
                    userId: m.user_id,
                    role: m.role,
                    fullName: m.user?.full_name || m.full_name,
                    email: m.user?.email || m.email,
                    isVerified: m.is_verified,
                    joinedAt: m.joined_at,
                    monthly_budget: m.monthly_budget
                }));
                setFamilyMembers(mappedMembers);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshDashboard = async (target?: 'transactions' | 'wallets' | 'savings' | 'budget' | 'members' | 'summary' | 'notifs' | 'debts' | 'goals' | 'assets', targetId?: string) => {
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
                    await Promise.all([fetchSavings(), fetchSummary(), fetchBudgetCategories()]);
                    break;
                case 'budget':
                    await fetchBudgetCategories(targetId);
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
                case 'goals':
                    await fetchGoals();
                    break;
                case 'assets':
                    await fetchAssets();
                    break;
            }
        } catch (error) {
            console.error(`Failed to refresh ${target || 'dashboard'}`, error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleCreateTransaction = async () => {
        
        if (!newTx.walletId || !newTx.amount || !newTx.description) {
            showAlert('Validasi', `Lengkapi data transaksi:\n${!newTx.walletId ? '- Pilih Dompet\n' : ''}${!newTx.amount ? '- Isi Jumlah\n' : ''}${!newTx.description ? '- Isi Catatan/Deskripsi' : ''}`, 'warning');
            return;
        }

        if (newTx.amount <= 0) {
            showAlert('Validasi', 'Jumlah transaksi harus lebih dari 0', 'warning');
            return;
        }

        if (newTx.type === 'expense' || newTx.type === 'transfer') {
            const wallet = wallets.find(w => w.id === newTx.walletId);
            if (wallet && wallet.balance < newTx.amount) {
                showAlert('Saldo Kurang', `Saldo ${wallet.name} tidak mencukupi (Saldo: Rp ${wallet.balance.toLocaleString('id-ID')})`, 'danger');
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
            showAlert('Error', `Gagal: ${errorMsg}\n\nPastikan koneksi internet stabil.`, 'danger');
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
            showAlert('Error', `Gagal: ${msg}`, 'danger');
        }
    };

    const handleUpdateTransaction = async (id: string, tx: any) => {

        if (!tx.amount || tx.amount <= 0) {
            showAlert('Validasi', 'Jumlah transaksi harus lebih dari 0', 'warning');
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
            await FinanceController.updateTransaction(id, payload, tx.originalDate);
            await fetchData();
            // alert('Perubahan berhasil disimpan!');
        } catch (error: any) {
            console.error("[ERROR] Failed to update transaction:", error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal memperbarui transaksi';
            showAlert('Error', `Error: ${errorMsg}`, 'danger');
        }
    };

    const handleDeleteTransaction = async (id: string, date?: string) => {
        try {
            await FinanceController.deleteTransaction(id, date);
            refreshDashboard('transactions');
        } catch (error: any) {
            showAlert('Error', error.response?.data?.error || 'Gagal menghapus transaksi', 'danger');
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
            showAlert('Error', 'Gagal membuat wallet', 'danger');
        }
    };

    const handleUpdateWallet = async (wallet: any) => {
        try {
            await FinanceController.updateWallet(wallet);
            refreshDashboard('wallets');
        } catch (error) {
            showAlert('Error', 'Gagal memperbarui wallet', 'danger');
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
                budgetCategoryId: saving.budgetCategoryId, 
                emoji: saving.emoji,
                dueDate: saving.dueDate,
                targetUserId: saving.targetUserId,
                month: selectedMonth,
                year: selectedYear
            });
            refreshDashboard('savings');
        } catch (error) {
            showAlert('Error', 'Gagal memperbarui tabungan', 'danger');
        }
    };

    const handleDeleteSaving = async (id: string) => {
        try {
            await FinanceController.deleteSaving(id);
            refreshDashboard('savings');
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Gagal menghapus item';
            showAlert('Gagal', errorMsg, 'danger');
        }
    };

    const handleDeleteWallet = (id: string) => {
        showConfirm('Hapus Dompet', 'Hapus dompet ini?', async () => {
            try {
                await FinanceController.deleteWallet(id);
                refreshDashboard('wallets');
            } catch (error) {
                showAlert('Error', 'Gagal menghapus wallet', 'danger');
            }
        }, 'danger');
    };

    const handleCreateSaving = async (name: string, target: number, initial: number, sourceWalletId?: string, category: string = 'savings', emoji: string = '💰', dueDate: number = 0, targetUserId?: string) => {
        try {
            // 1. Create saving
            const saving = await FinanceController.createSaving({
                name,
                targetAmount: target,
                category,
                budgetCategoryId: category, // 'category' passed from BudgetView is the UUID
                emoji,
                dueDate,
                currentBalance: sourceWalletId ? 0 : initial,
                targetUserId: targetUserId,
                month: selectedMonth,
                year: selectedYear
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
            showAlert('Error', 'Gagal membuat budget: ' + (error.response?.data?.error || error.message), 'danger');
        }
    };

    const handleCreateDebt = async (debt: any) => {
        try {
            await FinanceController.createDebt(debt);
            refreshDashboard('debts');
        } catch (error) {
            showAlert('Error', 'Gagal mencatat hutang', 'danger');
        }
    };

    const handleRecordPayment = async (payment: any) => {
        try {
            await FinanceController.recordDebtPayment(payment);
            refreshDashboard('debts');
        } catch (error) {
            showAlert('Error', 'Gagal mencatat cicilan', 'danger');
        }
    };
    
    const handleDeleteDebt = (id: string) => {
        const debt = debts.find(d => d.id === id);
        
        // 1. Restriction: Cannot delete if paid
        if (debt?.status === 'paid' || debt?.remaining_amount === 0) {
            showAlert(
                'Penghapusan Ditolak', 
                'Hutang yang sudah lunas tidak dapat dihapus demi integritas laporan keuangan. Data ini akan tetap tersimpan sebagai riwayat.', 
                'warning'
            );
            return;
        }

        // 2. Information: Balance will be reversed
        showConfirm(
            'Hapus & Refund Saldo?', 
            `Menghapus hutang '${debt?.name}' akan membatalkan semua pembayaran sebelumnya dan MENGEMBALIKAN saldo ke dompet asal. Tindakan ini tidak bisa dibatalkan. Lanjutkan?`, 
            async () => {
                try {
                    await FinanceController.deleteDebt(id);
                    await refreshDashboard('debts');
                    await refreshDashboard('wallets'); // Refresh balances
                } catch (error: any) {
                    showAlert('Error', error.response?.data?.error || 'Gagal menghapus hutang', 'danger');
                }
            }, 
            'danger'
        );
    };

    const handleUpdateDebt = async (debt: any) => {
        try {
            await FinanceController.updateDebt(debt);
            refreshDashboard('debts');
        } catch (error) {
            showAlert('Error', 'Gagal memperbarui hutang', 'danger');
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
            showAlert('Error', 'Gagal mengalokasikan ke tabungan', 'danger');
        }
    };

    const handleFundGoal = async (goalId: string, walletId: string, amount: number) => {
        try {
            await FinanceController.fundGoal({
                goalId,
                walletId,
                amount,
                description: `Alokasi dana untuk Goals`
            });
            refreshDashboard('goals');
            refreshDashboard('wallets');
            refreshDashboard('summary');
        } catch (error: any) {
            showAlert('Error', 'Gagal alokasi dana: ' + (error.response?.data?.error || error.message), 'danger');
            throw error;
        }
    };

    const handleGetGoalHistory = async (goalId: string) => {
        try {
            return await FinanceController.getGoalHistory(goalId);
        } catch (error: any) {
            showAlert('Error', 'Gagal mengambil riwayat: ' + (error.response?.data?.error || error.message), 'danger');
            return [];
        }
    };

    const location = useLocation();
    const currentPath = location.pathname.split('/').pop() || 'overview';
    const currentUserFamilyMember = familyMembers.find(m => m.userId === user?.id);
    const currentUserFamilyRole = currentUserFamilyMember?.role || (user as any)?.familyRole || 'member';

    const getPath = (path: string) => `${basePath}/${path}`;

    return (
        <div className="flex min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans relative transition-colors duration-300">
            {loading && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                        <p className="text-sm font-bold text-[var(--text-main)] opacity-70 tracking-widest uppercase">Memuat Data...</p>
                    </div>
                </div>
            )}


            <aside className="w-[280px] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] p-7 hidden lg:flex flex-col fixed h-full z-[70] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-12">
                    <Link to={getPath('overview')} className="hover:opacity-80 transition-opacity">
                        <Logo variant="horizontal" />
                    </Link>
                    <button 
                        onClick={toggleTheme}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        active={currentPath === 'overview'}
                        to={getPath('overview')}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <SidebarItem
                        icon={Info}
                        label="Panduan"
                        active={currentPath === 'coach'}
                        to={getPath('coach')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Wallet}
                        label="Dompet"
                        active={currentPath === 'wallets'}
                        to={getPath('wallets')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={History}
                        label="Transaksi"
                        active={currentPath === 'transactions'}
                        to={getPath('transactions')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Target}
                        label="Budget"
                        active={currentPath === 'budget'}
                        to={getPath('budget')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Banknote} 
                        label="Hutang"
                        active={currentPath === 'debts'}
                        to={getPath('debts')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={GoalIcon}
                        label="Goals"
                        active={currentPath === 'goals'}
                        to={getPath('goals')}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={Landmark}
                        label="Aset"
                        active={currentPath === 'assets'}
                        to={getPath('assets')}
                        onClick={() => { }}
                    />
                    <SidebarItem 
                        icon={History} 
                        label="Pembelian Paket" 
                        active={currentPath === 'history'}
                        to={getPath('family/history')}
                        onClick={() => { }}
                    />
                    <SidebarItem 
                        icon={MessageCircle} 
                        label="Bantuan & Laporan" 
                        active={currentPath === 'support'}
                        to={getPath('support')}
                        onClick={() => { }}
                    />
                    <div className="pt-8 pb-4">
                        <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-text-muted)] opacity-60">Keluarga</span>
                    </div>
                     <SidebarItem 
                         icon={Users} 
                         label="Keluarga" 
                         active={currentPath === 'members' || currentPath === 'family'} 
                         to={getPath('family')}
                         onClick={() => { }}
                     />
                     <SidebarItem 
                        icon={Bell} 
                        label="Notifikasi" 
                        active={currentPath === 'notifications'}
                        to={getPath('notifications')}
                        onClick={() => { }}
                        badge={unreadCount}
                    />
                     <SidebarItem 
                        icon={Settings} 
                        label="Pengaturan" 
                        active={currentPath === 'settings'}
                        to={getPath('settings')}
                        onClick={() => { }}
                    />
                </nav>

                <div className="mt-auto space-y-6">
                    {summary?.family?.status === 'trial' && (
                        <div className="bg-[var(--sidebar-text)]/5 border border-[var(--sidebar-border)] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3 text-[11px] font-bold">
                                <span className="text-[var(--accent)] uppercase tracking-wider">Free Trial</span>
                                <span className="text-[var(--sidebar-text-muted)]">
                                    {(() => {
                                        const trialEnds = new Date(summary.family.trial_ends_at);
                                        const diff = trialEnds.getTime() - new Date().getTime();
                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                        return days > 0 ? `${days} hari lagi` : 'Berakhir';
                                    })()}
                                </span>
                            </div>
                            <div className="h-1.5 bg-[var(--sidebar-text)]/10 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-[var(--primary)] transition-all duration-1000"
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
                            <a href="/pricing" className="block w-full py-2.5 bg-[var(--primary)] text-white text-[12px] font-bold rounded-xl text-center hover:opacity-90 transition-all shadow-lg shadow-black/10">
                                Upgrade Sekarang
                            </a>
                        </div>
                    )}

                    <div className="pt-6 border-t border-[var(--sidebar-border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-sm text-black shadow-lg shadow-black/10">
                                {user?.fullName?.charAt(0) || (user as any)?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold truncate max-w-[120px]">{user?.fullName || (user as any)?.full_name || 'User'}</div>
                                <div className="text-[10px] text-[var(--sidebar-text-muted)] uppercase font-black tracking-widest">{user?.role?.replace('_', ' ') || 'Member'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="p-2 hover:bg-[var(--sidebar-text)]/5 rounded-lg text-[var(--sidebar-text-muted)] hover:text-red-500 transition-colors"
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
                            <h1 className="text-h4 mobile:text-h2 font-heading leading-tight text-[var(--text-main)]">Halo, {(user?.fullName || (user as any)?.full_name)?.split(' ')[0]}! 👋</h1>
                            <div className="flex items-center gap-3 mt-1 text-[var(--text-muted)] text-sm">
                                <span className="hidden sm:inline">Hari ini {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => navigate(getPath('family'))}
                            className="hidden sm:flex items-center gap-2 px-5 py-3 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl text-[13px] font-bold shadow-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95"
                        >
                            {summary?.family?.photo_url ? (
                                <img 
                                    src={getStorageUrl(summary.family.photo_url)} 
                                    className="w-5 h-5 rounded-md object-cover" 
                                    alt="Family"
                                />
                            ) : (
                                <Home className="w-4 h-4 text-[var(--primary)]" />
                            )}
                            <span className="truncate max-w-[150px]">{summary?.family?.name || user?.familyName || 'Keluarga'}</span>
                            <ChevronDown className="w-4 h-4 opacity-70" />
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className="lg:hidden p-3 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shadow-sm"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-3 border border-[var(--border)] rounded-2xl transition-all relative shadow-sm ${isNotificationOpen ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--primary)]'}`}
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
                    selectedMonth,
                    setSelectedMonth,
                    selectedYear,
                    setSelectedYear,
                    summary,
                    wallets: wallets,
                    transactions,
                    savings,
                    debts,
                    user,
                    currentUserId: user?.id,
                    familyRole: currentUserFamilyRole,
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
                    handleUpdateDebt,
                    handleBulkCreateTransactions,
                    handleUpdateTransaction,
                    handleDeleteTransaction,
                    isSingleModalOpen,
                    setIsSingleModalOpen,
                    isBulkModalOpen,
                    setIsBulkModalOpen,
                    budgetCategories,
                    familyMembers,
                    handleCreateBudgetCategory: async (cat: any, userId?: string) => { 
                        try { 
                            await BudgetController.createCategory({
                                ...cat,
                                month: selectedMonth,
                                year: selectedYear
                            }, userId); 
                            await refreshDashboard('budget', userId); 
                        } 
                        catch (err: any) { showAlert('Error', err.response?.data?.error || 'Gagal membuat kategori', 'danger'); }
                    },
                    handleUpdateBudgetCategory: async (id: string, cat: any, userId?: string) => { 
                        try { 
                            await BudgetController.updateCategory(id, {
                                ...cat,
                                month: selectedMonth,
                                year: selectedYear
                            }); 
                            await refreshDashboard('budget', userId); 
                        } 
                        catch (err: any) { showAlert('Error', err.response?.data?.error || 'Gagal memperbarui kategori', 'danger'); }
                    },
                    handleDeleteBudgetCategory: async (id: string, month?: number, year?: number, userId?: string) => { 
                        try { 
                            await BudgetController.deleteCategory(id, month, year, userId); 
                            await refreshDashboard('budget', userId); 
                        } 
                        catch (err: any) { 
                            showAlert('Error', err.response?.data?.error || 'Gagal menghapus kategori', 'danger'); 
                        }
                    },
                    handleClearAllCategories: async (userId?: string) => {
                        try { 
                            await BudgetController.clearAllCategories(userId); 
                            await refreshDashboard('budget', userId); 
                        } 
                        catch (err: any) { 
                            showAlert('Error', err.response?.data?.error || 'Gagal menghapus semua kategori', 'danger'); 
                        }
                    },
                    categories: CATEGORIES,
                    refreshDashboard: refreshDashboard,
                    goals,
                    assets,
                    handleCreateGoal: async (goal: any) => {
                        await FinanceController.createGoal(goal);
                        refreshDashboard('goals');
                    },
                    handleUpdateGoal: async (goal: any) => {
                        await FinanceController.updateGoal(goal);
                        refreshDashboard('goals');
                    },
                    handleDeleteGoal: async (id: string) => {
                        await FinanceController.deleteGoal(id);
                        refreshDashboard('goals');
                    },
                    handleConvertToAsset: async (goalId: string, assetType: string) => {
                        await FinanceController.convertToAsset(goalId, assetType);
                        refreshDashboard('goals');
                        refreshDashboard('assets');
                    },
                    handleCreateAsset: async (asset: any) => {
                        await FinanceController.createAsset(asset);
                        refreshDashboard('assets');
                        refreshDashboard('goals');
                    },
                    handleUpdateAsset: async (asset: any) => {
                        await FinanceController.updateAsset(asset);
                        refreshDashboard('assets');
                        refreshDashboard('goals');
                    },
                    handleDeleteAsset: async (id: string) => {
                        await FinanceController.deleteAsset(id);
                        refreshDashboard('assets');
                        refreshDashboard('goals');
                    },
                    handleFundGoal,
                    handleGetGoalHistory
                }} />
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[80]">
                <div className="bg-[var(--surface-card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-[24px] shadow-2xl shadow-black/10 px-6 py-3 flex items-center justify-between">
                    <MobileNavLink to={getPath('overview')} active={currentPath === 'overview'} icon={LayoutDashboard} />
                    <MobileNavLink to={getPath('wallets')} active={currentPath === 'wallets'} icon={Wallet} />

                    {/* Floating Action Button */}
                    <button
                        onClick={() => navigate(getPath('transactions'))}
                        className="w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-xl shadow-black/10 -mt-12 border-4 border-[var(--background)]"
                    >
                        <Plus className="w-7 h-7" />
                    </button>

                    <MobileNavLink to={getPath('transactions')} active={currentPath === 'transactions'} icon={History} />
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={`p-2 transition-all ${isMobileMenuOpen ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] opacity-40'}`}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`
                fixed inset-0 bg-[#06130F]/95 backdrop-blur-xl z-[150] lg:hidden transition-all duration-500 overflow-y-auto custom-scrollbar
                ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            `}>
                <div className="flex flex-col min-h-full p-8">
                    <div className="flex items-center justify-between mb-12">
                        <Link to={getPath('overview')} className="hover:opacity-80 transition-opacity">
                            <Logo variant="horizontal" />
                        </Link>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-xl">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <MobileMenuItem
                            icon={LayoutDashboard}
                            label="Overview"
                            to={getPath('overview')}
                            active={currentPath === 'overview'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Brain}
                            label="AI Coach"
                            to={getPath('coach')}
                            active={currentPath === 'coach'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Wallet}
                            label="Dompet"
                            to={getPath('wallets')}
                            active={currentPath === 'wallets'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={History}
                            label="Transaksi"
                            to={getPath('transactions')}
                            active={currentPath === 'transactions'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Target}
                            label="Budget"
                            to={getPath('budget')}
                            active={currentPath === 'budget'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Banknote}
                            label="Hutang"
                            to={getPath('debts')}
                            active={currentPath === 'debts'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={GoalIcon}
                            label="Goals"
                            to={getPath('goals')}
                            active={currentPath === 'goals'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Landmark}
                            label="Aset"
                            to={getPath('assets')}
                            active={currentPath === 'assets'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <div className="pt-8 pb-4">
                            <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-text-muted)] opacity-60">Keluarga</span>
                        </div>
                        <MobileMenuItem
                            icon={Users}
                            label="Keluarga"
                            to={getPath('family')}
                            active={currentPath === 'members' || currentPath === 'family'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <MobileMenuItem
                            icon={Bell}
                            label="Notifikasi"
                            to={getPath('notifications')}
                            active={currentPath === 'notifications'}
                            onClick={() => setIsMobileMenuOpen(false)}
                            badge={unreadCount}
                        />
                        <MobileMenuItem
                            icon={Settings}
                            label="Pengaturan"
                            to={getPath('settings')}
                            active={currentPath === 'settings'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    </nav>

                    <div className="mt-auto pt-8 border-t border-[var(--sidebar-border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-black">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-[var(--sidebar-text)] font-bold">{user?.fullName || 'User'}</div>
                                <div className="text-[var(--sidebar-text-muted)] opacity-70 text-xs uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Member'}</div>
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
    <Link to={to} className={`p-2 transition-all ${active ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] opacity-40'}`}>
        <Icon className={`w-6 h-6 ${active ? 'fill-current opacity-20' : ''}`} />
    </Link>
);

const MobileMenuItem = ({ icon: Icon, label, active = false, to, onClick, badge }: { icon: any, label: string, active?: boolean, to?: string, onClick?: () => void, badge?: number }) => {
    const content = (
        <div className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-[var(--primary)] text-white shadow-lg shadow-black/10 font-bold' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]'}`}>
            <div className="flex items-center gap-4">
                <Icon className="w-5 h-5" />
                <span className="text-body-m">{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#06130F] shadow-sm animate-in zoom-in duration-300">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
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

const SidebarItem = ({ icon: Icon, label, active = false, to, onClick, badge }: { icon: any, label: string, active?: boolean, to?: string, onClick?: () => void, badge?: number }) => {
    const content = (
        <>
            <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
            <span className="text-body-m flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${active ? 'bg-white text-[var(--primary)]' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </>
    );

    const className = `w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 ${active
        ? 'bg-[var(--primary)] text-white shadow-xl shadow-black/10 font-bold translate-x-1'
        : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-text)]/5'
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
    const { familyName } = useParams();
    const basePath = `/${encodeURIComponent(familyName || '')}/dashboard`;
    const getPath = (path: string) => `${basePath}/${path}`;

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
            default: return <Bell className="w-4 h-4 text-[var(--primary)]" />;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-[320px] sm:w-[380px] bg-[var(--surface-card)] rounded-[24px] border border-[var(--border)] shadow-2xl shadow-black/10 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-body-m font-black text-[var(--text-main)]">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black rounded-full uppercase tracking-widest">
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

            <div className="divide-y divide-[var(--border)] max-h-[360px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-10 text-center text-[var(--text-muted)] text-body-s animate-pulse">Memuat...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-10 text-center text-[var(--text-muted)] text-body-s italic">Tidak ada notifikasi baru.</div>
                ) : (
                    notifications.map((n: any) => (
                        <div 
                            key={n.id} 
                            className={`p-5 flex items-start gap-4 transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${!n.is_read ? 'bg-[var(--primary)]/5' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!n.is_read) handleMarkAsRead(n.id);
                            }}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-[var(--primary)]/10' : 'bg-black/5 dark:bg-white/5'}`}>
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className={`text-[13px] truncate ${!n.is_read ? 'font-black' : 'font-bold'} text-[var(--text-main)] uppercase tracking-tight`}>
                                        {n.title}
                                    </h4>
                                    <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30 uppercase shrink-0">
                                        {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
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
                    navigate(getPath('notifications'));
                    onClose();
                }}
                className="w-full p-4 text-body-s font-black text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all border-t border-[var(--border)] flex items-center justify-center gap-2 uppercase tracking-widest"
            >
                Lihat Semua Notifikasi <ChevronDown className="w-3 h-3 -rotate-90" />
            </button>
        </div>
    );
};
