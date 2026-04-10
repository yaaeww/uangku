import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Search,
    Calculator,
    Calendar,
    ChevronDown,
    X,
    Trash2,
    Check,
    Pencil,
    FileText,
    Download,
    ChevronLeft,
    ChevronRight,
    Box,
    Camera,
    FileDown,
    AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet as WalletModel } from '../../models';
import { formatRupiah, parseRupiah } from '../../utils/formatters';
import { Calculator as CalculatorComp } from '../../components/Calculator';
import { ReceiptScannerModal } from '../../components/family/ReceiptScannerModal';
import { FinanceController } from '../../controllers/FinanceController';
import { BudgetController } from '../../controllers/BudgetController';
import { useModal } from '../../providers/ModalProvider';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PremiumPeriodSelector } from '../../components/common/PremiumPeriodSelector';



interface TransactionsViewProps {
    transactions: Transaction[];
    wallets: WalletModel[];
    familyRole: string;
    currentUserId: string;
    activeTab: 'income' | 'expense' | 'transfer';
    setActiveTab: (tab: 'income' | 'expense' | 'transfer') => void;
    newTx: any;
    setNewTx: (tx: any) => void;
    handleCreateTransaction: () => void;
    handleBulkCreateTransactions: (txs: any[]) => void;
    isSingleModalOpen: boolean;
    setIsSingleModalOpen: (open: boolean) => void;
    isBulkModalOpen: boolean;
    setIsBulkModalOpen: (open: boolean) => void;
    handleDeleteTransaction: (id: string, date?: string) => void;
    handleUpdateTransaction: (id: string, tx: any) => void;
    savings: any[];
    goals: any[];
    familyMembers?: any[];
    categories?: string[];
    incomeCategories?: any[];
    budgetCategories?: any[];
    selectedMonth: number;
    setSelectedMonth: (m: number) => void;
    selectedYear: number;
    setSelectedYear: (y: number) => void;
    selectedWeek: number;
    setSelectedWeek: (w: number) => void;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    totalTransactions: number;
    transactionsLimit: number;
    filteredTotalIncome: number;
    filteredTotalExpense: number;
    summary: any;
}

const DEFAULT_INCOME_CATEGORIES = [
    { name: 'Gaji', emoji: '💰' },
    { name: 'Bonus/Hadiah', emoji: '🎁' },
    { name: 'Investasi', emoji: '📈' },
    { name: 'Penjualan', emoji: '💵' },
    { name: 'Bunga/Dividen', emoji: '🏦' },
    { name: 'Sewa', emoji: '🏠' },
    { name: 'Freelance', emoji: '⚡' },
    { name: 'Lain-lain', emoji: '🪙' }
];

/* --- Subcomponents --- */

