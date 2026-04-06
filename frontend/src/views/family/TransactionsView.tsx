import React, { useState, useMemo, useEffect } from 'react';
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
    Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet as WalletModel } from '../../models';
import { formatRupiah, parseRupiah } from '../../utils/formatters';
import { Calculator as CalculatorComp } from '../../components/Calculator';
import { ReceiptScannerModal } from '../../components/family/ReceiptScannerModal';
import { FinanceController } from '../../controllers/FinanceController';
import { useModal } from '../../providers/ModalProvider';

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
}

/* --- Constants & Helpers --- */

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

                        {options.map(o => (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setIsOpen(false); }}
                                className={`
                                    flex items-center justify-between
                                    px-4 py-2.5 text-[12px] font-bold cursor-pointer transition-all mx-2 rounded-xl mb-1
                                    ${value === o.value 
                                        ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-[1.02]' 
                                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-main)]'}
                                `}
                            >
                                <span className="truncate">{o.label}</span>
                                {value === o.value && <Check className="w-3.5 h-3.5" />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

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

const CategorySelector = ({ value, savingId, goalId, onChange, savings, goals, type, incomeCategories, budgetCategories, currentUserId }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

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
    const displayText = selectedItem ? `${selectedItem.emoji || (goalId ? '🎯' : '💰')} ${selectedItem.name}` : (value || (isIncome ? 'Pilih sumber pemasukan...' : 'Pilih kategori...'));

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold"
            >
                <span className={`${!value && !savingId ? 'text-[var(--text-muted)] opacity-60' : 'text-[var(--text-main)]'}`}>
                    {displayText}
                </span>
                <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
    if (!isOpen) return null;

    const handleSubmit = async () => {

        if (isEditing && editingTxId) {
            try {
                await handleUpdateTransaction(editingTxId, newTx);
                onClose();
            } catch (err: any) {
                console.error("[ERROR] handleUpdateTransaction failed", err);
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

                    <div className="grid grid-cols-1 mobile:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-50" />
                                <input
                                    type="date"
                                    value={newTx.date}
                                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest">Jumlah</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-dagang-green opacity-60 text-xs">Rp</div>
                                    <input
                                        type="text"
                                        value={formatRupiah(newTx.amount) || ''}
                                        onChange={(e) => {
                                            const val = parseRupiah(e.target.value);
                                            setNewTx({ ...newTx, amount: val });
                                        }}
                                        placeholder="0"
                                        className="w-full pl-11 pr-24 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-black text-lg text-dagang-green"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button 
                                            onClick={() => {
                                                // Trigger scanner from inside modal
                                                // We need to pass the scanner open state or handle it via a parent callback
                                                onOpenScanner(); 
                                            }}
                                            className="p-2 bg-dagang-accent text-white rounded-lg shadow-sm hover:scale-110 transition-all active:scale-90"
                                            title="Scan Struk"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={onOpenCalculator}
                                            className="p-2 bg-[var(--surface-card)] text-dagang-green rounded-lg shadow-sm border border-[var(--border)] hover:scale-110 transition-all active:scale-90"
                                        >
                                            <Calculator className="w-4 h-4" />
                                        </button>
                                    </div>
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
                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm appearance-none text-[var(--text-main)]"
                            >
                                <option value="" className="bg-[var(--surface-card)]">Pilih Dompet...</option>
                                {wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                    <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} (Rp {w.balance.toLocaleString('id-ID')})</option>
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
                                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm appearance-none text-[var(--text-main)]"
                                >
                                    <option value="" className="bg-[var(--surface-card)]">Pilih Dompet Tujuan...</option>
                                    {/* Own wallets (with balance) */}
                                    <optgroup label="DOMPET SENDIRI" className="bg-[var(--surface-card)] text-[9px] font-black tracking-widest">
                                        {wallets.filter((w: any) => w.id !== newTx.walletId && (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                            <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} (Rp {Math.round(w.balance).toLocaleString('id-ID')})</option>
                                        ))}
                                    </optgroup>
                                    {/* Other family members' wallets (without balance) */}
                                    {(() => {
                                        const otherWallets = wallets.filter((w: any) => w.id !== newTx.walletId && (w.userId || w.user_id) !== currentUserId);
                                        // Group by user
                                        const byUser: Record<string, any[]> = {};
                                        otherWallets.forEach((w: any) => {
                                            const uid = w.userId || w.user_id;
                                            if (!byUser[uid]) byUser[uid] = [];
                                            byUser[uid].push(w);
                                        });
                                        return Object.entries(byUser).map(([uid, uWallets]) => {
                                            const member = familyMembers?.find((m: any) => m.id === uid || m.userId === uid);
                                            const memberName = member?.name || member?.fullName || member?.full_name || 'Anggota Keluarga';
                                            return (
                                                <optgroup key={uid} label={`DOMPET ${memberName.toUpperCase()}`} className="bg-[var(--surface-card)] text-[9px] font-black tracking-widest">
                                                    {uWallets.map((w: any) => (
                                                        <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} - ({memberName})</option>
                                                    ))}
                                                </optgroup>
                                            );
                                        });
                                    })()}
                                </select>
                            ) : (
                                <CategorySelector
                                    value={newTx.category}
                                    savingId={newTx.savingId}
                                    goalId={newTx.goalId}
                                    onChange={(name: string, sid: string, gid: string) => {
                                        let updatedType = newTx.type;
                                        if (gid && activeTab === 'expense') {
                                            updatedType = 'goal_allocation';
                                        } else if (sid && activeTab === 'expense') {
                                            updatedType = 'saving';
                                        } else if (!gid && !sid && activeTab === 'expense') {
                                            updatedType = 'expense';
                                        }
                                        setNewTx({ ...newTx, category: name, savingId: sid, goalId: gid, type: updatedType as any });
                                    }}
                                    savings={savings}
                                    goals={goals}
                                    type={newTx.type}
                                    incomeCategories={incomeCategories}
                                    budgetCategories={budgetCategories}
                                    currentUserId={currentUserId}
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
                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border-none rounded-xl outline-none font-bold text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/30"
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
    const { showAlert } = useModal();
    const [rows, setRows] = useState<any[]>([
        { date: new Date().toISOString().split('T')[0], amount: 0, type: 'expense', walletId: wallets?.[0]?.id || '', category: '', savingId: '', goalId: '', description: '' },
    ]);

    useEffect(() => {
        const userWallets = wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId);
        if (isOpen && userWallets.length > 0 && !rows[0].walletId) {
            setRows([{ ...rows[0], walletId: userWallets[0].id }]);
        }
    }, [isOpen, wallets, currentUserId]);

    if (!isOpen) return null;

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, { ...lastRow, amount: 0, description: '', category: '', savingId: '', goalId: '' }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const updateRow = (index: number, field: string, value: any) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        if (field === 'type') {
            newRows[index].category = '';
            newRows[index].savingId = '';
            newRows[index].goalId = '';
        }
        setRows(newRows);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 mobile:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[var(--surface-card)] w-full max-w-[1000px] max-h-[92vh] overflow-y-auto rounded-[32px] mobile:rounded-[48px] shadow-2xl animate-in fade-in zoom-in-95 duration-500 custom-scrollbar border border-[var(--border)]">
                <div className="p-4 mobile:p-10">
                    <div className="flex items-center justify-between mb-6 mobile:mb-10">
                        <div>
                            <h3 className="text-xl mobile:text-[28px] font-black text-[var(--text-main)] tracking-tight">Input Transaksi Massal</h3>
                            <p className="text-[var(--text-muted)] opacity-50 text-[10px] mobile:text-sm mt-1">Gunakan scroll/geser ke samping untuk melihat semua kolom.</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all shadow-sm group"
                        >
                            <X className="w-5 h-5 text-[var(--text-muted)] group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    <div className="bg-[var(--background)]/50 rounded-[24px] mobile:rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm mb-6 mobile:mb-10">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="text-[10px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] bg-[var(--primary)]/5">
                                        <th className="w-14 px-4 py-4" />
                                        <th className="px-4 py-4 text-left">Tanggal</th>
                                        <th className="px-4 py-4 text-left">Jumlah</th>
                                        <th className="px-4 py-4 text-left">Tipe</th>
                                        <th className="px-4 py-4 text-left">Dompet</th>
                                        <th className="px-4 py-4 text-left">Kategori / Ke</th>
                                        <th className="px-4 py-4 text-left">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => removeRow(idx)}
                                                    className="p-2 text-red-500/30 hover:text-red-500 transition-colors bg-red-500/5 hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={row.date}
                                                    onChange={(e) => updateRow(idx, 'date', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer text-[var(--text-main)]"
                                                />
                                            </td>
                                             <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={formatRupiah(row.amount) || ''}
                                                    onChange={(e) => updateRow(idx, 'amount', parseRupiah(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-none p-0 text-sm font-black outline-none placeholder:text-[var(--text-muted)]/20 text-dagang-green"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.type}
                                                    onChange={(e) => updateRow(idx, 'type', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer text-[var(--text-main)]"
                                                >
                                                    <option value="expense" className="bg-[var(--surface-card)]">Keluar</option>
                                                    <option value="income" className="bg-[var(--surface-card)]">Masuk</option>
                                                    <option value="transfer" className="bg-[var(--surface-card)]">Pindah</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.walletId}
                                                    onChange={(e) => updateRow(idx, 'walletId', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer text-[var(--text-main)]"
                                                >
                                                    <option value="" className="bg-[var(--surface-card)]">Pilih...</option>
                                                    {wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                                        <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.type === 'transfer' ? (
                                                    <select
                                                        value={row.toWalletId}
                                                        onChange={(e) => updateRow(idx, 'toWalletId', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer text-[var(--text-main)]"
                                                    >
                                                        <option value="" className="bg-[var(--surface-card)]">Pilih...</option>
                                                        {/* Own wallets (with balance) */}
                                                        <optgroup label="DOMPET SENDIRI" className="bg-[var(--surface-card)] text-[9px] font-black tracking-widest">
                                                            {wallets.filter((w: any) => (w.userId || w.user_id) === currentUserId).map((w: any) => (
                                                                <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} (Rp {Math.round(w.balance).toLocaleString('id-ID')})</option>
                                                            ))}
                                                        </optgroup>
                                                        {/* Other family members' wallets (without balance) */}
                                                        {(() => {
                                                            const otherWallets = wallets.filter((w: any) => (w.userId || w.user_id) !== currentUserId);
                                                            // Group by user
                                                            const byUser: Record<string, any[]> = {};
                                                            otherWallets.forEach((w: any) => {
                                                                const uid = w.userId || w.user_id;
                                                                if (!byUser[uid]) byUser[uid] = [];
                                                                byUser[uid].push(w);
                                                            });
                                                            return Object.entries(byUser).map(([uid, uWallets]) => {
                                                                const member = familyMembers?.find((m: any) => m.id === uid || m.userId === uid);
                                                                const memberName = member?.name || member?.fullName || member?.full_name || 'Anggota Keluarga';
                                                                return (
                                                                    <optgroup key={uid} label={`DOMPET ${memberName.toUpperCase()}`} className="bg-[var(--surface-card)] text-[9px] font-black tracking-widest">
                                                                        {uWallets.map((w: any) => (
                                                                            <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} - ({memberName})</option>
                                                                        ))}
                                                                    </optgroup>
                                                                );
                                                            });
                                                        })()}
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={row.goalId || row.savingId || row.category}
                                                        onChange={(e) => {
                                                            const isRowIncome = row.type === 'income';
                                                            if (isRowIncome) {
                                                                const activeIncs = incomeCategories || DEFAULT_INCOME_CATEGORIES;
                                                                const cat = activeIncs.find((c: any) => c.name === e.target.value);
                                                                updateRow(idx, 'category', cat?.name || '');
                                                                updateRow(idx, 'savingId', '');
                                                                updateRow(idx, 'goalId', '');
                                                            } else {
                                                                const s = savings.find((s: any) => s.id === e.target.value);
                                                                const g = goals.find((g: any) => g.id === e.target.value);
                                                                if (g) {
                                                                    updateRow(idx, 'category', g.name);
                                                                    updateRow(idx, 'savingId', '');
                                                                    updateRow(idx, 'goalId', g.id);
                                                                    updateRow(idx, 'type', 'goal_allocation');
                                                                } else {
                                                                    updateRow(idx, 'category', s?.name || '');
                                                                    updateRow(idx, 'savingId', s?.id || '');
                                                                    updateRow(idx, 'goalId', '');
                                                                    updateRow(idx, 'type', 'saving');
                                                                }
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer text-[var(--text-main)]"
                                                    >
                                                        <option value="" className="bg-[var(--surface-card)]">Pilih...</option>
                                                        {row.type === 'income' ? (
                                                            (incomeCategories || DEFAULT_INCOME_CATEGORIES).map((c: any) => (
                                                                <option key={c.name} value={c.name} className="bg-[var(--surface-card)]">{c.emoji} {c.name}</option>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <optgroup label="GOALS" className="bg-[var(--surface-card)]">
                                                                    {goals.filter((g: any) => g.currentBalance < g.targetAmount).map((g: any) => (
                                                                        <option key={g.id} value={g.id} className="bg-[var(--surface-card)]">{g.emoji || '🎯'} {g.name}</option>
                                                                    ))}
                                                                </optgroup>
                                                                {budgetCategories.map((cat: any) => (
                                                                    <optgroup key={cat.id} label={cat.name.toUpperCase()} className="bg-[var(--surface-card)] text-[10px] font-black tracking-widest text-[var(--primary)]">
                                                                        {(savings || []).filter((s: any) => 
                                                                            (s.budgetCategoryId == cat.id || s.budget_category_id == cat.id) && 
                                                                            (s.userId === currentUserId || s.user_id === currentUserId || !currentUserId)
                                                                        ).map((s: any) => (
                                                                            <option key={s.id} value={s.id} className="bg-[var(--surface-card)] text-sm font-bold">{s.emoji} {s.name}</option>
                                                                        ))}
                                                                    </optgroup>
                                                                ))}
                                                            </>
                                                        )}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={row.description}
                                                    onChange={(e) => updateRow(idx, 'description', e.target.value)}
                                                    placeholder="Catatan..."
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none placeholder:text-[var(--text-muted)]/20 text-[var(--text-main)]"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col mobile:flex-row items-center justify-between gap-6 pt-4 border-t border-[var(--border)]/50">
                        <button
                            onClick={addRow}
                            className="w-full mobile:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm group"
                        >
                            <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-xs uppercase tracking-widest">Tambah Baris</span>
                        </button>
                        <button
                            onClick={() => {
                                const invalid = rows.some(r => !r.walletId || r.amount <= 0 || (r.type === 'transfer' && !r.toWalletId));
                                if (invalid) {
                                    showAlert('Validasi', 'Pastikan semua baris sudah mengisi data dengan benar.', 'warning');
                                    return;
                                }
                                handleBulkCreateTransactions(rows);
                            }}
                            className="w-full mobile:w-auto px-10 py-3.5 bg-dagang-green text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Check className="w-5 h-5" /> Simpan Semua
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export const TransactionsView: React.FC<TransactionsViewProps> = ({
    transactions = [],
    wallets = [],
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
    budgetCategories,
    currentUserId,
    familyRole,
    onOpenCalculator,
    onOpenScanner,
    incomeCategories,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
}: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterWallet, setFilterWallet] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [filterMemberId, setFilterMemberId] = useState<string>('all');

    // Permission helpers
    const canManageTx = familyRole !== 'viewer';

    const categoryOptions = useMemo(() => {
        const budgetOpts = budgetCategories.map((bc: any) => ({ label: bc.name, value: bc.id }));
        const activeIncs = incomeCategories || DEFAULT_INCOME_CATEGORIES;
        const incomeOpts = activeIncs.map((ic: any) => ({ label: ic.name, value: ic.name }));

        if (filterType === 'income') return incomeOpts;
        if (filterType === 'expense' || filterType === 'transfer') return budgetOpts;
        
        // For 'all', combine and add prefixes to avoid confusion
        return [
            ...budgetCategories.map((bc: any) => ({ label: `Budget: ${bc.name}`, value: bc.id })),
            ...activeIncs.map((ic: any) => ({ label: `Masuk: ${ic.name}`, value: ic.name }))
        ];
    }, [filterType, budgetCategories, incomeCategories]);

    useEffect(() => {
        if (filterCategory === 'all') return;
        const isValid = categoryOptions.some((opt: any) => opt.value === filterCategory);
        if (!isValid) setFilterCategory('all');
    }, [filterType, categoryOptions, filterCategory]);

    const [isEditing, setIsEditing] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx: any) => {
            // Member Filtering
            if (filterMemberId !== 'all') {
                if (tx.userId !== filterMemberId) return false;
            }

            const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || tx.type === filterType;
            const matchesWallet = filterWallet === 'all' || tx.walletId === filterWallet;
            
            let matchesCategory = true;
            if (filterCategory !== 'all') {
                if (tx.type === 'income') {
                    matchesCategory = tx.category === filterCategory;
                } else {
                    const saving = savings.find((s: any) => s.id === tx.savingId);
                    matchesCategory = saving?.budgetCategoryId === filterCategory;
                }
            }

            let matchesTime = true;
            if (timeFilter !== 'all') {
                const txDate = new Date(tx.date);
                const now = new Date();
                if (timeFilter === 'day') {
                    matchesTime = txDate.toDateString() === now.toDateString();
                } else if (timeFilter === 'week') {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(now.getDate() - 7);
                    matchesTime = txDate >= oneWeekAgo;
                } else if (timeFilter === 'month') {
                    matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                } else if (timeFilter === 'year') {
                    matchesTime = txDate.getFullYear() === now.getFullYear();
                } else if (timeFilter === 'last_year') {
                    matchesTime = txDate.getFullYear() === now.getFullYear() - 1;
                }
            }

            return matchesSearch && matchesType && matchesWallet && matchesCategory && matchesTime;
        });
    }, [transactions, searchQuery, filterType, filterWallet, filterCategory, savings, timeFilter, filterMemberId]);

    // Pagination constants
    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType, filterWallet, filterCategory, timeFilter]);

    // Date Detection Logic for Smart Export Prompts
    const milestoneInfo = useMemo(() => {
        const today = new Date();
        const isFirstDayOfMonth = today.getDate() === 1;
        const isFirstDayOfWeek = today.getDay() === 1; // Monday
        const isFirstDayOfYear = today.getMonth() === 0 && today.getDate() === 1;

        if (isFirstDayOfYear) return { type: 'year', label: 'Tahun', prevLabel: 'Tahun Lalu' };
        if (isFirstDayOfMonth) return { type: 'month', label: 'Bulan', prevLabel: 'Bulan Lalu' };
        if (isFirstDayOfWeek) return { type: 'week', label: 'Minggu', prevLabel: 'Minggu Lalu' };
        
        return null;
    }, []);

    const [showExportPrompt, setShowExportPrompt] = useState(!!milestoneInfo);

    // Helper for Period-based Filtering (for Export)
    const getTransactionsInfoForPeriod = (period: string) => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        switch (period) {
            case 'this_week':
                start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_week':
                start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - 7);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start.setFullYear(now.getFullYear(), now.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_month':
                start.setFullYear(now.getFullYear(), now.getMonth() - 1, 1);
                start.setHours(0, 0, 0, 0);
                end.setFullYear(now.getFullYear(), now.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_year':
                start.setFullYear(now.getFullYear(), 0, 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_year':
                start.setFullYear(now.getFullYear() - 1, 0, 1);
                start.setHours(0, 0, 0, 0);
                end.setFullYear(now.getFullYear() - 1, 11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                return { start: null, end: null };
        }

        return { 
            start: start.toISOString().split('T')[0], 
            end: (period.startsWith('last') ? end : now).toISOString().split('T')[0] 
        };
    };

    const handleExportWithPeriod = async (period: string, format: 'pdf' | 'excel') => {
        const info = getTransactionsInfoForPeriod(period);
        let dataToExport = [];

        if (!info.start) {
            dataToExport = filteredTransactions;
        } else {
            try {
                // Always fetch since local data is just one month
                dataToExport = await FinanceController.getTransactionsByRange(info.start, info.end);
            } catch (err) {
                console.error("Export fetch failed", err);
                alert('Gagal mengambil data untuk export bosku!');
                return;
            }
        }

        if (dataToExport.length === 0) {
            alert('Tidak ada transaksi di periode ini bosku!');
            return;
        }

        const periodLabels: any = {
            all: 'Ekspor',
            this_week: 'Minggu Ini', last_week: 'Minggu Lalu',
            this_month: 'Bulan Ini', last_month: 'Bulan Lalu',
            this_year: 'Tahun Ini', last_year: 'Tahun Lalu'
        };

        if (format === 'excel') {
            const data = dataToExport.map((tx: any) => ({
                Tanggal: new Date(tx.date).toLocaleDateString('id-ID'),
                Deskripsi: tx.description,
                Tipe: tx.type === 'income' ? 'Masuk' : tx.type === 'transfer' ? 'Pindah' : 'Keluar',
                Kategori: tx.category || '-',
                Jumlah: tx.amount,
                Dompet: wallets.find((w: any) => w.id === tx.walletId)?.name || '-',
                Oleh: tx.user?.fullName || '-'
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
            XLSX.writeFile(workbook, `Transaksi_${periodLabels[period]}_${new Date().toISOString().split('T')[0]}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.text(`Laporan Transaksi - ${periodLabels[period]}`, 14, 15);
            const tableData = dataToExport.map((tx: any) => [
                new Date(tx.date).toLocaleDateString('id-ID'),
                tx.description,
                tx.type === 'income' ? 'Masuk' : tx.type === 'transfer' ? 'Pindah' : 'Keluar',
                tx.category || '-',
                `Rp ${tx.amount.toLocaleString('id-ID')}`,
                wallets.find((w: any) => w.id === tx.walletId)?.name || '-'
            ]);
            autoTable(doc, {
                head: [['Tanggal', 'Deskripsi', 'Tipe', 'Kategori', 'Jumlah', 'Dompet']],
                body: tableData,
                startY: 20,
            });
            doc.save(`Transaksi_${periodLabels[period]}_${new Date().toISOString().split('T')[0]}.pdf`);
        }
    };

    const handleExportExcel = () => handleExportWithPeriod('all', 'excel');
    const handleExportPDF = () => handleExportWithPeriod('all', 'pdf');


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header with Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-h2 font-heading leading-tight text-[var(--text-main)] flex flex-col md:flex-row md:items-center gap-4">
                        Transaksi
                        {/* Moved to filter bar below */}
                    </h2>
                    <p className="text-body-s text-[var(--text-muted)] mt-1">Uangmu lari ke mana aja?</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {canManageTx && (
                        <>
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="flex-1 mobile:flex-none px-4 mobile:px-6 py-3.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl text-[11px] mobile:text-[13px] font-bold text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 mobile:gap-3 shadow-sm"
                            >
                                <Calculator className="w-4 h-4 mobile:w-5 mobile:h-5 text-dagang-accent" /> Tambah Banyak
                            </button>
                            <button
                                onClick={() => setIsScannerModalOpen(true)}
                                className="flex-1 mobile:flex-none px-4 mobile:px-6 py-3.5 bg-[var(--surface-card)] border border-dagang-accent/30 rounded-2xl text-[11px] mobile:text-[13px] font-bold text-dagang-accent hover:bg-dagang-accent/5 transition-all flex items-center justify-center gap-2 mobile:gap-3 shadow-md group"
                            >
                                <Camera className="w-4 h-4 mobile:w-5 mobile:h-5 group-hover:scale-110 transition-transform" />
                                <span className="hidden xs:inline sm:inline">Scan Struk</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditingTxId(null);
                                    setNewTx({
                                        description: '',
                                        walletId: wallets[0]?.id || '',
                                        toWalletId: '',
                                        amount: 0,
                                        fee: 0,
                                        date: new Date().toISOString().split('T')[0],
                                        category: '',
                                        type: 'expense',
                                        savingId: '',
                                        goalId: ''
                                    });
                                    setActiveTab('expense');
                                    setIsSingleModalOpen(true);
                                }}
                                className="w-full mobile:w-auto px-6 py-3.5 bg-dagang-green text-white rounded-2xl text-[12px] mobile:text-[13px] font-bold hover:bg-dagang-green-light transition-all flex items-center justify-center gap-3 shadow-xl shadow-dagang-green/20"
                            >
                                <Plus className="w-5 h-5" /> Transaksi Baru
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Member Filter Tabs (Only for Admins) */}
            {(familyRole === 'head_of_family' || familyRole === 'treasurer') && familyMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    <button
                        onClick={() => setFilterMemberId('all')}
                        className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${filterMemberId === 'all' ? 'bg-dagang-green text-white border-dagang-green shadow-lg shadow-dagang-green/20' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-dagang-green/50'}`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setFilterMemberId(currentUserId)}
                        className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${filterMemberId === currentUserId ? 'bg-dagang-green text-white border-dagang-green shadow-lg shadow-dagang-green/20' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-dagang-green/50'}`}
                    >
                        Saya
                    </button>
                    {familyMembers.filter((m: any) => m.userId !== currentUserId).map((m: any) => (
                        <button
                            key={m.userId}
                            onClick={() => setFilterMemberId(m.userId)}
                            className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${filterMemberId === m.userId ? 'bg-dagang-green text-white border-dagang-green shadow-lg shadow-dagang-green/20' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-dagang-green/50'}`}
                        >
                            {m.fullName?.split(' ')[0] || 'Anggota'}
                        </button>
                    ))}
                </div>
            )}

            {/* Smart Export Notification */}
            {showExportPrompt && milestoneInfo && (
                <div className="bg-gradient-to-r from-dagang-green/10 to-emerald-500/10 border border-dagang-green/20 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-dagang-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-dagang-green/20">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[var(--text-main)]">Awal {milestoneInfo.label} Baru Telah Tiba! 🚀</h4>
                            <p className="text-sm text-[var(--text-muted)] opacity-70">Jangan lupa amankan catatan keuangan {milestoneInfo.prevLabel.toLowerCase()} bosku. Ekspor sekarang biar makin rapi!</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => {
                                // Default to last period export based on milestone
                                handleExportWithPeriod(
                                    milestoneInfo.type === 'week' ? 'last_week' : 
                                    milestoneInfo.type === 'month' ? 'last_month' : 'last_year', 
                                    'excel'
                                );
                            }}
                            className="flex-1 md:flex-none px-6 py-3 bg-dagang-green text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-md active:scale-95"
                        >
                            Ekspor {milestoneInfo.prevLabel}
                        </button>
                        <button 
                            onClick={() => setShowExportPrompt(false)}
                            className="p-3 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] rounded-xl hover:bg-black/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Advanced Filters & Actions */}
            <div className="bg-[var(--surface-card)] p-4 mobile:p-8 rounded-[32px] shadow-sm border border-[var(--border)] space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mobile:gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 mobile:left-6 top-1/2 -translate-y-1/2 w-4 h-4 mobile:w-5 mobile:h-5 text-[var(--text-muted)] opacity-50" />
                        <input
                            type="text"
                            placeholder="Cari catatan atau kategori..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 mobile:pl-16 pr-5 mobile:pr-6 py-4 mobile:py-5 bg-black/5 dark:bg-white/5 border-none rounded-[20px] mobile:rounded-[24px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all placeholder:text-[var(--text-muted)] opacity-60 font-medium text-[var(--text-main)] text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 mobile:flex mobile:items-center gap-2 mobile:gap-3">
                        {/* Smart Export Dropdown */}
                        <div className="relative group col-span-2 mobile:col-span-1">
                            <button 
                                className="w-full p-3.5 mobile:p-4 bg-dagang-accent/10 text-dagang-accent rounded-2xl hover:bg-dagang-accent/20 transition-all shadow-sm border border-dagang-accent/20 flex items-center justify-center gap-2 font-black text-[9px] mobile:text-[10px] tracking-widest uppercase"
                            >
                                <Download className="w-4 h-4 mobile:w-5 mobile:h-5" /> SMART EXPORT
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            
                            <div className="absolute top-full right-0 mt-3 w-full mobile:w-[280px] bg-[var(--surface-card)] rounded-[24px] shadow-2xl border border-[var(--border)] py-3 z-[100] hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-5 py-2 text-[10px] font-black text-dagang-accent opacity-60 uppercase tracking-widest border-b border-[var(--border)] mb-2">Pilih Periode Laporan</div>
                                {[
                                    { id: 'last_month', label: 'Bulan Lalu', icon: Calendar },
                                    { id: 'this_month', label: 'Bulan Ini', icon: Calendar },
                                    { id: 'last_week', label: 'Minggu Lalu', icon: Calendar },
                                    { id: 'this_week', label: 'Minggu Ini', icon: Calendar },
                                    { id: 'last_year', label: 'Tahun Lalu', icon: Box },
                                    { id: 'this_year', label: 'Tahun Ini', icon: Box }
                                ].map((period) => (
                                    <div key={period.id} className="px-2">
                                        <div className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-default group/item">
                                            <div className="flex items-center gap-3">
                                                <period.icon className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
                                                <span className="text-xs font-bold text-[var(--text-main)]">{period.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleExportWithPeriod(period.id, 'excel')}
                                                    className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500 text-[10px] font-black hover:text-white transition-all"
                                                >EXCEL</button>
                                                <button 
                                                    onClick={() => handleExportWithPeriod(period.id, 'pdf')}
                                                    className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 text-[10px] font-black hover:text-white transition-all"
                                                >PDF</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleExportExcel}
                            className="flex-1 p-3.5 mobile:p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100 flex items-center justify-center gap-2 font-bold text-[11px] mobile:text-xs"
                        >
                            <FileText className="w-4 h-4 mobile:w-5 mobile:h-5" /> EXCEL
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="flex-1 p-3.5 mobile:p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-sm border border-red-100 flex items-center justify-center gap-2 font-bold text-[11px] mobile:text-xs"
                        >
                            <Download className="w-4 h-4 mobile:w-5 mobile:h-5" /> PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 mobile:gap-4">
                    <FilterDropdown
                        label="Pilih Bulan"
                        value={selectedMonth.toString()}
                        onChange={(v) => setSelectedMonth(parseInt(v))}
                        options={Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({
                            label: new Date(2000, m - 1, 1).toLocaleDateString('id-ID', { month: 'long' }),
                            value: m.toString()
                        }))}
                        icon={Calendar}
                    />
                    <FilterDropdown
                        label="Tahun"
                        value={selectedYear.toString()}
                        onChange={(v) => setSelectedYear(parseInt(v))}
                        options={Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(y => ({
                            label: y,
                            value: y
                        }))}
                    />
                    <FilterDropdown
                        label="Quick Filter"
                        value={timeFilter}
                        onChange={setTimeFilter}
                        options={[
                            { label: 'Semua Waktu', value: 'all' },
                            { label: 'Hari Ini', value: 'day' },
                            { label: 'Minggu Ini', value: 'week' },
                        ]}
                    />
                    <FilterDropdown
                        label="Semua Tipe"
                        value={filterType}
                        onChange={setFilterType}
                        options={[
                            { label: 'Uang Masuk', value: 'income' },
                            { label: 'Pengeluaran', value: 'expense' },
                            { label: 'Transfer', value: 'transfer' }
                        ]}
                    />
                    <FilterDropdown
                        label="Semua Dompet"
                        value={filterWallet}
                        onChange={setFilterWallet}
                        options={wallets.map((w: any) => ({ label: w.name, value: w.id }))}
                    />
                    <FilterDropdown
                        label="Semua Kategori"
                        value={filterCategory}
                        onChange={setFilterCategory}
                        options={categoryOptions}
                    />
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                        <thead>
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
                            ) : paginatedTransactions.map((tx: any) => {
                                const wallet = wallets.find((w: any) => w.id === tx.walletId);
                                const isIncome = tx.type === 'income';
                                const isTransfer = tx.type === 'transfer';
                                return (
                                    <tr key={tx.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                                                    <span className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-wider">{tx.category || 'Tabungan'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border)] w-fit">
                                                <span className="text-[11px] font-bold text-[var(--text-main)] opacity-70">{wallet?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-dagang-green' : 'text-red-500'}`}>
                                                {isIncome ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                {(tx.userId === currentUserId && familyRole !== 'viewer') ? (
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-[var(--border)] flex flex-col mobile:flex-row items-center justify-between gap-4 bg-black/5 dark:bg-white/5">
                        <div className="text-[12px] font-bold text-[var(--text-muted)] opacity-50">
                            Menampilkan <span className="text-[var(--text-main)]">{Math.min(filteredTransactions.length, rowsPerPage)}</span> dari <span className="text-[var(--text-main)]">{filteredTransactions.length}</span> transaksi
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                            currentPage === page 
                                            ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-110' 
                                            : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
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
                familyMembers={familyMembers}
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
                familyMembers={familyMembers}
            />

            <ReceiptScannerModal
                isOpen={isScannerModalOpen}
                onClose={() => setIsScannerModalOpen(false)}
                familyMembers={familyMembers}
                wallets={wallets}
                onConfirm={(data) => {
                    // Auto-populate newTx and open the single transaction modal
                    setNewTx({
                        ...newTx,
                        description: data.merchant || 'Belanja Struk',
                        amount: data.total,
                        // Only overwrite date if it was actually found
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
