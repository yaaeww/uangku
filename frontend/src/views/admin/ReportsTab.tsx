import React, { useState } from 'react';
import {
    FileSpreadsheet,
    FileDown,
    Plus,
    Edit3,
    Trash2,
    Percent,
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    Settings2,
    Check,
    AlertTriangle,
    AlertCircle,
    Save,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    FileText
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';
import { PlatformTransferModal } from '../../components/PlatformTransferModal';
import { AdminController } from '../../controllers/AdminController';
import { useModal } from '../../providers/ModalProvider';
import toast from 'react-hot-toast';

interface ReportsTabProps {
    reportPeriod: string;
    setReportPeriod: (val: any) => void;
    financialSummary: any;
    exportToExcel: () => void;
    exportToPDF: () => void;
    setExpenseModal: (val: any) => void;
    categories: any[];
    handleAddCategory: () => void;
    handleUpdateCategory: (cat: any) => void;
    handleDeleteCategory: (id: string) => void;
    handleEditExpense: (exp: any) => void;
    handleDeleteExpense: (id: string) => void;
    revPage: number;
    setRevPage: (val: number) => void;
    expPage: number;
    setExpPage: (val: number) => void;
    allocPage: number;
    setAllocPage: (val: number) => void;
    profitPage: number;
    setProfitPage: (val: number) => void;
    paginatedRevDetails: any[];
    paginatedExpDetails: any[];
    paginatedAllocDetails: any[];
    paginatedProfitDetails: any[];
    usersPerPage: number;
    onUpdateAllocationPct?: (pct: number) => void;
    refreshFinancialSummary: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
    reportPeriod,
    setReportPeriod,
    financialSummary,
    exportToExcel,
    exportToPDF,
    setExpenseModal,
    categories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleEditExpense,
    handleDeleteExpense,
    revPage,
    setRevPage,
    expPage,
    setExpPage,
    allocPage,
    setAllocPage,
    profitPage,
    setProfitPage,
    paginatedRevDetails,
    paginatedExpDetails,
    paginatedAllocDetails,
    paginatedProfitDetails,
    usersPerPage,
    onUpdateAllocationPct,
    refreshFinancialSummary
}) => {
    const revenue = financialSummary?.total_revenue || 0;
    const totalFees = financialSummary?.total_fees || 0;
    const netRevenue = financialSummary?.net_revenue || (revenue - totalFees);
    const allocPct = financialSummary?.allocation_pct || 60;
    const profitPct = 100 - allocPct;
    
    // CONSISTENCY FIX: Use pre-calculated targets from backend (based on Gross Revenue)
    const expenseTarget = financialSummary?.expense_target || 0;
    const profitTarget = financialSummary?.net_profit_target || 0;
    
    // Combined expenses (Operational + Gateway Fees) for tracking
    const totalActualExpenses = financialSummary?.total_expenses || 0;
    const actualOperationalExpenses = totalActualExpenses - totalFees;

    // Actual Net Profit = Gross Revenue - All Expenses (incl. Fee)
    const actualLabaBersih = revenue - totalActualExpenses;
    const labaDiff = actualLabaBersih - profitTarget;

    const [activeCategoryType, setActiveCategoryType] = useState<'EXPENSE' | 'PROFIT'>('EXPENSE');
    const [isEditingPct, setIsEditingPct] = useState(false);
    const [tempExpensePct, setTempExpensePct] = useState(allocPct);
    const [taxPage, setTaxPage] = useState(1);
    const [transferModal, setTransferModal] = useState({ isOpen: false, initialData: null as any });
    const { showAlert, showConfirm } = useModal();
    
    const taxItemsPerPage = 5;
    const allocItemsPerPage = 5;
    
    const revDetails = financialSummary?.revenue_details || [];
    const paginatedTaxDetails = revDetails.slice((taxPage - 1) * taxItemsPerPage, taxPage * taxItemsPerPage);
    
    const allocations = financialSummary?.expense_allocations || [];
    const profitAllocations = financialSummary?.profit_allocations || [];
    
    const totalExpensePct = categories.filter(c => c.type !== 'PROFIT').reduce((sum, c) => sum + (c.percentage || 0), 0);
    const totalProfitPct = categories.filter(c => c.type === 'PROFIT').reduce((sum, c) => sum + (c.percentage || 0), 0);
    
    const currentTotalPct = activeCategoryType === 'EXPENSE' ? totalExpensePct : totalProfitPct;

    const handleSavePct = () => {
        if (onUpdateAllocationPct && tempExpensePct >= 0 && tempExpensePct <= 100) {
            onUpdateAllocationPct(tempExpensePct);
            setIsEditingPct(false);
        }
    };

    const handleTransferSubmit = async (transferData: any) => {
        try {
            if (transferModal.initialData) {
                await AdminController.updatePlatformBudgetTransfer(transferModal.initialData.id, transferData);
                toast.success('Penyesuaian budget diperbarui');
            } else {
                await AdminController.transferPlatformBudget(transferData);
                toast.success('Budget berhasil dipindahkan');
            }
            refreshFinancialSummary();
            setTransferModal({ isOpen: false, initialData: null });
        } catch (error: any) {
            console.error('Failed to submit transfer:', error);
            const msg = error.response?.data?.error || 'Gagal memproses penyesuaian.';
            showAlert('Error', msg, 'danger');
            throw error;
        }
    };

    const handleEditTransfer = (transfer: any) => {
        setTransferModal({ isOpen: true, initialData: transfer });
    };

    const handleDeleteTransfer = (id: string) => {
        showConfirm('Hapus Penyesuaian', 'Apakah Anda yakin ingin menghapus catatan penyesuaian budget ini? Saldo target akan kembali ke semula.', async () => {
            try {
                await AdminController.deletePlatformBudgetTransfer(id);
                toast.success('Penyesuaian dihapus');
                refreshFinancialSummary();
            } catch (error) {
                toast.error('Gagal menghapus penyesuaian');
            }
        });
    };

    return (
        <div className="p-3 sm:p-4 md:p-8 lg:p-12 space-y-6 sm:space-y-8 md:space-y-12 transition-colors overflow-x-hidden">
            {/* Period Filter Bar */}
            <div className="flex flex-col gap-4 bg-black/5 dark:bg-white/5 p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border border-[var(--border)]">
                <div className="flex flex-wrap bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1">
                    {[
                        { id: 'day', label: 'Hari Ini' },
                        { id: 'week', label: 'Minggu' },
                        { id: 'month', label: 'Bulan Ini' },
                        { id: 'last-month', label: 'Bulan Lalu' },
                        { id: 'year', label: 'Tahun' }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setReportPeriod(p.id as any)}
                            className={`flex-1 min-w-[60px] px-2 sm:px-4 md:px-6 py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                                reportPeriod === p.id 
                                ? 'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[0_4px_20px_-4px_rgba(26,107,74,0.15)] ring-1 ring-dagang-green/10 font-extrabold scale-105' 
                                : 'text-[var(--text-muted)] opacity-80 hover:text-[var(--text-main)]'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-muted)] font-medium flex-shrink-0">
                        Periode: <span className="text-[var(--text-main)] font-black">
                            {financialSummary?.period_start ? new Date(financialSummary.period_start).toLocaleDateString() : '...'} - {financialSummary?.period_end ? new Date(financialSummary.period_end).toLocaleDateString() : '...'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto flex-wrap">
                        <button 
                            onClick={exportToExcel}
                            className="flex-1 sm:flex-none p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg sm:rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                            title="Export Excel"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase">Excel</span>
                        </button>
                        <button 
                            onClick={exportToPDF}
                            className="flex-1 sm:flex-none p-2 sm:p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg sm:rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                            title="Export PDF"
                        >
                            <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase">PDF</span>
                        </button>
                        <button 
                            onClick={() => setTransferModal({ isOpen: true, initialData: null })}
                            className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--text-main)] rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-sm"
                        >
                            Pindah Budget
                        </button>
                        <button 
                            onClick={() => setExpenseModal({ isOpen: true, initialData: null })}
                            className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-3 bg-dagang-amber text-dagang-emerald-900 rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-dagang-amber/10 border border-dagang-amber/20"
                        >
                            Catat Operasional
                        </button>
                    </div>
                </div>
            </div>

            {/* === HERO: Pendapatan Kotor === */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-2xl shadow-emerald-900/30 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'}}></div>
                <div className="p-5 sm:p-8 md:p-12 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-200" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-emerald-200/80 text-[9px] sm:text-[10px] uppercase font-black tracking-widest">Pendapatan Kotor</p>
                                    <p className="text-emerald-300/60 text-[8px] sm:text-[9px] uppercase tracking-widest">Gross Revenue Periode Ini</p>
                                </div>
                            </div>
                            <div className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tighter break-all">
                                Rp {revenue.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <div className="text-emerald-200/60 text-[9px] sm:text-[10px] font-medium flex-shrink-0 text-right">
                            <div className="flex flex-col gap-1">
                                <span>Gross: Rp {revenue.toLocaleString('id-ID')}</span>
                                <span className="text-red-300">Pajak/Fee: - Rp {totalFees.toLocaleString('id-ID')}</span>
                                <div className="h-px bg-white/20 my-1"></div>
                                <span className="text-white font-black">Net: Rp {netRevenue.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === DISTRIBUSI: Pengeluaran vs Laba Bersih === */}
            <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-heading font-bold text-[var(--text-main)]">Distribusi Pendapatan</h3>
                        <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">Atur pembagian pengeluaran dan laba bersih</p>
                    </div>
                    {!isEditingPct ? (
                        <button 
                            onClick={() => { setTempExpensePct(allocPct); setIsEditingPct(true); }}
                            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl sm:rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest self-start sm:self-auto flex-shrink-0"
                        >
                            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Ubah %
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/5 dark:bg-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 border border-[var(--accent)]">
                                <label className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Pengeluaran:</label>
                                <input
                                    type="number"
                                    value={tempExpensePct}
                                    onChange={(e) => setTempExpensePct(Number(e.target.value))}
                                    min="0" max="100" step="1"
                                    className="w-12 sm:w-16 px-1 sm:px-2 py-1 bg-transparent border-b-2 border-[var(--accent)] text-[var(--text-main)] font-black text-center outline-none text-sm"
                                />
                                <span className="font-black text-[var(--accent)] text-sm">%</span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">→ Laba: {100 - tempExpensePct}%</span>
                            <div className="flex gap-1.5">
                                <button onClick={handleSavePct} className="p-2 sm:p-2.5 bg-emerald-500 text-white rounded-lg sm:rounded-xl hover:scale-110 transition-transform shadow-lg">
                                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button onClick={() => setIsEditingPct(false)} className="p-2 sm:p-2.5 bg-red-500/10 text-red-500 rounded-lg sm:rounded-xl hover:scale-110 transition-transform">
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                    {/* Visual Split Bar */}
                    <div className="flex rounded-xl sm:rounded-2xl overflow-hidden h-3 sm:h-4 mb-4 sm:mb-6 shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 relative group"
                            style={{ width: `${allocPct}%` }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {allocPct}%
                            </div>
                        </div>
                        <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 relative group"
                            style={{ width: `${profitPct}%` }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {profitPct}%
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Pengeluaran Card */}
                        <div className="p-4 sm:p-6 bg-red-500/5 dark:bg-red-500/10 rounded-2xl sm:rounded-[28px] border border-red-500/10 hover:border-red-500/30 transition-all group">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 bg-red-500/10 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest block">Anggaran Pengeluaran</span>
                                    <div className="text-[8px] sm:text-[9px] text-[var(--text-muted)] font-bold">{allocPct}% dari Omzet</div>
                                </div>
                            </div>
                            <div className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-red-500 tracking-tighter group-hover:scale-105 transition-transform origin-left break-all">
                                Rp {expenseTarget.toLocaleString('id-ID')}
                            </div>
                            {actualOperationalExpenses > 0 && (
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-500/10">
                                    <div className="flex flex-col gap-1 text-[9px] sm:text-[10px]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[var(--text-muted)] font-bold">Realisasi:</span>
                                            <span className={`font-black ${actualOperationalExpenses > expenseTarget ? 'text-red-500' : 'text-emerald-500'}`}>
                                                Rp {actualOperationalExpenses.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-red-500/5 pt-1">
                                            <span className="text-[var(--text-muted)] font-bold">
                                                {expenseTarget >= actualOperationalExpenses ? 'Sisa Anggaran:' : 'Over Budget:'}
                                            </span>
                                            <span className={`font-black ${expenseTarget >= actualOperationalExpenses ? 'text-emerald-500' : 'text-red-500 underline decoration-wavy decoration-red-500/30'}`}>
                                                Rp {Math.abs(expenseTarget - actualOperationalExpenses).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                (actualOperationalExpenses / (expenseTarget || 1)) >= 1 ? 'bg-red-500' : (actualOperationalExpenses / (expenseTarget || 1)) >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            title={`${Math.round((actualOperationalExpenses / (expenseTarget || 1)) * 100)}% terpakai`}
                                            style={{ width: `${Math.min((actualOperationalExpenses / (expenseTarget || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Laba Bersih Card — DYNAMIC */}
                        <div className="p-4 sm:p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl sm:rounded-[28px] border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Laba Bersih</span>
                                    <div className="text-[8px] sm:text-[9px] text-[var(--text-muted)] font-bold">Target: {profitPct}% Omzet = Rp {profitTarget.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                            <div className={`font-heading font-black text-xl sm:text-2xl md:text-3xl tracking-tighter group-hover:scale-105 transition-transform origin-left break-all ${actualLabaBersih >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                Rp {actualLabaBersih.toLocaleString('id-ID')}
                            </div>
                            {actualOperationalExpenses > 0 && (
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-500/10">
                                    <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold ${labaDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {labaDiff >= 0 ? (
                                            <>
                                                <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                                <span>+Rp {labaDiff.toLocaleString('id-ID')} dari target (hemat pengeluaran)</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                                <span>-Rp {Math.abs(labaDiff).toLocaleString('id-ID')} dari target (pengeluaran melebihi)</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* === ALOKASI KATEGORI PENGELUARAN === */}
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-12">
                {/* Tabel Alokasi */}
                <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                        <h3 className="text-base sm:text-lg md:text-xl font-heading font-bold text-[var(--text-main)]">Alokasi Pengeluaran per Kategori</h3>
                        <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">
                            Total Pagu Rp {expenseTarget.toLocaleString('id-ID')} ({allocPct}% dari Omzet) — Termasuk Pajak & Fee
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[480px]">
                            <thead>
                                <tr className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Kategori</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-center">Porsi</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Target</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-red-500">Ambil</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-blue-500">Balik</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-red-600">Hutang</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-amber-500">Lent</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Realisasi</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Selisih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-xs sm:text-sm">
                                {paginatedAllocDetails?.map((alloc: any) => {
                                    const isSpecial = alloc.category_id.startsWith('tax-');
                                    const diff = alloc.target_amount - alloc.actual_amount;
                                    return (
                                        <tr key={alloc.category_id} className={`hover:bg-black/5 transition-colors ${isSpecial ? 'bg-amber-500/5' : ''}`}>
                                            <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-bold text-[var(--text-main)]">
                                                <div className="flex items-center gap-2">
                                                    {alloc.category_name}
                                                    {isSpecial && (
                                                        <span className="text-[7px] sm:text-[8px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Wajib</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-center">
                                                <span className={`${isSpecial ? 'bg-black/10 text-[var(--text-muted)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'} px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black`}>
                                                    {alloc.percentage?.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[11px] sm:text-[sm] text-[var(--text-muted)]">
                                                Rp {alloc.target_amount.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-amber-500/70">
                                                {alloc.taken_amount > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span>Rp {alloc.taken_amount.toLocaleString('id-ID')}</span>
                                                        {alloc.taken_details && (
                                                            <span className="text-[7px] sm:text-[8px] opacity-60 font-sans italic truncate max-w-[100px] sm:max-w-[150px]">
                                                                Dari: {alloc.taken_details}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-blue-500/70">
                                                {alloc.returned_amount > 0 ? `Rp ${alloc.returned_amount.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-black text-[10px] sm:text-[11px] text-red-500">
                                                {alloc.remaining_debt > 0 ? `Rp ${alloc.remaining_debt.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-amber-500">
                                                {alloc.lent_amount > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span>Rp {alloc.lent_amount.toLocaleString('id-ID')}</span>
                                                        {alloc.lent_details && (
                                                            <span className="text-[7px] sm:text-[8px] opacity-60 font-sans italic truncate max-w-[100px] sm:max-w-[150px]">
                                                                Ke: {alloc.lent_details}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className={`px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[11px] sm:text-sm ${isSpecial ? 'text-amber-600' : 'text-red-500'}`}>
                                                Rp {alloc.actual_amount.toLocaleString('id-ID')}
                                            </td>
                                            <td className={`px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-black text-[11px] sm:text-sm ${isSpecial ? (diff > 0 ? 'text-amber-500' : 'text-emerald-500') : (diff >= 0 ? 'text-emerald-500' : 'text-amber-500')}`}>
                                                {isSpecial ? (diff > 0 ? '○ Belos Lunas' : '● Lunas') : (diff >= 0 ? '+' : '') + diff.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!paginatedAllocDetails?.length && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] opacity-50 text-[10px] font-black uppercase tracking-widest italic">
                                            Belum ada data alokasi pengeluaran
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {allocations.length > allocItemsPerPage && (
                        <div className="p-3 sm:p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)] transition-all">
                            <TablePagination 
                                currentPage={allocPage}
                                totalItems={allocations.length}
                                itemsPerPage={allocItemsPerPage}
                                onPageChange={setAllocPage}
                            />
                        </div>
                    )}

                    {/* BUDGET INSIGHT BOX - EXPLAINING THE MATH */}
                    <div className="p-6 sm:p-8 md:p-10 bg-[var(--accent)]/5 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 animate-pulse-slow">
                                <TrendingDown className="w-4 h-4 sm:w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-heading font-black text-[var(--text-main)] uppercase tracking-tight">Budget Insight</h4>
                                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">Memahami Alur Anggaran {allocPct}% Platform</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-6">
                            {/* Step 1: Total Pot */}
                            <div className="flex-1 p-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)]/30 transition-all group">
                                <div className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Total Pagu ({allocPct}%)</div>
                                <div className="text-sm sm:text-base font-heading font-black text-[var(--text-main)]">Rp {expenseTarget.toLocaleString('id-ID')}</div>
                                <div className="text-[7px] sm:text-[8px] text-emerald-500 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Dihitung dari Omzet Kotor</div>
                            </div>

                            <div className="hidden md:block">
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-30" />
                            </div>

                            {/* Step 2: Deductions */}
                            <div className="flex-1 p-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-red-500/30 transition-all group">
                                <div className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase mb-1 text-red-500">Potongan Wajib</div>
                                <div className="text-sm sm:text-base font-heading font-black text-red-500">
                                    -Rp {( (allocations.find((a:any) => a.category_id === 'tax-ppn')?.target_amount || 0) + (allocations.find((a:any) => a.category_id === 'tax-gateway')?.target_amount || 0)).toLocaleString('id-ID')}
                                </div>
                                <div className="text-[7px] sm:text-[8px] text-[var(--text-muted)] font-bold mt-1">PPN (11%) + Fee TriPay</div>
                            </div>

                            <div className="hidden md:block">
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-30" />
                            </div>

                            {/* Step 3: Final Ops Budget */}
                            <div className="flex-1 p-4 bg-[var(--accent)] text-white rounded-2xl border border-[var(--accent)] shadow-md shadow-[var(--accent)]/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="text-[8px] sm:text-[9px] font-black text-white/70 uppercase mb-1">Sisa Dana Operasional</div>
                                    <div className="text-sm sm:text-base font-heading font-black">
                                        Rp {Math.max(0, (expenseTarget - (allocations.find((a:any) => a.category_id === 'tax-ppn')?.target_amount || 0) - (allocations.find((a:any) => a.category_id === 'tax-gateway')?.target_amount || 0))).toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-[7px] sm:text-[8px] text-white/50 font-bold mt-1">Dibagi ke Kategori Operasional</div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                            </div>
                        </div>

                        <div className="mt-8 flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-[var(--border)] italic">
                            <AlertCircle className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                                Bosku, agar Laba Bersih <span className="text-[var(--text-main)] font-black">{(100-allocPct).toFixed(0)}%</span> tetap terjaga, maka biaya wajib (Pajak & Fee) ditaruh sebagai prioritas pengurang anggaran. Sisa dana operasional (box biru) baru kemudian dibagi sesuai persentase kategori yang bosku atur di sidebar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section: Profit Allocation */}
                <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-[var(--accent)]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)]">Alokasi Laba Bersih</h3>
                            <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-70">Pembagian Keuntungan Platform</p>
                        </div>
                        <div className="bg-white/5 dark:bg-black/20 p-3 sm:px-6 sm:py-3 rounded-2xl border border-[var(--border)] shadow-inner">
                            <div className="text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Target Laba (Periode Ini):</div>
                            <div className="text-lg sm:text-2xl font-heading font-black text-[var(--accent)]">
                                Rp {financialSummary?.net_profit_target?.toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Pos Alokasi</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-center">Porsi</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Target</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-red-500">Ambil</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-blue-500">Balik</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-red-600">Hutang</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right text-amber-500">Lent</th>
                                    <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Realisasi</th>
                                    <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Sisa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-xs sm:text-sm">
                                {paginatedProfitDetails?.length > 0 ? (
                                    paginatedProfitDetails.map((alloc: any) => {
                                        const diff = alloc.target_amount - alloc.actual_amount;
                                        return (
                                            <tr key={alloc.category_id} className="hover:bg-[var(--accent)]/5 transition-colors">
                                                <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-bold text-[var(--text-main)]">{alloc.category_name}</td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-center">
                                                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded text-[10px] font-black">
                                                        {alloc.percentage}%
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[11px] sm:text-sm text-[var(--text-main)]">
                                                    Rp {alloc.target_amount.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-amber-500/70">
                                                    {alloc.taken_amount > 0 ? (
                                                        <div className="flex flex-col items-end">
                                                            <span>Rp {alloc.taken_amount.toLocaleString('id-ID')}</span>
                                                            {alloc.taken_details && (
                                                                <span className="text-[7px] sm:text-[8px] opacity-60 font-sans italic truncate max-w-[100px] sm:max-w-[150px]">
                                                                    Dari: {alloc.taken_details}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-blue-500/70">
                                                    {alloc.returned_amount > 0 ? `Rp ${alloc.returned_amount.toLocaleString('id-ID')}` : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-black text-[10px] sm:text-[11px] text-red-500">
                                                    {alloc.remaining_debt > 0 ? `Rp ${alloc.remaining_debt.toLocaleString('id-ID')}` : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[10px] sm:text-[11px] text-amber-500">
                                                    {alloc.lent_amount > 0 ? (
                                                        <div className="flex flex-col items-end">
                                                            <span>Rp {alloc.lent_amount.toLocaleString('id-ID')}</span>
                                                            {alloc.lent_details && (
                                                                <span className="text-[7px] sm:text-[8px] opacity-60 font-sans italic truncate max-w-[100px] sm:max-w-[150px]">
                                                                    Ke: {alloc.lent_details}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-bold text-[11px] sm:text-sm text-emerald-500">
                                                    Rp {alloc.actual_amount.toLocaleString('id-ID')}
                                                </td>
                                                <td className={`px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-black text-[11px] sm:text-sm ${diff >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    Rp {diff.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] opacity-50 text-[10px] font-black uppercase tracking-widest italic">
                                            Belum ada alokasi laba bersih (PROFIT)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {profitAllocations.length > allocItemsPerPage && (
                        <div className="p-3 sm:p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                            <TablePagination 
                                currentPage={profitPage}
                                totalItems={profitAllocations.length}
                                itemsPerPage={allocItemsPerPage}
                                onPageChange={setProfitPage}
                            />
                        </div>
                    )}
                </div>

                {/* Riwayat Pindah Saldo (Alokasi Dinamis) */}
                {financialSummary?.budget_transfers && financialSummary.budget_transfers.length > 0 && (
                    <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-blue-500/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                        <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-heading font-bold text-blue-600 dark:text-blue-400">Riwayat Penyesuaian Saldo (Alokasi Dinamis)</h3>
                                <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">
                                    Catatan pinjam-meminjam budget antar kategori pada periode ini
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[500px]">
                                <thead>
                                    <tr className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Tanggal</th>
                                        <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Tipe</th>
                                        <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Pelaku Utama</th>
                                        <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Jumlah (Rp)</th>
                                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Detail Alasan</th>
                                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] text-xs sm:text-sm">
                                    {financialSummary.budget_transfers.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-blue-500/5 transition-colors">
                                            <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-bold text-[var(--text-main)] whitespace-nowrap">
                                                {new Date(t.transfer_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                                                    t.type === 'RETURN' 
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                    {t.type === 'RETURN' ? 'Kembalikan' : 'Ambil Budget'}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-bold">
                                                <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                                                    <span className="text-amber-500">{t.from_category}</span>
                                                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)] opacity-40" />
                                                    <span className="text-emerald-500">{t.to_category}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-mono font-black text-[11px] sm:text-sm text-blue-500">
                                                Rp {t.amount.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] sm:text-xs text-[var(--text-muted)] italic max-w-xs truncate">
                                                {t.reason || '-'}
                                            </td>
                                            <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleEditTransfer(t)}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteTransfer(t.id)}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Kelola Kategori Section */}
                <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)]">Kelola Kategori Anggaran</h3>
                            <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">
                                Atur Persentase Alokasi untuk Biaya Operasional dan Profit
                            </p>
                        </div>
                        <button 
                            onClick={handleAddCategory}
                            className="w-full sm:w-auto px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--accent)]/20 flex items-center justify-center gap-2 flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Kategori
                        </button>
                    </div>

                    <div className="p-4 sm:p-8">
                        <div className="max-w-4xl mx-auto">
                            {/* TABS PENGELOLAAN */}
                            <div className="flex p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl mb-8">
                                <button 
                                    onClick={() => setActiveCategoryType('EXPENSE')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-2 ${activeCategoryType === 'EXPENSE' ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    <TrendingDown className="w-4 h-4" />
                                    BUDGET BIAYA OPERASIONAL
                                </button>
                                <button 
                                    onClick={() => setActiveCategoryType('PROFIT')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-2 ${activeCategoryType === 'PROFIT' ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    ALOKASI PROFIT PLATFORM
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                    Total Alokasi {activeCategoryType === 'EXPENSE' ? 'Biaya' : 'Profit'}
                                </div>
                                <div className={`text-xs font-black ${currentTotalPct === 100 ? 'text-emerald-500' : currentTotalPct > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                                    {currentTotalPct}%
                                </div>
                            </div>
                            <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-6">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        currentTotalPct === 100 ? 'bg-emerald-500' : currentTotalPct > 100 ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(currentTotalPct, 100)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.filter(c => (activeCategoryType === 'PROFIT' ? c.type === 'PROFIT' : c.type !== 'PROFIT')).map((cat: any) => (
                                    <div key={cat.id} className="flex flex-col p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] group hover:border-[var(--accent)]/30 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-xs sm:text-sm font-black text-[var(--text-main)] truncate pr-2">{cat.name}</div>
                                            <div className="flex items-center gap-0.5">
                                                <button onClick={() => handleUpdateCategory(cat)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <div className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-lg text-[10px] font-black">
                                                {cat.percentage}%
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                                            <div className="text-[10px] font-bold text-[var(--text-muted)]">
                                                Rp {( (activeCategoryType === 'EXPENSE' ? expenseTarget : profitTarget) * (cat.percentage / 100)).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === RIWAYAT BIAYA OPERASIONAL === */}
            <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                    <h3 className="text-base sm:text-lg md:text-xl font-heading font-bold text-[var(--text-main)]">Riwayat Biaya Operasional</h3>
                    <p className="text-[var(--text-muted)] text-[9px] sm:text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">Pengeluaran & Biaya Platform</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[520px]">
                        <thead>
                            <tr className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Kategori</th>
                                <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Keterangan</th>
                                <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Jumlah</th>
                                <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 font-black">Tanggal</th>
                                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-right font-black">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-xs sm:text-sm">
                            {paginatedExpDetails.length > 0 ? paginatedExpDetails.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 md:px-8 py-4 sm:py-6">
                                        <div className="text-[11px] sm:text-xs font-bold text-[var(--text-main)] leading-tight truncate max-w-[150px] sm:max-w-none">{exp.description || '-'}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 font-bold text-red-500 text-[11px] sm:text-sm">
                                        - {exp.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 text-[10px] sm:text-xs text-[var(--text-muted)] opacity-70 font-medium whitespace-nowrap">
                                        {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                                        <div className="flex items-center justify-end gap-1">
                                            <button 
                                                onClick={() => handleEditExpense(exp)}
                                                className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExpense(exp.id)}
                                                className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 sm:p-12 text-center text-[var(--text-muted)] opacity-40 text-[9px] sm:text-[10px] uppercase font-black tracking-widest">Tidak ada data biaya operasional</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 sm:p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                    <TablePagination 
                        currentPage={expPage}
                        totalItems={financialSummary?.expense_details?.length || 0}
                        itemsPerPage={usersPerPage}
                        onPageChange={setExpPage}
                    />
                </div>
            </div>
            {/* Modals */}
            <PlatformTransferModal
                isOpen={transferModal.isOpen}
                initialData={transferModal.initialData}
                onClose={() => setTransferModal({ isOpen: false, initialData: null })}
                onSubmit={handleTransferSubmit}
                allocations={[...allocations, ...profitAllocations]}
            />
        </div>
    );
};
