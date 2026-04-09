import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminController } from '../controllers/AdminController';
import { ConfirmModal } from '../components/ConfirmModal';
import { PlanFormModal } from '../components/PlanFormModal';
import { UserFormModal } from '../components/UserFormModal';
import { SettingFormModal } from '../components/SettingFormModal';
import { SupportReplyModal } from '../components/SupportReplyModal';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { PlatformExpenseModal } from '../components/PlatformExpenseModal';
import { ManualVerificationModal } from '../components/ManualVerificationModal';
import toast from 'react-hot-toast';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardLayout } from './admin/DashboardLayout';
import { OverviewTab } from './admin/OverviewTab';
import { ReportsTab } from './admin/ReportsTab';
import { UsersTab } from './admin/UsersTab';
import { FamiliesTab } from './admin/FamiliesTab';
import { PlansTab } from './admin/PlansTab';
import { TransactionsTab } from './admin/TransactionsTab';
import { SettingsTab } from './admin/SettingsTab';
import { SupportTab } from './admin/SupportTab';
import { PaymentSettings } from './admin/PaymentSettings';
import { TaxReportsTab } from './admin/TaxReportsTab';

export const AdminDashboard: React.FC = () => {
    const { theme, toggleTheme } = useThemeStore();
    const logout = useAuthStore(state => state.logout);
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = useMemo(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        const validTabs = ['overview', 'users', 'families', 'plans', 'transactions', 'reports', 'tax-reports', 'support', 'settings', 'payment-channels'];
        return validTabs.includes(lastSegment) ? lastSegment : 'overview';
    }, [location]);

    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [families, setFamilies] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState<any>(null);
    const [totalFamilies, setTotalFamilies] = useState(0);
    const [plans, setPlans] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [settings, setSettings] = useState<any[]>([]);
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [financialSummary, setFinancialSummary] = useState<any>(null);
    const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'last-month' | 'year' | 'rolling-7' | 'rolling-30' | 'rolling-365'>('month');
    const [chartDays, setChartDays] = useState<number>(7);

    // UI States
    const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryInput, setSearchQueryInput] = useState(''); // For real-time input
    const [statusFilter, setStatusFilter] = useState('');
    const [periodFilter, setPeriodFilter] = useState('');
    const [supportPeriodFilter, setSupportPeriodFilter] = useState('');
    const [revPage, setRevPage] = useState(1);
    const [expPage, setExpPage] = useState(1);
    const [allocPage, setAllocPage] = useState(1);
    const [profitPage, setProfitPage] = useState(1);
    const usersPerPage = 5;
    const transPerPage = 10;

    const setActiveTab = (tab: string) => {
        navigate(`/admin/${tab}`);
    };

    // Modal States
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        onConfirm: () => { },
        title: '',
        message: '',
        type: 'danger' as any
    });
    const [planModal, setPlanModal] = useState({ isOpen: false, onSubmit: (data: any) => { }, initialData: null as any, title: '' });
    const [userModal, setUserModal] = useState({ isOpen: false, onSubmit: (data: any) => { }, initialData: null as any, title: '' });
    const [settingModal, setSettingModal] = useState({ isOpen: false, onSubmit: (data: any) => { }, initialValue: '', settingKey: '', title: '' });
    const [supportModal, setSupportModal] = useState({ isOpen: false, ticket: null as any });
    const [expenseModal, setExpenseModal] = useState({ isOpen: false, initialData: null as any });
    const [categoryModal, setCategoryModal] = useState({ isOpen: false, onSubmit: (data: any) => { }, initialData: null as any, title: '' });
    const [verificationModal, setVerificationModal] = useState({ isOpen: false, transaction: null as any });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchQueryInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQueryInput]);

    useEffect(() => {
        // Use silent refresh if only updating Search, Status, or Period to avoid flickering
        const isBackgroundRefresh = searchQuery !== '' || statusFilter !== '' || periodFilter !== '';
        fetchData(isBackgroundRefresh);
        fetchFinancialSummary();
        fetchCategories();
    }, [reportPeriod, currentPage, searchQuery, statusFilter, periodFilter, chartDays]);

    useEffect(() => {
        // Sync reportPeriod with chartDays when in Overview tab
        if (activeTab === 'overview') {
            if (chartDays === 7) setReportPeriod('rolling-7');
            else if (chartDays === 30) setReportPeriod('rolling-30');
            else if (chartDays === 365) setReportPeriod('rolling-365');
        }
    }, [chartDays, activeTab]);

    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery('');
        setStatusFilter('');
        setPeriodFilter('');
        setSupportPeriodFilter('');
    }, [activeTab]);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [statsRes, usersRes, familiesRes, plansRes, transRes, settingsRes, supportRes] = await Promise.all([
                AdminController.getStats(chartDays),
                AdminController.getUsers(currentPage, usersPerPage, searchQuery, statusFilter),
                AdminController.getFamilies(currentPage, usersPerPage, searchQuery, statusFilter),
                AdminController.getPlans(),
                AdminController.getTransactions(currentPage, transPerPage, searchQuery, statusFilter, periodFilter),
                AdminController.getSettings(),
                AdminController.getSupportTickets()
            ]);

            setStats(statsRes || null);
            setUsers(usersRes?.data || []);
            setUserStats(usersRes?.stats || null);
            setFamilies(familiesRes?.data || []);
            setTotalFamilies(familiesRes?.total || 0);
            setFamilyStats(familiesRes?.stats || null);
            setPlans(plansRes || []);
            setTransactions(transRes?.data || []);
            setTotalTransactions(transRes?.total || 0);
            setSettings(settingsRes || []);
            setSupportTickets(supportRes || []);
        } catch (error) {
            toast.error('Gagal mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFinancialSummary = async () => {
        try {
            const res = await AdminController.getFinancialSummary(reportPeriod);
            setFinancialSummary(res || {});
        } catch (error) {
            console.error('Failed to fetch financial summary:', error);
            setFinancialSummary({});
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await AdminController.getCategories();
            setCategories(res || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        }
    };

    // User Handlers
    const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
        setConfirmModal({
            isOpen: true,
            title: currentStatus ? 'Aktifkan Pengguna' : 'Blokir Pengguna',
            message: `Apakah Anda yakin ingin ${currentStatus ? 'mengaktifkan' : 'memblokir'} pengguna ini?`,
            type: currentStatus ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.toggleUserBlock(userId);
                    toast.success('Status pengguna diperbarui');
                    fetchData();
                } catch (error) {
                    toast.error('Gagal memperbarui status');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleEditUser = (user: any) => {
        setUserModal({
            isOpen: true,
            title: 'Edit Pengguna',
            initialData: user,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.updateUserAdmin(user.id, data);
                    toast.success('Data pengguna diperbarui');
                    fetchData();
                    setUserModal(prev => ({ ...prev, isOpen: false }));
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Gagal memperbarui data pengguna');
                }
            }
        });
    };

    const handleAddUser = () => {
        setUserModal({
            isOpen: true,
            title: 'Tambah Pengguna Baru',
            initialData: null,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.createUser(data);
                    toast.success('Pengguna berhasil ditambahkan');
                    fetchData();
                    setUserModal(prev => ({ ...prev, isOpen: false }));
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Gagal menambahkan pengguna');
                }
            }
        });
    };

    const handleDeleteUser = (user: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Pengguna',
            message: `Apakah Anda yakin ingin menghapus pengguna ${user.full_name}?`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.deleteUserAdmin(user.id);
                    toast.success('Pengguna berhasil dihapus');
                    fetchData();
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Gagal menghapus pengguna');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Family Handlers
    const handleToggleFamilyBlock = async (familyId: string, currentStatus: boolean) => {
        setConfirmModal({
            isOpen: true,
            title: currentStatus ? 'Aktifkan Keluarga' : 'Nonaktifkan Keluarga',
            message: `Apakah Anda yakin ingin ${currentStatus ? 'mengaktifkan' : 'menonaktifkan'} keluarga ini?`,
            type: currentStatus ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.toggleFamilyBlock(familyId);
                    toast.success('Status keluarga diperbarui');
                    fetchData();
                } catch (error) {
                    toast.error('Gagal memperbarui status');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteFamily = async (familyId: string, familyName: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Keluarga',
            message: `Apakah Anda yakin ingin menghapus keluarga "${familyName}"? Tindakan ini akan menghapus semua data keuangan dan akun pengguna (anggota) di dalam keluarga tersebut secara permanen.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.deleteFamily(familyId);
                    toast.success('Keluarga dan anggotanya berhasil dihapus');
                    fetchData();
                } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Gagal menghapus keluarga');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const toggleFamily = (id: string) => {
        const next = new Set(expandedFamilies);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedFamilies(next);
    };

    // Plan Handlers
    const handleAddPlan = () => {
        setPlanModal({
            isOpen: true,
            title: 'Tambah Paket Baru',
            initialData: null,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.createPlan(data);
                    toast.success('Paket berhasil ditambahkan');
                    fetchData();
                    setPlanModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Gagal menambahkan paket');
                }
            }
        });
    };

    const handleUpdatePlan = (plan: any) => {
        setPlanModal({
            isOpen: true,
            title: 'Edit Paket',
            initialData: plan,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.updatePlan({ ...plan, ...data });
                    toast.success('Paket berhasil diperbarui');
                    fetchData();
                    setPlanModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Gagal memperbarui paket');
                }
            }
        });
    };

    const handleDeletePlan = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Paket',
            message: 'Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.deletePlan(String(id));
                    toast.success('Paket berhasil dihapus');
                    fetchData();
                } catch (error) {
                    toast.error('Gagal menghapus paket');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Setting Handlers
    const handleUpdateSetting = (key: string) => {
        const setting = settings.find(s => s.key === key);
        setSettingModal({
            isOpen: true,
            title: `Update ${key.replace(/_/g, ' ').toUpperCase()}`,
            settingKey: key,
            initialValue: setting?.value || '',
            onSubmit: async (value: string) => {
                try {
                    await AdminController.updateSetting(key, value);
                    toast.success('Pengaturan berhasil diperbarui');
                    fetchData();
                    setSettingModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Gagal memperbarui pengaturan');
                }
            }
        });
    };

    // Support Handlers
    const handleReplyTicket = (ticket: any) => {
        setSupportModal({ isOpen: true, ticket });
    };

    const handleSubmitReply = async (message: string) => {
        try {
            await AdminController.replyTicket(supportModal.ticket.id, message);
            toast.success('Balasan berhasil dikirim');
            fetchData();
            setSupportModal({ isOpen: false, ticket: null });
        } catch (error) {
            toast.error('Gagal mengirim balasan');
        }
    };

    // Expense Handlers
    const handleRecordExpense = async (data: any) => {
        try {
            if (expenseModal.initialData) {
                await AdminController.updatePlatformExpense(expenseModal.initialData.id, data);
                toast.success('Biaya operasional diperbarui');
            } else {
                await AdminController.addPlatformExpense(data);
                toast.success('Biaya operasional dicatat');
            }
            fetchFinancialSummary();
            setExpenseModal({ isOpen: false, initialData: null });
        } catch (error) {
            toast.error('Gagal menyimpan biaya');
        }
    };

    const handleEditExpense = (expense: any) => {
        setExpenseModal({ isOpen: true, initialData: expense });
    };

    const handleDeleteExpense = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Biaya',
            message: 'Apakah Anda yakin ingin menghapus catatan biaya ini?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.deletePlatformExpense(id);
                    toast.success('Biaya dihapus');
                    fetchFinancialSummary();
                } catch (error) {
                    toast.error('Gagal menghapus biaya');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Category Handlers
    const handleAddCategory = () => {
        setCategoryModal({
            isOpen: true,
            title: 'Tambah Kategori Anggaran',
            initialData: null,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.addCategory(data);
                    toast.success('Kategori ditambahkan');
                    fetchCategories();
                    fetchFinancialSummary();
                    setCategoryModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Gagal menambahkan kategori');
                }
            }
        });
    };

    const handleUpdateCategory = (cat: any) => {
        setCategoryModal({
            isOpen: true,
            title: 'Edit Kategori Anggaran',
            initialData: cat,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.updateCategory({ ...cat, ...data });
                    toast.success('Kategori diperbarui');
                    fetchCategories();
                    fetchFinancialSummary();
                    setCategoryModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Gagal memperbarui kategori');
                }
            }
        });
    };

    const handleDeleteCategory = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kategori',
            message: 'Apakah Anda yakin ingin menghapus kategori ini? Data alokasi anggaran untuk kategori ini akan hilang.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdminController.deleteCategory(id);
                    toast.success('Kategori dihapus');
                    fetchCategories();
                    fetchFinancialSummary();
                } catch (error) {
                    toast.error('Gagal menghapus kategori');
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Local pagination for other tabs
    const paginatedFamilies = useMemo(() => {
        const start = (currentPage - 1) * usersPerPage;
        return (families || []).slice(start, start + usersPerPage);
    }, [families, currentPage]);

    const paginatedPlans = useMemo(() => {
        const start = (currentPage - 1) * usersPerPage;
        return (plans || []).slice(start, start + usersPerPage);
    }, [plans, currentPage]);


    const paginatedSettings = useMemo(() => {
        const start = (currentPage - 1) * usersPerPage;
        return (settings || []).slice(start, start + usersPerPage);
    }, [settings, currentPage]);

    const paginatedRevDetails = useMemo(() => {
        const itemsPerPage = 5;
        const start = (revPage - 1) * itemsPerPage;
        return financialSummary?.revenue_details?.slice(start, start + itemsPerPage) || [];
    }, [financialSummary?.revenue_details, revPage]);

    const paginatedExpDetails = useMemo(() => {
        const start = (expPage - 1) * usersPerPage;
        return financialSummary?.expense_details?.slice(start, start + usersPerPage) || [];
    }, [financialSummary?.expense_details, expPage]);

    const filteredSupportTickets = useMemo(() => {
        let filtered = supportTickets || [];
        if (supportPeriodFilter) {
            const now = new Date();
            const pastDate = new Date();
            pastDate.setDate(now.getDate() - parseInt(supportPeriodFilter));
            filtered = filtered.filter(t => new Date(t.created_at) >= pastDate);
        }
        return filtered;
    }, [supportTickets, supportPeriodFilter]);

    const paginatedSupportTickets = useMemo(() => {
        const start = (currentPage - 1) * usersPerPage;
        return filteredSupportTickets.slice(start, start + usersPerPage);
    }, [filteredSupportTickets, currentPage]);

    const exportToExcel = () => {
        if (!financialSummary) return;

        // 1. Prepare Summary & Category Breakdown (merged like the website)
        const summaryRows = [
            ["Pusat Laporan Komprehensif Platform", ""],
            ["Periode", `${new Date(financialSummary.period_start).toLocaleDateString('id-ID')} - ${new Date(financialSummary.period_end).toLocaleDateString('id-ID')}`],
            ["Dicetak Pada", new Date().toLocaleString('id-ID')],
            ["", ""],
            ["1. RINGKASAN FINANSIAL", ""],
            ["Total Pendapatan Kotor (Gross)", financialSummary.total_revenue],
            ["Potongan Pajak/Fee (COGS)", financialSummary.total_fees],
            ["Pendapatan Bersih (Net Revenue)", financialSummary.net_revenue],
            ["Total Biaya Operasional", financialSummary.total_expenses - financialSummary.total_fees],
            ["Laba Bersih Aktual", financialSummary.net_profit],
            ["", ""],
            ["2. KONFIGURASI ANGGARAN", ""],
            ["Target Pengeluaran (%)", `${financialSummary.allocation_pct}%`],
            ["Target Laba Bersih (%)", `${100 - financialSummary.allocation_pct}%`],
            ["Budget Pengeluaran (Rp)", financialSummary.expense_target],
            ["Target Laba Bersih (Rp)", financialSummary.net_profit_target],
            ["", ""],
            ["3. ALOKASI PER KATEGORI (REALISASI VS TARGET)", ""],
            ["KATEGORI", "PORSI (%)", "TARGET (Rp)", "AMBIL", "HUTANG", "LENT", "REALISASI (Rp)", "SELISIH (Rp)", "LENT DETAILS"]
        ];

        // Add all allocations (Expense & Profit)
        const allAllocations = [
            ...(financialSummary.expense_allocations || []),
            ...(financialSummary.profit_allocations || [])
        ];

        allAllocations.forEach((a: any) => {
            summaryRows.push([
                a.category_name,
                `${a.percentage}%`,
                a.target_amount,
                a.taken_amount || 0,
                a.remaining_debt || 0,
                a.lent_amount || 0,
                a.actual_amount,
                a.target_amount - a.actual_amount,
                a.lent_details || '-'
            ]);
        });

        summaryRows.push(["", ""]);
        summaryRows.push(["4. ANALISIS AKHIR", ""]);
        const labaDiff = financialSummary.net_profit - (financialSummary.total_revenue * ((100 - financialSummary.allocation_pct) / 100));
        summaryRows.push(["Status", labaDiff >= 0 ? "SURPLUS (Hemat Pengeluaran)" : "DEFISIT (Overbudget)"]);
        summaryRows.push(["Selisih dari Target Laba", labaDiff]);

        const taxPct = financialSummary.tax_pct || 11;
        const revenueData = financialSummary.revenue_details.map((r: any) => ({
            "No. Ref": r.reference,
            "Keluarga": r.family?.name || 'Tanpa Keluarga',
            "Paket": r.plan_name,
            "Jumlah Kotor": r.total_amount,
            [`PPN (${taxPct}%)`]: -(r.total_amount * (taxPct / 100)),
            "Setelah PPN": r.total_amount * (1 - (taxPct / 100)),
            "Fee Merchant": -(r.fee_merchant || 0),
            "Fee Customer": r.fee_customer || 0,
            "Total Fee Gateway": -(r.fee || 0),
            "Diterima Bersih": r.amount || 0,
            "Tanggal": new Date(r.created_at).toLocaleDateString('id-ID')
        }));

        const expenseData = financialSummary.expense_details.map((e: any) => ({
            "Kategori": e.category,
            "Keterangan": e.description,
            "Jumlah": e.amount,
            "Tanggal": new Date(e.expense_date).toLocaleDateString('id-ID')
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Ringkasan Laporan");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueData), "Riwayat Pendapatan");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseData), "Riwayat Biaya Operasional");
        
        XLSX.writeFile(wb, `Laporan_Komprehensif_${reportPeriod}_${new Date().getTime()}.xlsx`);
    };

    const exportToPDF = () => {
        if (!financialSummary) return;
        const doc = new jsPDF() as any;
        const primaryColor: [number, number, number] = [16, 185, 129]; // emerald-500

        // Page 1: Summary Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text("PUSAT LAPORAN KOMPREHENSIF", 14, 25);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Periode: ${new Date(financialSummary.period_start).toLocaleDateString('id-ID')} - ${new Date(financialSummary.period_end).toLocaleDateString('id-ID')}`, 14, 34);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 39);

        // 1. RINGKASAN FINANSIAL
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("1. RINGKASAN FINANSIAL", 14, 60);
        
        autoTable(doc, {
            startY: 65,
            head: [['KETERANGAN', 'PERSENTASE', 'NOMINAL']],
            body: [
                ['Total Pendapatan Kotor (Gross)', '-', `Rp ${financialSummary.total_revenue.toLocaleString('id-ID')}`],
                ['Potongan Pajak/Fee (COGS/Gateway)', '-', `Rp ${financialSummary.total_fees.toLocaleString('id-ID')}`],
                ['Pendapatan Bersih (Net Revenue)', '-', `Rp ${(financialSummary.total_revenue - financialSummary.total_fees).toLocaleString('id-ID')}`],
                ['Target Pengeluaran Operasional', `${financialSummary.allocation_pct}%`, `Rp ${financialSummary.expense_target.toLocaleString('id-ID')}`],
                ['Realisasi Biaya Operasional', '-', `Rp ${(financialSummary.total_expenses - financialSummary.total_fees).toLocaleString('id-ID')}`],
                ['Target Laba Bersih', `${100 - financialSummary.allocation_pct}%`, `Rp ${financialSummary.net_profit_target.toLocaleString('id-ID')}`],
                ['Laba Bersih Aktual', '-', `Rp ${financialSummary.net_profit.toLocaleString('id-ID')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        // 2. ANALISIS AKHIR
        const labaDiff = financialSummary.net_profit - (financialSummary.total_revenue * ((100 - financialSummary.allocation_pct) / 100));
        const status = labaDiff >= 0 ? "SURPLUS (Hemat Pengeluaran)" : "DEFISIT (Overbudget)";
        
        doc.setFontSize(14);
        doc.text("2. ANALISIS AKHIR", 14, (doc as any).lastAutoTable.finalY + 15);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(labaDiff >= 0 ? 16 : 239, labaDiff >= 0 ? 185 : 68, labaDiff >= 0 ? 129 : 68);
        doc.text(`STATUS: ${status}`, 14, (doc as any).lastAutoTable.finalY + 22);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(`${labaDiff >= 0 ? 'Penghematan' : 'Kelebihan'} dari Target Laba: Rp ${Math.abs(labaDiff).toLocaleString('id-ID')}`, 14, (doc as any).lastAutoTable.finalY + 28);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("3. ALOKASI PER KATEGORI (TARGET VS REALISASI)", 14, (doc as any).lastAutoTable.finalY + 45);
        
        const allPdfAllocations = [
            ...(financialSummary.expense_allocations || []),
            ...(financialSummary.profit_allocations || [])
        ];

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 50,
            head: [['KATEGORI', 'PORSI', 'TARGET', 'AMBIL', 'LENT', 'REALISASI', 'SELISIH']],
            body: allPdfAllocations?.map((a: any) => [
                a.category_name,
                `${a.percentage}%`,
                `Rp ${a.target_amount.toLocaleString('id-ID')}`,
                `Rp ${(a.taken_amount || 0).toLocaleString('id-ID')}`,
                `Rp ${(a.lent_amount || 0).toLocaleString('id-ID')}`,
                `Rp ${a.actual_amount.toLocaleString('id-ID')}`,
                `Rp ${(a.target_amount - a.actual_amount).toLocaleString('id-ID')}`
            ]) || [['Belum ada data alokasi', '', '', '', '', '', '']],
            theme: 'striped',
            headStyles: { fillColor: [52, 211, 153] }, // emerald-400
            styles: { fontSize: 7 }
        });

        const taxPct = financialSummary.tax_pct || 11;
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("RIWAYAT PENDAPATAN", 14, 20);
        autoTable(doc, {
            startY: 28,
            head: [['REFERENCE', 'KELUARGA', 'PAKET', 'GROSS', `PPN (${taxPct}%)`, 'NETT (PPN)', 'FEE GW', 'TERIMA', 'TANGGAL']],
            body: financialSummary.revenue_details.map((r: any) => [
                r.reference,
                r.family?.name || '-',
                r.plan_name,
                `Rp ${r.total_amount.toLocaleString('id-ID')}`,
                `Rp -${(r.total_amount * (taxPct / 100)).toLocaleString('id-ID')}`,
                `Rp ${(r.total_amount * (1 - (taxPct / 100))).toLocaleString('id-ID')}`,
                `Rp -${(r.fee || 0).toLocaleString('id-ID')}`,
                `Rp ${(r.amount || 0).toLocaleString('id-ID')}`,
                new Date(r.created_at).toLocaleDateString('id-ID')
            ]),
            styles: { fontSize: 7 }
        });

        // Page 3: Expense Details
        if (financialSummary.expense_details?.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text("RIWAYAT BIAYA OPERASIONAL", 14, 20);
            autoTable(doc, {
                startY: 28,
                head: [['KATEGORI', 'KETERANGAN', 'JUMLAH', 'TANGGAL']],
                body: financialSummary.expense_details.map((e: any) => [
                    e.category,
                    e.description || '-',
                    `Rp ${e.amount.toLocaleString('id-ID')}`,
                    new Date(e.expense_date).toLocaleDateString('id-ID')
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [239, 68, 68] } // red-500
            });
        }

        doc.save(`Laporan_Komprehensif_${reportPeriod}_${new Date().getTime()}.pdf`);
    };

    const handleVerifyManualPayment = async (id: string, status: string, notes: string) => {
        try {
            await AdminController.verifyManualPayment({ id, status, notes });
            toast.success(`Pembayaran ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
            fetchData(true);
            fetchFinancialSummary();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal memproses verifikasi');
            throw error;
        }
    };

    const renderTabContent = () => {
        if (loading && activeTab !== 'reports' && activeTab !== 'overview') {
            return (
                <div className="p-12 text-center text-[var(--text-muted)] animate-pulse">
                    Memuat data...
                </div>
            );
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewTab stats={stats} theme={theme} plans={plans} financialSummary={financialSummary} chartDays={chartDays} setChartDays={setChartDays} onTabChange={setActiveTab} />;
            case 'reports':
                return (
                    <ReportsTab
                        reportPeriod={reportPeriod}
                        setReportPeriod={setReportPeriod}
                        financialSummary={financialSummary}
                        exportToExcel={exportToExcel}
                        exportToPDF={exportToPDF}
                        setExpenseModal={setExpenseModal}
                        categories={categories}
                        handleAddCategory={handleAddCategory}
                        handleUpdateCategory={handleUpdateCategory}
                        handleDeleteCategory={handleDeleteCategory}
                        handleEditExpense={handleEditExpense}
                        handleDeleteExpense={handleDeleteExpense}
                        revPage={revPage}
                        setRevPage={setRevPage}
                        expPage={expPage}
                        setExpPage={setExpPage}
                        allocPage={allocPage}
                        setAllocPage={setAllocPage}
                        profitPage={profitPage}
                        setProfitPage={setProfitPage}
                        paginatedRevDetails={paginatedRevDetails}
                        paginatedExpDetails={paginatedExpDetails}
                        paginatedAllocDetails={(financialSummary?.expense_allocations || []).slice((allocPage - 1) * 5, allocPage * 5)}
                        paginatedProfitDetails={(financialSummary?.profit_allocations || []).slice((profitPage - 1) * 5, profitPage * 5)}
                        usersPerPage={usersPerPage}
                        refreshFinancialSummary={fetchFinancialSummary}
                        onUpdateAllocationPct={async (pct: number) => {
                            try {
                                await AdminController.updateSetting('platform_expense_allocation_pct', String(pct));
                                toast.success(`Alokasi pengeluaran diubah ke ${pct}% (Laba Bersih: ${100 - pct}%)`);
                                fetchFinancialSummary();
                            } catch (error) {
                                toast.error('Gagal menyimpan persentase');
                            }
                        }}
                    />
                );
            case 'tax-reports':
                return (
                    <TaxReportsTab 
                        reportPeriod={reportPeriod}
                        setReportPeriod={setReportPeriod}
                        financialSummary={financialSummary}
                        exportToExcel={exportToExcel}
                        exportToPDF={exportToPDF}
                    />
                );
            case 'users':
                return (
                    <UsersTab
                        userStats={userStats}
                        users={users}
                        totalUsers={userStats?.total || 0}
                        currentPage={currentPage}
                        usersPerPage={usersPerPage}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        handleEditUser={handleEditUser}
                        handleDeleteUser={handleDeleteUser}
                        handleToggleBlock={handleToggleBlock}
                        onPageChange={setCurrentPage}
                        handleAddUser={handleAddUser}
                    />
                );
            case 'families':
                return (
                    <FamiliesTab
                        paginatedFamilies={families}
                        familyStats={familyStats}
                        expandedFamilies={expandedFamilies}
                        toggleFamily={toggleFamily}
                        settings={settings}
                        handleToggleFamilyBlock={handleToggleFamilyBlock}
                        handleDeleteFamily={handleDeleteFamily}
                        currentPage={currentPage}
                        totalFamilies={totalFamilies}
                        usersPerPage={usersPerPage}
                        onPageChange={setCurrentPage}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                    />
                );
            case 'plans':
                return (
                    <PlansTab
                        paginatedPlans={paginatedPlans}
                        handleAddPlan={handleAddPlan}
                        handleUpdatePlan={handleUpdatePlan}
                        handleDeletePlan={handleDeletePlan}
                        currentPage={currentPage}
                        totalPlans={(plans || []).length}
                        usersPerPage={usersPerPage}
                        onPageChange={setCurrentPage}
                    />
                );
            case 'transactions':
                return (
                    <TransactionsTab 
                        paginatedTransactions={transactions}
                        currentPage={currentPage}
                        totalTransactions={totalTransactions}
                        usersPerPage={transPerPage}
                        onPageChange={setCurrentPage}
                        searchQuery={searchQueryInput}
                        onSearchChange={setSearchQueryInput}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        periodFilter={periodFilter}
                        onPeriodChange={setPeriodFilter}
                        onVerify={(transaction) => setVerificationModal({ isOpen: true, transaction })}
                    />
                );
            case 'settings':
                return (
                    <SettingsTab
                        settings={settings}
                        handleUpdateSetting={handleUpdateSetting}
                        usersPerPage={usersPerPage}
                    />
                );
            case 'support':
                return (
                    <SupportTab
                        paginatedSupportTickets={paginatedSupportTickets}
                        handleReplyTicket={handleReplyTicket}
                        currentPage={currentPage}
                        totalTickets={filteredSupportTickets.length}
                        usersPerPage={usersPerPage}
                        onPageChange={setCurrentPage}
                        periodFilter={supportPeriodFilter}
                        onPeriodChange={(val: string) => {
                            setSupportPeriodFilter(val);
                            setCurrentPage(1);
                        }}
                    />
                );
            case 'payment-channels':
                return <PaymentSettings />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout
            activeTab={activeTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
            stats={stats}
            totalUsers={stats?.total_users || 0}
            plans={plans}
            loading={loading}
        >
            {renderTabContent()}

            {/* Global Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            <PlanFormModal
                isOpen={planModal.isOpen}
                onClose={() => setPlanModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={planModal.onSubmit}
                initialData={planModal.initialData}
                title={planModal.title}
            />

            <UserFormModal
                isOpen={userModal.isOpen}
                onClose={() => setUserModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={userModal.onSubmit}
                initialData={userModal.initialData}
                title={userModal.title}
            />

            <SettingFormModal
                isOpen={settingModal.isOpen}
                onClose={() => setSettingModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={settingModal.onSubmit}
                onUpload={AdminController.uploadLogo}
                initialValue={settingModal.initialValue}
                settingKey={settingModal.settingKey}
                title={settingModal.title}
            />

            <CategoryFormModal
                isOpen={categoryModal.isOpen}
                onClose={() => setCategoryModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={categoryModal.onSubmit}
                initialData={categoryModal.initialData}
                title={categoryModal.title}
            />

            <SupportReplyModal
                isOpen={supportModal.isOpen}
                onClose={() => setSupportModal(prev => ({ ...prev, isOpen: false, ticket: null }))}
                onSubmit={handleSubmitReply}
                ticket={supportModal.ticket}
            />

            <PlatformExpenseModal
                isOpen={expenseModal.isOpen}
                onClose={() => setExpenseModal({ isOpen: false, initialData: null })}
                onSubmit={handleRecordExpense}
                initialData={expenseModal.initialData}
                categories={categories}
                allocations={[...(financialSummary?.expense_allocations || []), ...(financialSummary?.profit_allocations || [])]}
                expenseTarget={financialSummary?.expense_target}
            />

            <ManualVerificationModal 
                isOpen={verificationModal.isOpen}
                onClose={() => setVerificationModal({ isOpen: false, transaction: null })}
                transaction={verificationModal.transaction}
                onSubmit={handleVerifyManualPayment}
            />
        </DashboardLayout>
    );
};