const FilterDropdown = ({ label, value, options, onChange, icon: Icon }: { label: string, value: string, options: any[], onChange: (v: string) => void, icon?: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);
    const isFiltered = value !== 'all';

    return (
        <div className="relative group/filter">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-5 py-3 
                    bg-[var(--surface-card)] border border-[var(--border)] 
                    rounded-2xl text-[11px] font-black tracking-wider uppercase
                    transition-all duration-300 shadow-sm
                    hover:border-dagang-green/40 hover:shadow-md hover:-translate-y-0.5
                    ${isOpen ? 'ring-2 ring-dagang-green/20 border-dagang-green font-bold bg-black/5 dark:bg-white/5' : ''}
                    ${isFiltered ? 'text-dagang-green border-dagang-green/30 bg-dagang-green/[0.03]' : 'text-[var(--text-muted)]'}
                `}
            >
                <div className={`
                    p-1.5 rounded-lg transition-colors
                    ${isFiltered ? 'bg-dagang-green/10 text-dagang-green' : 'bg-black/5 dark:bg-white/5 opacity-60'}
                `}>
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                </div>
                
                <span className="truncate max-w-[120px]">
                    {selectedOption ? selectedOption.label : label}
                </span>

                <div className="flex items-center gap-1 ml-auto">
                    {isFiltered && (
                        <div className="w-1.5 h-1.5 rounded-full bg-dagang-green animate-pulse" />
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
                    <div className={`
                        absolute top-full left-0 md:right-0 md:left-auto mt-2 
                        min-w-[220px] bg-[var(--surface-card)]/90 backdrop-blur-xl
                        rounded-[28px] shadow-2xl shadow-black/20 border border-[var(--border)] 
                        z-[151] py-2 overflow-hidden
                        animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 
                        max-h-[380px] overflow-y-auto custom-scrollbar
                    `}>
                        <div className="px-5 py-2 mb-1">
                            <span className="text-[9px] font-black tracking-[0.2em] text-[var(--text-muted)] opacity-40 uppercase">
                                Pilih {label}
                            </span>
                        </div>

                        <div
                            onClick={() => { onChange('all'); setIsOpen(false); }}
                            className={`
                                flex items-center justify-between
                                px-4 py-2.5 text-[12px] font-bold cursor-pointer transition-all mx-2 rounded-xl mb-1
                                ${value === 'all' 
                                    ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-[1.02]' 
                                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                            `}
                        >
                            <span>Semua {label}</span>
                            {value === 'all' && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-50" />

                        {options.map((option: any) => (
                            <div
                                key={option.value}
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`
                                    flex items-center justify-between
                                    px-4 py-2.5 text-[12px] font-bold cursor-pointer transition-all mx-2 rounded-xl mb-1
                                    ${value === option.value 
                                        ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-[1.02]' 
                                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="w-3.5 h-3.5" />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/* --- Memoized Row Component --- */

const TransactionRow = React.memo(({ 
    tx, 
    currentUserId, 
    familyRole, 
    wallets, 
    setNewTx, 
    setEditingTxId, 
    setIsEditing, 
    setActiveTab, 
    setIsSingleModalOpen, 
    handleDeleteTransaction 
}: {
    tx: any,
    currentUserId: string,
    familyRole: string,
    wallets: any[],
    setNewTx: (tx: any) => void,
    setEditingTxId: (id: any) => void,
    setIsEditing: (editing: boolean) => void,
    setActiveTab: (tab: any) => void,
    setIsSingleModalOpen: (open: boolean) => void,
    handleDeleteTransaction: (id: string, date: string) => void
}) => {
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const wallet = wallets.find(w => w.id === tx.walletId);
    
    return (
        <React.Fragment>
            {/* Desktop View */}
            <tr className="hidden md:table-row group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isIncome ? 'bg-dagang-green/10 text-dagang-green' :
                            isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                            {isIncome ? <TrendingUp className="w-5 h-5" /> :
                             isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--text-main)]">
                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-medium">
                                {new Date(tx.date).getFullYear()}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                            {tx.description}
                            {tx.user?.fullName && (
                                <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[9px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-tighter" title={`Dicatat oleh ${tx.user.fullName}`}>
                                    {tx.user.fullName.split(' ')[0]}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Box className="w-3 h-3 text-[var(--text-muted)] opacity-50" />
                            <span className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-wider">{tx.category || 'Transaksi'}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-5">
                    <div className="px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border)] w-fit">
                        <span className="text-[11px] font-bold text-[var(--text-main)] opacity-70">{wallet?.name || '-'}</span>
                    </div>
                </td>
                <td className="px-6 py-5 text-right">
                    <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-dagang-green' : (tx.type === 'transfer' ? 'text-blue-500' : 'text-red-500')}`}>
                        {isIncome ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                </td>
                <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                        {(tx.userId === currentUserId && familyRole !== 'viewer' && tx.category !== 'debt_payment' && tx.category !== 'DEBT_PAYMENT') ? (
                            <>
                                <button 
                                    onClick={() => {
                                        setNewTx({
                                            description: tx.description,
                                            walletId: tx.walletId,
                                            toWalletId: tx.toWalletId || '',
                                            amount: tx.amount,
                                            fee: tx.fee || 0,
                                            date: tx.date.split('T')[0],
                                            category: tx.category || '',
                                            type: tx.type,
                                            savingId: tx.savingId || '',
                                            goalId: tx.goalId || '',
                                            originalDate: tx.date.split('T')[0]
                                        });
                                        setEditingTxId(tx.id);
                                        setIsEditing(true);
                                        setActiveTab(tx.type === 'saving' ? 'expense' : tx.type as any);
                                        setIsSingleModalOpen(true);
                                    }}
                                    className="p-2 text-[var(--text-muted)] hover:text-dagang-green hover:bg-dagang-green/10 rounded-lg transition-colors"
                                    title="Ubah Transaksi"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteTransaction(tx.id, tx.date)}
                                    className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Hapus Transaksi"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-30 italic">View Only</span>
                        )}
                    </div>
                </td>
            </tr>

            {/* Mobile View */}
            <tr className="md:hidden group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[var(--border)]">
                <td colSpan={5} className="p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                                    isIncome ? 'bg-dagang-green/10 text-dagang-green' :
                                    isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {isIncome ? <TrendingUp className="w-5 h-5" /> :
                                     isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[var(--text-main)] line-clamp-2">
                                        {tx.description}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-[var(--text-muted)] opacity-60 font-medium">
                                            {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        {tx.user?.fullName && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[9px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-tighter" title={`Dicatat oleh ${tx.user.fullName}`}>
                                                {tx.user.fullName.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[14px] shrink-0 whitespace-nowrap font-black tracking-tight mt-1 ${isIncome ? 'text-dagang-green' : (tx.type === 'transfer' ? 'text-blue-500' : 'text-red-500')}`}>
                                {isIncome ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between pl-13">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="px-2 py-1 bg-black/5 dark:bg-white/5 rounded-md border border-[var(--border)] text-[9px] font-bold text-[var(--text-main)] opacity-70 whitespace-nowrap">
                                    {wallet?.name || '-'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Box className="w-3 h-3 text-[var(--text-muted)] opacity-50" />
                                    <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-wider">{tx.category || 'Transaksi'}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                                {(tx.userId === currentUserId && familyRole !== 'viewer' && tx.category !== 'debt_payment' && tx.category !== 'DEBT_PAYMENT') ? (
                                    <>
                                        <button 
                                            onClick={() => {
                                                setNewTx({
                                                    description: tx.description,
                                                    walletId: tx.walletId,
                                                    toWalletId: tx.toWalletId || '',
                                                    amount: tx.amount,
                                                    fee: tx.fee || 0,
                                                    date: tx.date.split('T')[0],
                                                    category: tx.category || '',
                                                    type: tx.type,
                                                    savingId: tx.savingId || '',
                                                    goalId: tx.goalId || '',
                                                    originalDate: tx.date.split('T')[0]
                                                });
                                                setEditingTxId(tx.id);
                                                setIsEditing(true);
                                                setActiveTab(tx.type === 'saving' ? 'expense' : tx.type as any);
                                                setIsSingleModalOpen(true);
                                            }}
                                            className="p-2 text-[var(--text-muted)] hover:text-dagang-green bg-black/5 dark:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTransaction(tx.id, tx.date)}
                                            className="p-2 text-[var(--text-muted)] hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 italic">View</span>
                                )}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
});

export const TransactionsView = ({
    transactions,
    wallets,
    familyRole,
    currentUserId,
    activeTab,
    setActiveTab,
    newTx,
    setNewTx,
    handleCreateTransaction,
    handleBulkCreateTransactions,
    isSingleModalOpen,
    setIsSingleModalOpen,
    isBulkModalOpen,
    setIsBulkModalOpen,
    handleDeleteTransaction,
    handleUpdateTransaction,
    savings,
    goals,
    familyMembers,
    categories,
    incomeCategories,
    budgetCategories,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedWeek,
    setSelectedWeek,
    currentPage,
    setCurrentPage,
    totalTransactions,
    transactionsLimit,
    filteredTotalIncome,
    filteredTotalExpense,
    summary
}: TransactionsViewProps) => {
    /* --- State --- */
    const [filterWallet, setFilterWallet] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

    // Export States
    const [isExporting, setIsExporting] = useState(false);
    const exportKey = `export_status_${selectedMonth}_${selectedYear}_${selectedWeek}`;
    const [hasExported, setHasExported] = useState<boolean>(() => {
        return localStorage.getItem(exportKey) === 'true';
    });

    useEffect(() => {
        setHasExported(localStorage.getItem(exportKey) === 'true');
    }, [exportKey]);

    const rowsPerPage = transactionsLimit || 25;
    const totalPages = Math.ceil(totalTransactions / rowsPerPage) || 1;

    /* --- Memoized Data --- */
    const filteredTransactions = useMemo(() => {
        let result = transactions || [];
        
        // Filter by Tab (Type)
        if (activeTab === 'income') {
            result = result.filter(tx => tx.type === 'income');
        } else if (activeTab === 'expense') {
            result = result.filter(tx => tx.type === 'expense' || tx.type === 'saving' || tx.type === 'goal_allocation' || tx.type === 'debt_payment');
        } else {
            result = result.filter(tx => tx.type === 'transfer');
        }

        if (filterWallet !== 'all') {
            result = result.filter(tx => tx.walletId === filterWallet);
        }
        
        if (filterCategory !== 'all') {
            result = result.filter(tx => tx.category === filterCategory);
        }
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(tx => 
                (tx.description || '').toLowerCase().includes(q) || 
                (tx.category && (tx.category || '').toLowerCase().includes(q))
            );
        }
        
        return result;
    }, [transactions, activeTab, filterWallet, filterCategory, searchQuery]);

    const paginatedTransactions = filteredTransactions;
    const categoryOptions = useMemo(() => {
        const cats = new Set<string>();
        transactions.forEach(tx => { if (tx.category) cats.add(tx.category); });
        return Array.from(cats).map(c => ({ label: c, value: c }));
    }, [transactions]);

    const fetchFullDataForExport = async () => {
        try {
            const res = await api.get('/finance/transactions', {
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                    week: selectedWeek > 0 ? selectedWeek : undefined,
                    page: 1,
                    limit: 50000 
                }
            });
            return res.data?.data || [];
        } catch (error) {
            console.error("Export Fetch Error", error);
            return null;
        }
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        setIsExporting(true);
        const toastId = toast.loading(`Menyiapkan ${format.toUpperCase()} Laporan... Mohon tunggu.`);
        try {
            const rawData = await fetchFullDataForExport();
            if (!rawData || rawData.length === 0) {
                toast.error("Data transaksi kosong pada periode ini.", { id: toastId });
                setIsExporting(false);
                return;
            }

            // Map data
            const mappedData = rawData.map((tx: any) => ({
                Tanggal: new Date(tx.date).toLocaleDateString('id-ID'),
                Deskripsi: tx.description || '-',
                Kategori: tx.category || '-',
                Tipe: tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
                Dompet: wallets.find(w => w.id === tx.walletId)?.name || 'Dompet',
                Jumlah: tx.amount
            }));

            // Calc Summary
            const tIncome = rawData.filter((tx: any) => tx.type === 'income').reduce((acc: number, tx: any) => acc + tx.amount, 0);
            const tExpense = rawData.filter((tx: any) => tx.type === 'expense' || tx.type === 'saving').reduce((acc: number, tx: any) => acc + tx.amount, 0);
            const periodText = selectedWeek > 0 
                ? `Minggu ${selectedWeek}, Bulan ${selectedMonth} Tahun ${selectedYear}`
                : `Bulan ${selectedMonth} Tahun ${selectedYear}`;

            if (format === 'excel') {
                const ws = XLSX.utils.json_to_sheet(mappedData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
                XLSX.writeFile(wb, `Laporan_UangKu_${periodText.replace(/ /g, '_')}.xlsx`);
            } else if (format === 'pdf') {
                const doc = new jsPDF();
                
                // Header
                doc.setFontSize(18);
                doc.setTextColor(4, 120, 87); // dagang-green
                doc.text("Laporan Keuangan UangKu", 14, 22);
                
                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text(`Periode: ${periodText}`, 14, 30);
                
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(`Total Pemasukan : Rp ${tIncome.toLocaleString('id-ID')}`, 14, 40);
                doc.text(`Total Pengeluaran: Rp ${tExpense.toLocaleString('id-ID')}`, 14, 46);

                const tableData = mappedData.map((row: any) => [
                    row.Tanggal, row.Deskripsi, row.Kategori, row.Tipe, row.Dompet,
                    `Rp ${row.Jumlah.toLocaleString('id-ID')}`
                ]);

                autoTable(doc, {
                    startY: 52,
                    head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Dompet', 'Jumlah']],
                    body: tableData,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255] },
                    alternateRowStyles: { fillColor: [249, 250, 251] }
                });
                
                doc.save(`Laporan_UangKu_${periodText.replace(/ /g, '_')}.pdf`);
            }

            toast.success(`Export ${format.toUpperCase()} Berhasil!`, { id: toastId });
            localStorage.setItem(exportKey, 'true');
            setHasExported(true);

        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat memproses Export.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col mobile:flex-row items-center justify-between gap-6 p-4 mobile:p-0">
                <div className="space-y-1">
                    <h2 className="text-3xl mobile:text-[32px] font-black text-[var(--text-main)] tracking-tight">Riwayat Transaksi</h2>
                    <p className="text-[var(--text-muted)] font-bold opacity-50 uppercase tracking-widest text-[10px]">Tinjau dan kelola keuangan keluarga</p>
                </div>

                <div className="flex flex-wrap items-center justify-center mobile:justify-end gap-2 w-full mobile:w-auto">
                   <button 
                        onClick={() => {
                            setIsEditing(false);
                            setEditingTxId(null);
                            setNewTx({
                                type: activeTab === 'transfer' ? 'transfer' : activeTab,
                                date: new Date().toISOString().split('T')[0],
                                amount: 0,
                                description: '',
                                category: '',
                                walletId: wallets?.[0]?.id || '',
                            });
                            setIsSingleModalOpen(true);
                        }}
                        className="flex-1 mobile:flex-none flex items-center justify-center gap-2 px-3 py-3 mobile:px-5 mobile:py-4 bg-dagang-green text-white rounded-2xl font-black text-[10px] mobile:text-[11px] uppercase tracking-wider hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10 active:scale-95"
                    >
                        <Plus className="w-3.5 h-3.5 mobile:w-4 mobile:h-4 font-black" />
                        Tambah
                    </button>
                    <button 
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex-1 mobile:flex-none flex items-center justify-center gap-2 px-3 py-3 mobile:px-5 mobile:py-4 bg-[var(--surface-card)] text-[var(--text-main)] border border-[var(--border)] rounded-2xl font-black text-[10px] mobile:text-[11px] uppercase tracking-wider hover:bg-black/5 transition-all shadow-sm active:scale-95"
                    >
                        <FileText className="w-3.5 h-3.5 mobile:w-4 mobile:h-4" />
                        Bulk
                    </button>
                    <div className="flex bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden h-[42px] mobile:h-[50px]">
                        <button 
                            onClick={() => handleExport('excel')}
                            disabled={isExporting}
                            className="px-4 text-[var(--text-main)] hover:bg-black/5 transition-all border-r border-[var(--border)] disabled:opacity-50 flex items-center justify-center"
                            title="Export Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="px-4 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center"
                            title="Export PDF"
                        >
                            <FileDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Banner untuk Mengingatkan Export */}
            {!hasExported && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl text-amber-800 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div className="flex-1 text-sm">
                        <span className="font-bold">Pengingat:</span> Laporan transaksi untuk periode 
                        {selectedWeek > 0 ? ` Minggu ${selectedWeek}` : ''} Bulan {new Date(2000, selectedMonth - 1, 1).toLocaleDateString('id-ID', { month: 'long' })} Tahun {selectedYear || '-'} belum diekspor. Unduh sekarang untuk keperluan arsip!

                    </div>
                </div>
            )}

            {/* Premium Tab Bar & Summary Row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1.5 bg-[var(--surface-card)]/50 backdrop-blur-md rounded-[28px] border border-[var(--border)] w-fit shadow-sm">
                    <TransactionTab 
                        active={activeTab === 'income'} 
                        onClick={() => setActiveTab('income')} 
                        icon={TrendingUp} 
                        label="Pemasukan" 
                        color="text-dagang-green"
                    />
                    <TransactionTab 
                        active={activeTab === 'expense'} 
                        onClick={() => setActiveTab('expense')} 
                        icon={TrendingDown} 
                        label="Pengeluaran" 
                        color="text-red-500"
                    />
                    <TransactionTab 
                        active={activeTab === 'transfer'} 
                        onClick={() => setActiveTab('transfer')} 
                        icon={ArrowRightLeft} 
                        label="Transfer" 
                        color="text-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full mobile:w-auto">
                    <div className="flex-1 mobile:flex-none px-4 py-3 mobile:px-6 mobile:py-4 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/10 rounded-3xl flex flex-col items-end">
                        <span className="text-[8px] mobile:text-[9px] font-black text-emerald-600/50 uppercase tracking-[0.1em] mb-1">Pemasukan</span>
                        <span className="text-[14px] mobile:text-[18px] font-black text-emerald-600">Rp {(filteredTotalIncome || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex-1 mobile:flex-none px-4 py-3 mobile:px-6 mobile:py-4 bg-red-500/[0.03] dark:bg-red-500/[0.05] border border-red-500/10 rounded-3xl flex flex-col items-end">
                        <span className="text-[8px] mobile:text-[9px] font-black text-red-600/50 uppercase tracking-[0.1em] mb-1">Pengeluaran</span>
                        <span className="text-[14px] mobile:text-[18px] font-black text-red-500">Rp {(filteredTotalExpense || 0).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>

            {/* Filter & Actions Bar */}
            <div className="flex flex-col gap-4 p-4 mobile:p-6 bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] shadow-sm">
                <div className="flex flex-col mobile:flex-row gap-4 items-center justify-between w-full">
                    <div className="relative w-full mobile:w-[350px] group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40 group-focus-within:text-dagang-green transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari deskripsi atau kategori..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-3.5 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-30 focus:ring-2 ring-dagang-green/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full mobile:w-auto overflow-x-auto mobile:overflow-x-visible pb-2 mobile:pb-0 custom-scrollbar">
                        <PremiumPeriodSelector
                            label="Bulan"
                            variant="dark"
                            value={selectedMonth}
                            onChange={(v) => { setSelectedMonth(parseInt(v)); setCurrentPage(1); }}
                            options={[
                                { label: 'Januari', value: '1' }, { label: 'Februari', value: '2' }, { label: 'Maret', value: '3' },
                                { label: 'April', value: '4' }, { label: 'Mei', value: '5' }, { label: 'Juni', value: '6' },
                                { label: 'Juli', value: '7' }, { label: 'Agustus', value: '8' }, { label: 'September', value: '9' },
                                { label: 'Oktober', value: '10' }, { label: 'November', value: '11' }, { label: 'Desember', value: '12' }
                            ]}
                        />
                        <PremiumPeriodSelector
                            label="Tahun"
                            variant="dark"
                            value={selectedYear}
                            onChange={(v) => { setSelectedYear(parseInt(v)); setCurrentPage(1); }}
                            options={Array.from({ length: 21 }, (_, i) => ({ 
                                label: (new Date().getFullYear() - 10 + i).toString(), 
                                value: (new Date().getFullYear() - 10 + i).toString() 
                            }))}
                        />

                        <FilterDropdown
                            label="Semua Minggu"
                            value={selectedWeek.toString()}
                            onChange={(v) => { setSelectedWeek(v === 'all' ? 0 : parseInt(v)); setCurrentPage(1); }}
                            options={[
                                { label: 'Minggu 1', value: '1' },
                                { label: 'Minggu 2', value: '2' },
                                { label: 'Minggu 3', value: '3' },
                                { label: 'Minggu 4', value: '4' },
                                { label: 'Minggu 5', value: '5' }
                            ]}
                        />
                         <div className="w-px h-8 bg-[var(--border)] mx-1 hidden mobile:block opacity-50" />
                        <FilterDropdown
                            label="Dompet"
                            value={filterWallet}
                            onChange={setFilterWallet}
                            options={wallets.map((w: any) => ({ label: w.name, value: w.id }))}
                        />
                        <FilterDropdown
                            label="Kategori"
                            value={filterCategory}
                            onChange={setFilterCategory}
                            options={categoryOptions}
                        />
                    </div>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="hidden md:table-header-group">
                            <tr className="bg-black/5 dark:bg-white/5">
                                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] w-[20%]">Tanggal</th>
                                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em]">Deskripsi & Kategori</th>
                                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em]">Dompet</th>
                                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] text-right">Jumlah</th>
                                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
                                        </div>
                                        <p className="text-[var(--text-muted)] font-bold opacity-60">Tidak ada transaksi ditemukan.</p>
                                    </td>
                                </tr>
                            ) : paginatedTransactions.map((tx) => (
                                <TransactionRow 
                                    key={tx.id}
                                    tx={tx}
                                    currentUserId={currentUserId}
                                    familyRole={familyRole}
                                    wallets={wallets}
                                    setNewTx={setNewTx}
                                    setEditingTxId={setEditingTxId}
                                    setIsEditing={setIsEditing}
                                    setActiveTab={setActiveTab}
                                    setIsSingleModalOpen={setIsSingleModalOpen}
                                    handleDeleteTransaction={handleDeleteTransaction}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-[var(--border)] flex flex-col mobile:flex-row items-center justify-between gap-4 bg-black/5 dark:bg-white/5 overflow-x-hidden">
                        <div className="text-[12px] font-bold text-[var(--text-muted)] opacity-50 shrink-0">
                            Menampilkan <span className="text-[var(--text-main)]">{Math.min(filteredTransactions.length, rowsPerPage)}</span> dari <span className="text-[var(--text-main)]">{totalTransactions}</span> transaksi
                        </div>
                        <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-2 mobile:pb-0 custom-scrollbar-hide">
                            <button
                                onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-1 min-w-max">
                                {(() => {
                                    const pagesPerGroup = 10;
                                    const currentGroup = Math.ceil(currentPage / pagesPerGroup);
                                    const startPage = (currentGroup - 1) * pagesPerGroup + 1;
                                    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
                                    const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                                    return (
                                        <>
                                            {startPage > 1 && (
                                                <button
                                                    onClick={() => setCurrentPage(startPage - 1)}
                                                    className="w-10 h-10 rounded-xl text-xs font-black transition-all shrink-0 bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"
                                                >
                                                    ...
                                                </button>
                                            )}
                                            {visiblePages.map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all shrink-0 ${
                                                        currentPage === page 
                                                        ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-110' 
                                                        : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            {endPage < totalPages && (
                                                <button
                                                    onClick={() => setCurrentPage(endPage + 1)}
                                                    className="w-10 h-10 rounded-xl text-xs font-black transition-all shrink-0 bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"
                                                >
                                                    ...
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <button
                                onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm shrink-0"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <SingleTransactionModal
                isOpen={isSingleModalOpen}
                onClose={() => setIsSingleModalOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                newTx={newTx}
                setNewTx={setNewTx}
                wallets={wallets}
                goals={goals}
                handleCreateTransaction={handleCreateTransaction}
                handleUpdateTransaction={handleUpdateTransaction}
                isEditing={isEditing}
                editingTxId={editingTxId}
                savings={savings}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onOpenScanner={() => {
                    setIsSingleModalOpen(false);
                    setIsScannerModalOpen(true);
                }}
                incomeCategories={incomeCategories}
                budgetCategories={budgetCategories}
                currentUserId={currentUserId}
                familyMembers={familyMembers || []}
            />

            <CalculatorComp
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
                onApply={(val) => {
                    setNewTx({ ...newTx, amount: val });
                    setIsCalculatorOpen(false);
                }}
                initialValue={newTx.amount}
            />

            <BulkTransactionModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                wallets={wallets}
                savings={savings}
                goals={goals}
                budgetCategories={budgetCategories}
                handleBulkCreateTransactions={handleBulkCreateTransactions}
                currentUserId={currentUserId}
                incomeCategories={incomeCategories}
                familyMembers={familyMembers || []}
            />

            <ReceiptScannerModal
                isOpen={isScannerModalOpen}
                onClose={() => setIsScannerModalOpen(false)}
                familyMembers={familyMembers || []}
                wallets={wallets}
                onConfirm={(data) => {
                    setNewTx({
                        ...newTx,
                        description: data.merchant || 'Belanja Struk',
                        amount: data.total,
                        date: data.date || new Date().toISOString().split('T')[0],
                        type: 'expense'
                    });
                    setActiveTab('expense');
                    setIsEditing(false);
                    setEditingTxId(null);
                    setIsSingleModalOpen(true);
                }}
            />
        </div>
    );
};

/* --- Sub-components for Modals --- */

const TransactionTab = ({ active, onClick, icon: Icon, label, color }: { active: boolean, onClick: () => void, icon: any, label: string, color: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-[var(--surface-card)] shadow-xl shadow-black/5' : 'hover:bg-[var(--surface-card)]/50'}`}
    >
        <div className={`p-2 rounded-xl transition-all ${active ? 'bg-dagang-green text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] opacity-60'}`}>
            <Icon className="w-5 h-5" />
        </div>
        {active && <span className={`text-sm font-black uppercase tracking-widest ${color}`}>{label}</span>}
    </button>
);

const CategorySelector = ({ value, savingId, goalId, onChange, savings, goals, type, incomeCategories, budgetCategories, currentUserId, isLoading }: any) => {
    const { familyName } = useParams();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const getPath = (path: string) => `/${encodeURIComponent(familyName || '')}/dashboard/${path}`;

    const groups = (budgetCategories || []).map((c: any) => c.id);
    const labels: any = (budgetCategories || []).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.name }), {});

    const filteredSavings = (savings || []).filter((s: any) => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const isOwner = !currentUserId || s.userId === currentUserId || s.user_id === currentUserId;
        return matchesSearch && isOwner;
    });
    const filteredGoals = (goals || []).filter((g: any) =>
        g.name.toLowerCase().includes(search.toLowerCase()) &&
        (g.currentBalance < g.targetAmount)
    );

    const selectedItem = savingId ? (savings || []).find((s: any) => s.id === savingId) : 
                       goalId ? (goals || []).find((g: any) => g.id === goalId) : null;
    const isIncome = type === 'income';
    const activeIncomeCategories = incomeCategories || DEFAULT_INCOME_CATEGORIES;
    const displayText = selectedItem ? `${selectedItem.emoji || (goalId ? '🎯' : '💰')} ${selectedItem.name}` : (value || (isIncome ? 'Pilih sumber pemasukan...' : (isLoading ? 'Memuat kategori...' : 'Pilih kategori...')));

    return (
        <div className="relative">
            <div
                onClick={() => !isLoading && setIsOpen(!isOpen)}
                className={`w-full px-6 py-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
            >
                <span className={`${!value && !savingId ? 'text-[var(--text-muted)] opacity-60' : 'text-[var(--text-main)]'}`}>
                    {displayText}
                </span>
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-dagang-green border-t-transparent rounded-full animate-spin" />
                ) : (
                    <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-card)] rounded-3xl shadow-2xl border border-[var(--border)] z-[220] overflow-hidden animate-in slide-in-from-top-2 duration-200 flex flex-col max-h-[400px]">
                        <div className="p-4 border-b border-[var(--border)]">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-50" />
                                <input
                                    type="text"
                                    placeholder="Cari kategori..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none text-sm font-bold text-[var(--text-main)]"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto py-2 custom-scrollbar">
                            {isIncome ? (
                                <div>
                                    <div className="px-6 py-2 text-[10px] font-black tracking-widest bg-emerald-50 text-emerald-600">
                                        SUMBER PEMASUKAN
                                    </div>
                                    {(activeIncomeCategories || []).filter((cat: any) => cat.name.toLowerCase().includes(search.toLowerCase())).map((cat: any) => (
                                             <div
                                                key={cat.name}
                                                onClick={() => {
                                                    onChange(cat.name, '');
                                                    setIsOpen(false);
                                                }}
                                                className="px-6 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{cat.emoji}</span>
                                                    <span className="text-sm font-bold text-[var(--text-main)]">{cat.name}</span>
                                                </div>
                                                {value === cat.name && !savingId && <Check className="w-4 h-4 text-dagang-green" />}
                                            </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Goals */}
                                    {filteredGoals.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-6 py-2 text-[10px] font-black tracking-widest bg-dagang-accent/10 text-dagang-accent">
                                                GOALS
                                            </div>
                                            {filteredGoals.map((g: any) => (
                                                <div
                                                    key={g.id}
                                                    onClick={() => {
                                                        onChange(g.name, '', g.id);
                                                        setIsOpen(false);
                                                    }}
                                                    className="px-6 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{g.emoji || '🎯'}</span>
                                                        <span className="text-sm font-bold text-[var(--text-main)]">{g.name}</span>
                                                    </div>
                                                    {goalId === g.id && <Check className="w-4 h-4 text-dagang-green" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Budget Categories */}
                                    {groups.map((groupId: any) => {
                                        const groupItems = filteredSavings.filter((s: any) => 
                                            (s.budgetCategoryId == groupId || s.budget_category_id == groupId)
                                        );
                                        if (groupItems.length === 0) return null;

                                        return (
                                            <div key={groupId} className="mb-2">
                                                <div className={`px-6 py-2 text-[10px] font-black tracking-widest bg-black/5 dark:bg-white/5 text-[var(--text-muted)] opacity-60`}>
                                                    BUDGET: {labels[groupId].toUpperCase()}
                                                </div>
                                                {groupItems.map((item: any) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => {
                                                            onChange(item.name, item.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="px-6 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg">{item.emoji || '💰'}</span>
                                                            <span className="text-sm font-bold text-[var(--text-main)]">{item.name}</span>
                                                        </div>
                                                        {savingId === item.id && <Check className="w-4 h-4 text-dagang-green" />}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}

                                    {/* Empty Budget Message */}
                                    {!isIncome && (budgetCategories || []).length === 0 && (
                                        <div className="p-8 text-center border-t border-[var(--border)] mt-4 bg-red-500/[0.02]">
                                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <p className="text-sm font-black text-[var(--text-main)] mb-1">
                                                Belum ada budget bulan ini
                                            </p>
                                            <p className="text-[10px] text-[var(--text-muted)] opacity-60 mb-6 uppercase tracking-widest font-bold">
                                                Atur kategori pengeluaran Anda
                                            </p>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsOpen(false);
                                                    navigate(getPath('budget'));
                                                }}
                                                className="w-full py-3 px-4 bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                            >
                                                Atur budget terlebih dahulu
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const SingleTransactionModal = ({
    isOpen,
    onClose,
    activeTab,
    setActiveTab,
    newTx,
    setNewTx,
    wallets,
    handleCreateTransaction,
    handleUpdateTransaction,
    isEditing,
    editingTxId,
    savings,
    goals,
    onOpenCalculator,
    onOpenScanner,
    incomeCategories,
    budgetCategories,
    currentUserId,
    familyMembers
}: any) => {
    const { showAlert } = useModal();
    const navigate = useNavigate();
    const { familyName } = useParams();

    // Local state for period-specific budget categories
    const [localBudgetCategories, setLocalBudgetCategories] = useState<any[]>([]);
    const [localSavings, setLocalSavings] = useState<any[]>([]);
    const [isPeriodLoading, setIsPeriodLoading] = useState(false);

    // Calculate month/year from newTx.date
    const txDateObj = useMemo(() => {
        if (!newTx.date) return new Date();
        const [y, m, d] = newTx.date.split('-').map(Number);
        return new Date(y, m - 1, d);
    }, [newTx.date]);
    
    const txMonth = txDateObj.getMonth() + 1;
    const txYear = txDateObj.getFullYear();
    const monthName = txDateObj.toLocaleString('id-ID', { month: 'long' });

    useEffect(() => {
        if (!isOpen) return;

        const fetchPeriodData = async () => {
            setIsPeriodLoading(true);
            try {
                const cats = await BudgetController.getCategories(txMonth, txYear, currentUserId);
                setLocalBudgetCategories(cats || []);
                
                // Extract items from categories
                const allItems = (cats || []).flatMap((c: any) => c.items || []);
                setLocalSavings(allItems);
            } catch (err) {
                console.error("Gagal mengambil kategori untuk periode ini:", err);
            } finally {
                setIsPeriodLoading(false);
            }
        };

        fetchPeriodData();
    }, [isOpen, txMonth, txYear, currentUserId]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (isEditing && editingTxId) {
            try {
                await handleUpdateTransaction(editingTxId, newTx);
                onClose();
            } catch (err: any) {
                showAlert('Error', "Gagal menyimpan perubahan: " + err.message, 'danger');
            }
        } else {
            handleCreateTransaction();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 mobile:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[var(--surface-card)] w-full max-w-[500px] max-h-[92vh] overflow-y-auto rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar border border-[var(--border)]">
                <div className="p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-[var(--text-main)]">{isEditing ? 'Ubah Transaksi' : 'Transaksi Baru'}</h3>
                        <button onClick={onClose} className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                            <X className="w-5 h-5 text-[var(--text-muted)]" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl w-fit mx-auto">
                        <TransactionTab
                            active={activeTab === 'expense'}
                            onClick={() => { setActiveTab('expense'); setNewTx({ ...newTx, type: 'expense' }); }}
                            icon={TrendingDown}
                            label="Keluar"
                            color="text-red-500"
                        />
                        <TransactionTab
                            active={activeTab === 'income'}
                            onClick={() => { setActiveTab('income'); setNewTx({ ...newTx, type: 'income' }); }}
                            icon={TrendingUp}
                            label="Masuk"
                            color="text-dagang-green"
                        />
                        <TransactionTab
                            active={activeTab === 'transfer'}
                            onClick={() => { setActiveTab('transfer'); setNewTx({ ...newTx, type: 'transfer' }); }}
                            icon={ArrowRightLeft}
                            label="Pindah"
                            color="text-blue-500"
                        />
                    </div>

                    {/* Period Warning Banner */}
                    {!isPeriodLoading && activeTab === 'expense' && localBudgetCategories.length === 0 && (
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-orange-600 leading-relaxed">
                                    Budget untuk <span className="underline">{monthName} {txYear}</span> belum diatur. Kategori pengeluaran mungkin tidak tersedia.
                                </p>
                                <button 
                                    onClick={() => navigate(`/${encodeURIComponent(familyName || '')}/dashboard/budget?month=${txMonth}&year=${txYear}`)}
                                    className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                >
                                    Atur Sekarang <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 mobile:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">Tanggal</label>
                            <input
                                type="date"
                                value={newTx.date}
                                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">Jumlah</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formatRupiah(newTx.amount) || ''}
                                    onChange={(e) => setNewTx({ ...newTx, amount: parseRupiah(e.target.value) })}
                                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-black text-lg text-dagang-green"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button onClick={onOpenScanner} className="p-2 bg-dagang-accent text-white rounded-lg shadow-sm"><Camera className="w-4 h-4" /></button>
                                    <button onClick={onOpenCalculator} className="p-2 bg-[var(--surface-card)] text-dagang-green rounded-lg shadow-sm border border-[var(--border)]"><Calculator className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">
                                {activeTab === 'expense' || activeTab === 'transfer' ? 'Dari Dompet' : 'Ke Dompet'}
                            </label>
                            <select
                                value={newTx.walletId}
                                onChange={(e) => setNewTx({ ...newTx, walletId: e.target.value })}
                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)]"
                            >
                                <option value="">Pilih Dompet...</option>
                                {wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} (Saya)</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">
                                {activeTab === 'transfer' ? 'Ke Dompet' : 'Kategori'}
                            </label>
                            {activeTab === 'transfer' ? (
                                <select
                                    value={newTx.toWalletId}
                                    onChange={(e) => setNewTx({ ...newTx, toWalletId: e.target.value })}
                                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)]"
                                >
                                    <option value="">Pilih Tujuan...</option>
                                    {(familyMembers || []).map((member: any) => {
                                        const memberWallets = wallets.filter((w: any) => 
                                            ((w.userId || w.user_id) === (member.userId || member.user_id)) && 
                                            w.id !== newTx.walletId
                                        );
                                        if (memberWallets.length === 0) return null;
                                        return (
                                            <optgroup key={member.userId || member.user_id} label={member.fullName + ((member.userId || member.user_id) === currentUserId ? ' (Saya)' : '')}>
                                                {memberWallets.map((w: any) => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            ) : (
                                <CategorySelector
                                    value={newTx.category}
                                    savingId={newTx.savingId}
                                    goalId={newTx.goalId}
                                    onChange={(name: string, sid: string, gid: string) => {
                                        let updatedType = newTx.type;
                                        if (gid && activeTab === 'expense') updatedType = 'goal_allocation';
                                        else if (sid && activeTab === 'expense') updatedType = 'saving';
                                        else if (!gid && !sid && activeTab === 'expense') updatedType = 'expense';
                                        setNewTx({ ...newTx, category: name, savingId: sid, goalId: gid, type: updatedType as any });
                                    }}
                                    savings={localSavings}
                                    goals={goals}
                                    type={newTx.type}
                                    incomeCategories={incomeCategories}
                                    budgetCategories={localBudgetCategories}
                                    currentUserId={currentUserId}
                                    isLoading={isPeriodLoading}
                                />
                            )}
                        </div>

                        <div className="mobile:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">Catatan</label>
                            <input
                                type="text"
                                value={newTx.description}
                                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                placeholder="cth. Kopi Kenangan"
                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-dagang-green text-white rounded-2xl font-black uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10 text-xs"
                    >
                        {isEditing ? 'Simpan Perubahan' : `Tambah ${activeTab === 'expense' ? 'Pengeluaran' : activeTab === 'income' ? 'Pemasukan' : 'Transfer'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BulkTransactionModal = ({ isOpen, onClose, wallets, savings, goals, handleBulkCreateTransactions, budgetCategories, currentUserId, incomeCategories, familyMembers }: any) => {
    const [rows, setRows] = useState<any[]>([
        { date: new Date().toISOString().split('T')[0], amount: 0, type: 'expense', walletId: wallets?.[0]?.id || '', category: '', savingId: '', goalId: '', description: '' },
    ]);

    if (!isOpen) return null;

    const addRow = () => setRows([...rows, { ...rows[rows.length - 1], amount: 0, description: '', category: '', savingId: '', goalId: '' }]);
    const removeRow = (index: number) => rows.length > 1 && setRows(rows.filter((_, i) => i !== index));
    const updateRow = (index: number, updates: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], ...updates };
        setRows(newRows);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 mobile:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[var(--surface-card)] w-full max-w-[1100px] max-h-[92vh] overflow-y-auto rounded-[40px] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-xl z-20 px-8 py-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-main)]">Input Massal</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold opacity-50 uppercase tracking-[0.2em] mt-1">Tambahkan banyak transaksi sekaligus dengan cepat</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="overflow-x-auto min-w-full pb-6">
                        <table className="w-full border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-left">
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest w-[140px]">Tanggal</th>
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest w-[80px]">Tipe</th>
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest w-[160px]">Jumlah</th>
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest w-[160px]">Dompet</th>
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest min-w-[220px]">Kategori</th>
                                    <th className="px-4 pb-2 text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest">Catatan</th>
                                    <th className="w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="bg-black/5 dark:bg-white/5 group hover:bg-black/10 transition-all">
                                        <td className="px-4 py-3 first:rounded-l-2xl">
                                            <input 
                                                type="date" 
                                                value={row.date} 
                                                onChange={(e) => updateRow(idx, { date: e.target.value })} 
                                                className="bg-transparent font-bold text-xs outline-none w-full text-[var(--text-main)]" 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={row.type} 
                                                onChange={(e) => updateRow(idx, { type: e.target.value })} 
                                                className="bg-transparent font-black text-[10px] uppercase tracking-tighter outline-none text-[var(--text-main)] cursor-pointer"
                                            >
                                                <option value="expense">Keluar</option>
                                                <option value="income">Masuk</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="text" 
                                                value={formatRupiah(row.amount)} 
                                                onChange={(e) => updateRow(idx, { amount: parseRupiah(e.target.value) })} 
                                                placeholder="Rp 0" 
                                                className={`bg-transparent font-black text-sm outline-none w-full ${row.type === 'income' ? 'text-dagang-green' : 'text-red-500'}`} 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={row.walletId}
                                                onChange={(e) => updateRow(idx, { walletId: e.target.value })}
                                                className="bg-transparent font-bold text-xs outline-none w-full text-[var(--text-main)] cursor-pointer"
                                            >
                                                {wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                                    <option key={w.id} value={w.id}>{w.name} (Saya)</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <CategorySelector
                                                value={row.category}
                                                savingId={row.savingId}
                                                goalId={row.goalId}
                                                onChange={(name: string, sid: string, gid: string) => {
                                                    let updatedType = row.type;
                                                    if (gid && row.type === 'expense') updatedType = 'goal_allocation';
                                                    else if (sid && row.type === 'expense') updatedType = 'saving';
                                                    else if (!gid && !sid && row.type === 'expense') updatedType = 'expense';
                                                    updateRow(idx, { category: name, savingId: sid, goalId: gid, type: updatedType });
                                                }}
                                                savings={savings}
                                                goals={goals}
                                                type={row.type}
                                                incomeCategories={incomeCategories}
                                                budgetCategories={budgetCategories}
                                                currentUserId={currentUserId}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="text" 
                                                value={row.description} 
                                                onChange={(e) => updateRow(idx, { description: e.target.value })} 
                                                placeholder="cth. Belanja Mingguan" 
                                                className="bg-transparent font-bold text-xs outline-none w-full text-[var(--text-main)]" 
                                            />
                                        </td>
                                        <td className="px-4 py-3 last:rounded-r-2xl text-center">
                                            <button 
                                                onClick={() => removeRow(idx)} 
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-40 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col mobile:flex-row gap-4">
                        <button 
                            onClick={addRow} 
                            className="flex-1 py-5 border-2 border-dashed border-[var(--border)] rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] hover:border-dagang-green hover:text-dagang-green hover:bg-dagang-green/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Baris
                        </button>
                        <button 
                            onClick={() => handleBulkCreateTransactions(rows)} 
                            className="flex-1 py-5 bg-dagang-green text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-dagang-green/20 hover:bg-dagang-green-light hover:-translate-y-1 transition-all"
                        >
                            Simpan Semua
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
