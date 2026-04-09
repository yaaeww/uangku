import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    TrendingUp,
    Info,
    Bell,
    Check,
    Edit3,
    Trash2,
    X,
    ChevronDown,
    Wallet,
    Coffee,
    ShoppingCart,
    Coins,
    ShieldCheck,
    AlertCircle,
    Settings2,
    Eraser,
    Calculator,
    Search
} from 'lucide-react';
import { FinanceController } from '../../controllers/FinanceController';
import { BudgetController } from '../../controllers/BudgetController';
import { useModal } from '../../providers/ModalProvider';
import { formatRupiah, parseRupiah } from '../../utils/formatters';

const CategoryRow = ({
    cat,
    totalBudget,
    currentUserId,
    activeMemberId,
    familyRole,
    context,
    openCreateModal,
    openEditModal,
    handleDeleteSaving,
    setSelectedGoal,
    setIsAllocateOpen,
    openEditCategoryModal,
    handleClearCategoryItems,
    handleDeleteBudgetCategory,
    canManageBudget,
    canInputBudget,
    canDeleteBudget,
    isAdmin
}: any) => {
    const [showInfo, setShowInfo] = useState(false);

    // Filter items to show only those belonging to the active member's tab
    const catSavings = (cat.items || []).filter((s: any) => (s.userId || s.user_id) === activeMemberId);

    const allocationPercent = cat.percentage;
    const categoryBudget = (totalBudget * allocationPercent) / 100;

    // Calculate total target and total used based on monthly transactions
    const totalTarget = catSavings.reduce((acc: number, s: any) => acc + (s.targetAmount || s.target_amount || 0), 0);
    const totalUsed = catSavings.reduce((acc: number, s: any) => {
        const sSpent = (context.transactions || [])
            .filter((tx: any) => 
                (tx.type === 'expense' || tx.type === 'saving' || tx.type === 'goal_allocation' || tx.type === 'debt_payment') && 
                (String(tx.savingId) === String(s.id) || String(tx.saving_id) === String(s.id))
            )
            .reduce((tAcc: number, tx: any) => tAcc + tx.amount, 0);
        return acc + sSpent;
    }, 0);

    const progress = categoryBudget > 0 ? (totalTarget / categoryBudget) * 100 : 0;
    const usedProgress = categoryBudget > 0 ? (totalUsed / categoryBudget) * 100 : 0;

    const IconComponent = (cat.icon === 'ShoppingCart' ? ShoppingCart :
        cat.icon === 'Coffee' ? Coffee :
            cat.icon === 'Coins' ? Coins :
                cat.icon === 'ShieldCheck' ? ShieldCheck : Wallet);

    return (
        <div className="space-y-6 bg-[var(--surface-card)] backdrop-blur-sm p-4 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-[var(--border)] shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-5">
                    <div className={`p-3 sm:p-4 ${cat.bgColor} ${cat.color} rounded-2xl shadow-sm relative group shrink-0`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-main)] truncate">
                                {cat.name}
                            </h3>
                            <span className={`text-[10px] sm:text-[12px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${cat.bgColor} ${cat.color} font-black`}>
                                {allocationPercent}%
                            </span>
                            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-wider ${cat.type === 'keinginan' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                                {cat.type || 'kebutuhan'}
                            </span>
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`p-1.5 rounded-full transition-all ${showInfo ? 'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]' : 'text-[var(--text-muted)] opacity-60 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        </div>
                        {showInfo ? (
                            <div className="text-[11px] sm:text-[12px] text-[var(--text-main)] font-bold bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300 border border-[var(--border)]">
                                {cat.description}
                            </div>
                        ) : (
                            <p className="text-[11px] sm:text-[13px] text-[var(--text-muted)] opacity-80 font-medium truncate">Klik ikon "i" untuk penjelasan</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    {Math.abs(totalTarget - categoryBudget) > 1 && (
                        <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border rounded-xl animate-pulse ${totalTarget > categoryBudget ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <div className="text-left">
                                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter">
                                    {totalTarget > categoryBudget ? '⚠️ Alokasi Lebih!' : 'ℹ️ Belum Terisi'}
                                </div>
                                <div className="text-[10px] sm:text-[12px] font-bold">
                                    {totalTarget > categoryBudget ? `Lebih Rp ${(totalTarget - categoryBudget).toLocaleString('id-ID')}` : `Sisa Rp ${(categoryBudget - totalTarget).toLocaleString('id-ID')}`}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="text-right flex-1 sm:flex-none">
                            <div className="text-[9px] sm:text-[11px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest mb-0.5 sm:mb-1">Budget Baris</div>
                            <div className="flex items-center gap-2 justify-end">
                                <div className="text-lg sm:text-xl font-serif text-[var(--text-main)] font-bold">Rp {categoryBudget.toLocaleString('id-ID')}</div>
                            </div>
                        </div>

                        {(canManageBudget && (activeMemberId === currentUserId || isAdmin)) && (
                            <div className="flex flex-row sm:flex-row gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-[var(--border)]">
                                <button
                                    onClick={() => openEditCategoryModal(cat)}
                                    className="p-2 sm:p-2.5 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-muted)] rounded-xl flex items-center justify-center hover:bg-dagang-blue hover:text-white transition-all group relative shadow-sm"
                                    title="Edit Kategori"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    <span className="absolute bottom-full mb-3 right-1/2 translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold uppercase tracking-widest shadow-xl pointer-events-none">Edit Kategori</span>
                                </button>
                                <button
                                    onClick={() => handleClearCategoryItems(cat.id)}
                                    className="p-2 sm:p-2.5 bg-[var(--surface-card)] border border-[var(--border)] text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all group relative shadow-sm"
                                    title="Hapus Semua Subkategori"
                                >
                                    <Eraser className="w-4 h-4" />
                                    <span className="absolute bottom-full mb-3 right-1/2 translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold uppercase tracking-widest shadow-xl pointer-events-none">Hapus Semua Subkategori</span>
                                </button>
                                {canDeleteBudget && (
                                    <button
                                        onClick={() => handleDeleteBudgetCategory(cat.id)}
                                        className="p-2 sm:p-2.5 bg-[var(--surface-card)] border border-[var(--border)] text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group relative shadow-sm"
                                        title="Hapus Kategori Permanen"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="absolute bottom-full mb-3 right-1/2 translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold uppercase tracking-widest shadow-xl pointer-events-none">Hapus Kategori Permanen</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {(canInputBudget && (activeMemberId === currentUserId || isAdmin)) && (
                            <button
                                onClick={() => openCreateModal(cat.id)}
                                className="w-10 h-10 sm:w-14 sm:h-14 bg-[var(--text-main)] text-[var(--background)] rounded-2xl flex items-center justify-center hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
                                title="Tambah Item"
                            >
                                <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden relative shadow-inner border border-[var(--border)]">
                    {/* Allocation Goal Bar (Faint) */}
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 opacity-20 ${ (cat.color || 'text-dagang-green').replace('text', 'bg')}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                    {/* Actual Usage Bar (Solid) */}
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${ (cat.color || 'text-dagang-green').replace('text', 'bg')} shadow-lg`}
                        style={{ width: `${Math.min(usedProgress, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[11px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] px-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cat.color.replace('text', 'bg')}`} />
                        Terpakai: Rp {totalUsed.toLocaleString('id-ID')}
                    </div>
                    <span>Sisa: Rp {(categoryBudget - totalUsed).toLocaleString('id-ID')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catSavings.map((s: any) => {
                    const sSpent = (context.transactions || [])
                        .filter((tx: any) => 
                            (tx.type === 'expense' || tx.type === 'saving' || tx.type === 'goal_allocation' || tx.type === 'debt_payment') && 
                            (String(tx.savingId) === String(s.id) || String(tx.saving_id) === String(s.id))
                        )
                        .reduce((acc: number, tx: any) => acc + tx.amount, 0);

                    const targetVal = s.targetAmount || s.target_amount || 0;
                    const sProgress = targetVal > 0 ? (s.currentBalance / targetVal) * 100 : 0;
                    const sSpentProgress = targetVal > 0 ? (sSpent / targetVal) * 100 : 0;

                    const isCreator = (s.userId || s.user_id) === currentUserId;
                    const canEditItem = (canInputBudget && (isCreator || isAdmin));
                    const canDeleteItem = (canDeleteBudget && (isCreator || isAdmin));

                    return (
                        <div key={s.id} className="bg-[var(--surface-card)] border border-[var(--border)] rounded-3xl p-4 sm:p-5 hover:shadow-xl hover:shadow-black/[0.03] transition-all group relative overflow-hidden">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-inner group-hover:scale-110 transition-transform">
                                    {s.emoji || '💰'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[13px] sm:text-[14px] text-[var(--text-main)] truncate">{s.name}</h4>
                                    <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)] opacity-60 font-black uppercase tracking-wider flex items-center gap-2 flex-wrap">
                                        {s.user?.full_name && (
                                            <span className="text-[var(--primary)] font-black">Oleh: {s.user.full_name}</span>
                                        )}
                                        {s.target_user?.full_name && (
                                            <span className="px-1.5 py-0.5 bg-dagang-blue/10 text-dagang-blue rounded-md border border-dagang-blue/20">
                                                Untuk: {s.target_user.full_name}
                                            </span>
                                        )}
                                        {!s.user?.full_name && !s.target_user?.full_name && (
                                            <>
                                                <AlertCircle className="w-2.5 h-2.5" /> Tgl {s.dueDate || s.due_date || '-'}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    {canEditItem && (
                                        <button 
                                            onClick={() => openEditModal(s)} 
                                            className="p-2 text-[var(--text-muted)] hover:text-dagang-blue hover:bg-dagang-blue/10 rounded-xl transition-all shadow-sm bg-[var(--surface-card)] border border-[var(--border)]"
                                            title="Edit Item"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {canDeleteItem && (
                                        <button 
                                            onClick={() => handleDeleteSaving(s.id)} 
                                            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm bg-[var(--surface-card)] border border-[var(--border)]"
                                            title="Hapus Item"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-end mb-3">
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest truncate">Saldo (Limit)</div>
                                    <div className="text-[12px] sm:text-[13px] font-serif font-bold text-[var(--text-main)] truncate">Rp {targetVal.toLocaleString('id-ID')}</div>
                                </div>
                                <div className="text-right flex-1 min-w-0">
                                    <div className="text-[8px] sm:text-[9px] font-black text-red-400/50 uppercase tracking-widest truncate">Terpakai</div>
                                    <div className="text-[11px] font-serif font-bold text-red-500 truncate">Rp {sSpent.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                            <div className="h-2 bg-black/5 rounded-full overflow-hidden mb-2 relative">
                                <div className={`h-full ${cat.color.replace('text', 'bg')} opacity-20 absolute inset-0 transition-all duration-1000`} style={{ width: `${Math.min(sProgress, 100)}%` }} />
                                <div className={`h-full bg-red-500 transition-all duration-1000 absolute inset-0`} style={{ width: `${Math.min(sSpentProgress, 100)}%` }} />
                            </div>
                            {sSpent > targetVal && (
                                <div className="mb-4 flex items-start gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-tighter animate-pulse">
                                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>pengeluaran anda terlalu banyak di "{s.name}" Kategori Pengeluaran</span>
                                </div>
                            )}
                        </div>
                    );
                })}
                {catSavings.length === 0 && (
                    <div className="col-span-full py-6 border-2 border-dashed border-[var(--border)] rounded-3xl flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 hover:bg-black/[0.01] transition-colors cursor-pointer" onClick={() => openCreateModal(cat.id)}>
                        <Plus className="w-5 h-5 mb-2 opacity-70" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Tambah Item Baru</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- Premium Select Component --- */
const PremiumPeriodSelector = ({ label, value, options, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find((o: any) => parseInt(o.value) === parseInt(value)) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) setSearch('');
        else if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
    }, [isOpen]);

    const filteredOptions = options.filter((o: any) => 
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl backdrop-blur-md transition-all cursor-pointer text-white font-black text-[12px] uppercase tracking-wider min-w-[140px] justify-between shadow-inner"
            >
                <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[9px] opacity-40 leading-none">{label}</span>
                    <span>{selectedOption?.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                        style={{ originY: 0 }}
                        className="absolute top-full left-0 mt-4 w-[260px] bg-[var(--surface-card)]/90 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-black/30 border border-[var(--border)] z-[100] overflow-hidden flex flex-col"
                    >
                        <div className="p-4 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] text-dagang-green">PILIH {label}</span>
                                <Search className="w-3 h-3 text-[var(--text-muted)] opacity-50" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={`Cari ${label}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 py-2 text-[12px] font-bold outline-none focus:ring-1 focus:ring-dagang-green transition-all"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt: any) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(parseInt(opt.value));
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-all flex items-center justify-between group ${
                                            parseInt(value) === parseInt(opt.value) 
                                            ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-[1.02]' 
                                            : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {parseInt(value) === parseInt(opt.value) && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <Check className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 italic">Tidak ditemukan</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const BudgetView = () => {
    const context = useOutletContext<any>() || {};
    const { showAlert, showConfirm } = useModal();
    const {
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        wallets = [],
        budgetCategories = [],
        summary = {},
        familyRole,
        currentUserId,
        handleCreateBudgetCategory,
        handleUpdateBudgetCategory,
        handleDeleteBudgetCategory,
        handleClearAllCategories,
        handleCreateSaving,
        handleUpdateSaving,
        handleDeleteSaving,
        handleAllocateToSaving,
        refreshDashboard,
        familyMembers = []
    } = context;

    const [totalBudget, setTotalBudget] = useState<number>(0);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState<number>(0);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [catName, setCatName] = useState('');
    const [catPercent, setCatPercent] = useState(0);
    const [catIcon, setCatIcon] = useState('ShoppingCart');
    const [catColor, setCatColor] = useState('text-blue-500');
    const [catBg, setCatBg] = useState('bg-blue-50');
    const [catDesc, setCatDesc] = useState('');
    const [catType, setCatType] = useState<'kebutuhan' | 'keinginan'>('kebutuhan');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllocateOpen, setIsAllocateOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [editSaving, setEditSaving] = useState<any>(null);

    const [name, setName] = useState('');
    const [target, setTarget] = useState<number>(0);
    const [emoji, setEmoji] = useState('💰');
    const [dueDate, setDueDate] = useState<number>(0);
    const [activeMemberId, setActiveMemberId] = useState<string>(currentUserId);

    const myWallets = wallets.filter((w: any) => w.user_id === currentUserId);
    const totalCategoryPercent = budgetCategories.reduce((acc: number, cat: any) => acc + (cat.percentage || 0), 0);
    const isOwner = !!currentUserId && !!activeMemberId && String(activeMemberId) === String(currentUserId);
    const canManageBudget = isOwner;
    const canInputBudget = isOwner;
    const canDeleteBudget = isOwner;

    // DEBUG: Only for troubleshooting the visibility bug
    useEffect(() => {
        console.log('[BudgetView] activeMemberId:', activeMemberId);
        console.log('[BudgetView] currentUserId:', currentUserId);
        console.log('[BudgetView] isOwner:', isOwner);
    }, [activeMemberId, currentUserId]);

    const activeMember = familyMembers.find((m: any) => m.userId === activeMemberId) || {};
    const isAdmin = familyRole === 'head_of_family' || familyRole === 'treasurer';
    const isMonitor = familyRole === 'viewer';
    const canSeeAllBudgets = isAdmin || isMonitor;

    // Filter members to hide admins (KK/BDH) from the member list, but keep yourself in tabs
    const filteredMembers = familyMembers.filter((m: any) => 
        m.userId === currentUserId || (m.role !== 'head_of_family' && m.role !== 'treasurer')
    );

    // Refetch categories ONLY when activeMemberId changes to support per-user budgets
    // selectedMonth/Year are handled by the parent FamilyDashboard's fetchData
    useEffect(() => {
        setIsEditingBudget(false);
        if (typeof refreshDashboard === 'function') {
            refreshDashboard('budget', activeMemberId);
        }
    }, [activeMemberId, selectedMonth, selectedYear]);

    useEffect(() => {
        // Prevent resetting to 0 if we are loading and already have a value
        if (context.loading && totalBudget > 0) return;

        const lowerActiveId = String(activeMemberId).toLowerCase();
        
        // Priority 1: From summary.memberBudgets (calculated summary)
        if (summary?.memberBudgets && summary.memberBudgets[lowerActiveId] !== undefined) {
            setTotalBudget(summary.memberBudgets[lowerActiveId]);
        } else if (summary?.memberBudgets && summary.memberBudgets[activeMemberId] !== undefined) {
            setTotalBudget(summary.memberBudgets[activeMemberId]);
        } 
        // Priority 2: From summary.userBudget (direct current user summary)
        else if (activeMemberId === currentUserId && summary?.userBudget !== undefined) {
            setTotalBudget(summary.userBudget);
        } 
        // Priority 3: From activeMember.monthly_budget (fallback to profile data)
        else if (activeMember && activeMember.monthly_budget !== undefined) {
            setTotalBudget(activeMember.monthly_budget);
        }
        // If everything fails and loading is finished, only then set to 0 or keep old
    }, [activeMemberId, summary?.userBudget, summary?.memberBudgets, activeMember, context.loading]);

    const handleUpdateActiveMemberBudget = async () => {
        try {
            const targetId = activeMemberId === currentUserId ? undefined : activeMemberId;
            await FinanceController.updateMemberBudget(tempBudget, targetId, selectedMonth, selectedYear);
            showAlert('Berhasil', 'Budget bulanan berhasil diperbarui');
            setIsEditingBudget(false);
            refreshDashboard();
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error || 'Gagal memperbarui budget');
        }
    };

    const handleApplyDefault = async () => {
        const msg = activeMemberId === currentUserId
            ? 'Sistem akan membuatkan item budget dasar untuk Anda (Makan, Listrik, dll). Lanjutkan?'
            : `Sistem akan membuatkan item budget dasar untuk ${activeMember.fullName || 'anggota ini'}. Lanjutkan?`;

        showConfirm('Gunakan Alokasi Default?', msg, async () => {
            try {
                const targetId = activeMemberId === currentUserId ? undefined : activeMemberId;
                await FinanceController.applyDefaultAllocation(targetId, selectedMonth, selectedYear);
                showAlert('Berhasil', 'Alokasi default diterapkan');
                refreshDashboard();
            } catch (err: any) {
                showAlert('Gagal', err.response?.data?.error || 'Gagal menerapkan alokasi');
            }
        });
    };

    const handleClearCategoryItems = async (catId: string) => {
        showConfirm('Hapus Semua?', 'Yakin ingin menghapus semua sub-kategori ini? Jika dihapus, SEMUA data transaksi yang bersangkutan juga akan terhapus permanen.', async () => {
            try {
                await BudgetController.clearCategoryItems(catId, isAdmin ? activeMemberId : undefined);
                showAlert('Berhasil', 'Semua sub-kategori berhasil dihapus');
                refreshDashboard();
            } catch (err: any) {
                showAlert('Gagal', err.response?.data?.error || 'Gagal menghapus data');
            }
        }, 'danger');
    };

    const [allocateAmount, setAllocateAmount] = useState<number>(0);
    const [allocateWalletId, setAllocateWalletId] = useState('');

    const grandTotalAllocated = budgetCategories.reduce((acc: number, cat: any) => {
        const catItems = (cat.items || []).filter((s: any) => (s.userId || s.user_id) === activeMemberId);
        return acc + catItems.reduce((iAcc: number, item: any) => iAcc + (item.targetAmount || item.target_amount || 0), 0);
    }, 0);

    const openCreateModal = (catId?: string) => {
        setEditSaving(null);
        setName('');
        setTarget(0);
        setSelectedCategory(catId || budgetCategories[0]?.id || '');
        setEmoji('💰');
        setDueDate(0);
        setIsModalOpen(true);
    };

    const openEditModal = (saving: any) => {
        setEditSaving(saving);
        setName(saving.name);
        setTarget(saving.targetAmount || saving.target_amount);
        setSelectedCategory(saving.category || 'savings');
        setEmoji(saving.emoji || '💰');
        setDueDate(saving.dueDate || saving.due_date || 0);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editSaving) {
            handleUpdateSaving({
                ...editSaving,
                name,
                targetAmount: target,
                category: selectedCategory,
                emoji,
                dueDate: dueDate
            });
        } else {
            handleCreateSaving(name, target, 0, "", selectedCategory, emoji, dueDate, activeMemberId);
        }
        setIsModalOpen(false);
    };

    const handleAllocateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGoal && allocateWalletId && allocateAmount > 0) {
            handleAllocateToSaving(allocateWalletId, selectedGoal.id, allocateAmount);
            setIsAllocateOpen(false);
            setAllocateAmount(0);
        }
    };

    const confirmDeleteSaving = (id: string) => {
        showConfirm('Hapus Item', 'Yakin ingin menghapus item ini? Jika dihapus, SEMUA data transaksi yang bersangkutan juga akan terhapus permanen.', () => {
            handleDeleteSaving(id);
        }, 'danger');
    };

    const confirmDeleteCategory = (id: string) => {
        showConfirm(
            'Hapus Kategori PERMANEN', 
            'AWAS: Ini akan menghapus kategori ini dan SEMUA item di dalamnya untuk SEMUA BULAN selamanya. Lanjutkan?', 
            () => {
                handleDeleteBudgetCategory(id, undefined, undefined, isAdmin ? activeMemberId : undefined); // Global delete
            }, 
            'danger'
        );
    };

    const confirmClearCategoryItems = (id: string) => {
        showConfirm(
            'Kosongkan Bulan Ini', 
            `Yakin ingin menghapus semua item budget pada kategori ini untuk bulan ${selectedMonth}/${selectedYear}? Transaksi tidak akan terhapus.`, 
            () => {
                handleDeleteBudgetCategory(id, selectedMonth, selectedYear, isAdmin ? activeMemberId : undefined); // Period-specific clear
            }, 
            'danger'
        );
    };

    const handleClearAll = () => {
        showConfirm(
            'Hapus Semua Kategori?', 
            'AWAS: Ini akan menghapus SEMUA kategori dan item budget selamanya (semua bulan). Lanjutkan?', 
            () => handleClearAllCategories(isAdmin ? activeMemberId : undefined), 
            'danger'
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {filteredMembers.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filteredMembers.map((member: any) => (
                        <button
                            key={member.userId}
                            onClick={() => setActiveMemberId(member.userId)}
                            className={`px-6 py-3 rounded-2xl font-black text-[12px] whitespace-nowrap transition-all flex items-center gap-2 border-2 ${activeMemberId === member.userId
                                ? 'bg-dagang-accent text-dagang-dark border-dagang-accent shadow-lg shadow-dagang-accent/20'
                                : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-dagang-accent/30'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${activeMemberId === member.userId ? 'bg-dagang-dark animate-pulse' : 'bg-[var(--text-muted)]/30'}`} />
                            {member.userId === currentUserId ? 'SAYA (KONTROL)' : (member.fullName || 'ANGGOTA').toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-[#064E3B] rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20 min-h-[300px] flex flex-col justify-center">
                <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-l from-emerald-400/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-10">
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-4xl md:text-6xl font-serif leading-tight">
                                    Atur Budget
                                </h2>
                                <div className="flex items-center gap-3 text-white font-bold">
                                    <span className="text-body-s uppercase tracking-widest opacity-60">untuk bulan</span>
                                    <div className="flex flex-wrap items-center gap-3 select-none">
                                        <PremiumPeriodSelector
                                            label="Bulan"
                                            value={selectedMonth}
                                            onChange={setSelectedMonth}
                                            options={Array.from({ length: 12 }, (_, i) => ({
                                                label: new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
                                                value: (i + 1).toString()
                                            }))}
                                        />
                                        <div className="hidden md:block w-px h-6 bg-white/20 self-center" />
                                        <PremiumPeriodSelector
                                            label="Tahun"
                                            value={selectedYear}
                                            onChange={setSelectedYear}
                                            options={Array.from({ length: 21 }, (_, i) => ({
                                                label: (new Date().getFullYear() - 10 + i).toString(),
                                                value: (new Date().getFullYear() - 10 + i).toString()
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 self-center md:self-auto">
                        {isOwner && (
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCatName('');
                                    setCatPercent(0);
                                    setCatDesc('');
                                    setCatIcon('ShoppingCart');
                                    setCatColor('text-blue-500');
                                    setCatBg('bg-blue-50');
                                    setCatType('kebutuhan');
                                    setIsCategoryModalOpen(true);
                                }}
                                className="px-6 py-3 bg-white text-[#064E3B] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-black/10"
                            >
                                <Plus className="w-4 h-4" /> TAMBAH KATEGORI PENGELUARAN
                            </button>
                        )}
                    </div>
                        </div>
                        <p className="text-white/60 text-sm md:text-base max-w-md leading-relaxed font-medium text-center md:text-left">
                            "Atur budgetmu setiap bulan supaya pengeluaran lebih terencana."
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-dagang-accent/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <div className="text-[10px] font-black text-dagang-accent uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-start gap-2">
                                    <TrendingUp className="w-3 h-3" /> {activeMemberId === currentUserId ? 'BUDGET SAYA' : `BUDGET ${activeMember.fullName || 'ANGGOTA'}`}
                                </div>
                                {isEditingBudget && isOwner ? (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={formatRupiah(tempBudget) || ''}
                                            onChange={(e) => setTempBudget(parseRupiah(e.target.value))}
                                            className="bg-white/10 border-b-2 border-dagang-accent outline-none text-3xl font-serif text-white w-48 py-1"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateActiveMemberBudget} className="p-2 bg-dagang-accent text-dagang-dark rounded-xl hover:scale-105 transition-all">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setIsEditingBudget(false)} className="p-2 bg-white/10 text-white rounded-xl">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tighter">
                                            Rp {totalBudget.toLocaleString('id-ID')}
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => {
                                                    setTempBudget(totalBudget);
                                                    setIsEditingBudget(true);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-dagang-accent"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="mt-2 text-[11px] font-bold text-white/40 uppercase tracking-widest">
                                    Teralokasi: Rp {grandTotalAllocated.toLocaleString('id-ID')} ({totalBudget > 0 ? ((grandTotalAllocated / totalBudget) * 100).toFixed(1) : 0}%)
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {isOwner && (
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <button
                                            onClick={handleClearAll}
                                            className="w-full sm:w-auto px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 flex items-center justify-center gap-2 group"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                            HAPUS SEMUA KATEGORI
                                        </button>
                                        <button
                                            onClick={handleApplyDefault}
                                            className="w-full sm:w-auto px-5 py-3 bg-dagang-accent/10 border border-dagang-accent/20 rounded-2xl text-dagang-accent text-[11px] font-black uppercase tracking-widest hover:bg-dagang-accent hover:text-dagang-dark transition-all shadow-xl shadow-dagang-accent/10 flex items-center justify-center gap-2 group"
                                        >
                                            <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                                            GUNAKAN ALOKASI DEFAULT
                                        </button>
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-[10px] font-black text-dagang-accent uppercase tracking-[0.2em] mb-1">AGGREGATE TOTAL</div>
                                        <div className="text-xl font-serif text-white/80">Rp {(summary?.totalFamilyBudget || 0).toLocaleString('id-ID')}</div>
                                        <div className="text-[11px] text-white/40 font-bold uppercase tracking-widest">SEMUA KELUARGA</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {(canSeeAllBudgets || familyRole === 'member') && (
                <div className="bg-[var(--surface-card)] rounded-[32px] p-6 sm:p-8 border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-dagang-accent/10 rounded-xl">
                            <Coins className="w-5 h-5 text-dagang-accent" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-[var(--text-main)]">Rincian Budget Anggota</h3>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Monitoring alokasi budget tiap individu</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {familyMembers
                            .filter((m: any) => {
                                if (canSeeAllBudgets) return true;
                                return m.userId === currentUserId;
                            })
                            .sort((a: any, b: any) => {
                                const roleOrder: Record<string, number> = { 'head_of_family': 0, 'treasurer': 1, 'member': 2, 'viewer': 3 };
                                return (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
                            })
                            .map((m: any) => {
                            const memberTransactions = (context.transactions || []).filter((tx: any) => 
                                String(tx.userId || tx.user_id) === String(m.userId) &&
                                (tx.type === 'expense' || tx.type === 'saving' || tx.type === 'goal_allocation' || tx.type === 'debt_payment')
                            );
                            const memberSpent = memberTransactions.reduce((acc: number, tx: any) => acc + tx.amount, 0);
                            
                            const memberDebtSpent = memberTransactions
                                .filter((tx: any) => tx.type === 'debt_payment')
                                .reduce((acc: number, tx: any) => acc + tx.amount, 0);
                                
                            const memberGoalSpent = memberTransactions
                                .filter((tx: any) => tx.type === 'saving' || tx.type === 'goal_allocation')
                                .reduce((acc: number, tx: any) => acc + tx.amount, 0);

                            const memberAllocated = budgetCategories.reduce((acc: number, cat: any) => {
                                const catItems = (cat.items || []).filter((s: any) => String(s.user_id || s.userId) === String(m.userId));
                                return acc + catItems.reduce((iAcc: number, item: any) => iAcc + (item.targetAmount || item.target_amount || 0), 0);
                            }, 0);

                            const memberBudget = summary?.memberBudgets?.[String(m.userId).toLowerCase()] ?? summary?.memberBudgets?.[m.userId] ?? m.monthly_budget ?? 0;
                            const spentPercent = memberBudget > 0 ? (memberSpent / memberBudget) * 100 : 0;

                            return (
                                <div key={m.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] transition-all hover:border-dagang-accent/30 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-bold text-[13px] truncate">{m.fullName || m.full_name || 'Member'}</div>
                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                            m.role === 'head_of_family' ? 'bg-dagang-accent text-dagang-dark' : 
                                            m.role === 'treasurer' ? 'bg-dagang-green text-white' :
                                            m.role === 'viewer' ? 'bg-dagang-accent/20 text-dagang-accent border border-dagang-accent/30' :
                                            'bg-black/10 text-[var(--text-muted)]'
                                        }`}>
                                            {m.role === 'head_of_family' ? 'KK' : m.role === 'treasurer' ? 'BDH' : m.role === 'viewer' ? 'PTU' : 'MBR'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-medium opacity-60">
                                            <span>Limit:</span>
                                            <span className="font-bold">Rp {memberBudget.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium opacity-60">
                                            <span>Teralokasi:</span>
                                            <span className="font-bold">Rp {memberAllocated.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium">
                                            <span>Realisasi:</span>
                                            <div className="text-right">
                                                <span className={`font-bold ${memberSpent > memberBudget ? 'text-red-500' : 'text-dagang-green'}`}>
                                                    Rp {memberSpent.toLocaleString('id-ID')}
                                                </span>
                                                <div className="flex flex-col items-end gap-0.5 mt-0.5">
                                                    {memberDebtSpent > 0 && (
                                                        <span className="text-[9px] opacity-70 block font-medium">
                                                            (Lunas Hutang: Rp {memberDebtSpent.toLocaleString('id-ID')})
                                                        </span>
                                                    )}
                                                    {memberGoalSpent > 0 && (
                                                        <span className="text-[9px] opacity-70 block font-medium">
                                                            (Tabung Goals: Rp {memberGoalSpent.toLocaleString('id-ID')})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-black/10 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${memberSpent > memberBudget ? 'bg-red-500' : 'bg-dagang-accent'}`}
                                                style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-[8px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-tighter">
                                            Pengeluaran: {spentPercent.toFixed(1)}% dari limit
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mb-10">
                {totalCategoryPercent !== 100 && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${totalCategoryPercent > 100 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-widest">⚠️ Validasi Budget Kategori</div>
                            <div className="text-sm font-medium">Total alokasi kategori saat ini adalah <strong>{totalCategoryPercent}%</strong>. Harusnya tepat <strong>100%</strong> agar semua budget Anda memiliki tugas.</div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-10">
                    {budgetCategories.map((cat: any) => (
                        <CategoryRow
                            key={cat.id}
                            cat={cat}
                            totalBudget={totalBudget}
                            currentUserId={currentUserId}
                            activeMemberId={activeMemberId}
                            familyRole={familyRole}
                            context={context}
                            openCreateModal={openCreateModal}
                            openEditModal={openEditModal}
                            handleDeleteSaving={confirmDeleteSaving}
                            setSelectedGoal={setSelectedGoal}
                            setIsAllocateOpen={setIsAllocateOpen}
                            openEditCategoryModal={(c: any) => {
                                setEditingCategory(c);
                                setCatName(c.name);
                                setCatPercent(c.percentage);
                                setCatDesc(c.description);
                                setCatIcon(c.icon);
                                setCatColor(c.color);
                                setCatBg(c.bgColor);
                                setCatType(c.type || 'kebutuhan');
                                setIsCategoryModalOpen(true);
                            }}
                            handleClearCategoryItems={confirmClearCategoryItems}
                            handleDeleteBudgetCategory={confirmDeleteCategory}
                            canManageBudget={canManageBudget}
                            canDeleteBudget={canDeleteBudget}
                            canInputBudget={canInputBudget}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[var(--surface-card)] rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-[var(--border)]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-serif mb-8 text-[var(--text-main)]">
                            {editSaving ? 'Ubah Alokasi' : 'Buat Alokasi Baru'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Nama Sub-Kategori</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="cth. Perbaikan Rumah, Investasi Saham"
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/30"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Target (Rp)</label>
                                <input
                                    type="text"
                                    value={formatRupiah(target) || ''}
                                    onChange={(e) => setTarget(parseRupiah(e.target.value))}
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px] text-[var(--text-main)]"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Emoji</label>
                                    <input
                                        type="text"
                                        value={emoji}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        placeholder="💰"
                                        className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Jatuh Tempo (Tgl)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="31"
                                        value={dueDate || ''}
                                        onChange={(e) => setDueDate(parseInt(e.target.value))}
                                        placeholder="1-31"
                                        className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/30"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-dagang-accent text-dagang-dark rounded-2xl font-black text-[16px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-dagang-accent/20 mt-4">
                                {editSaving ? 'SIMPAN PERUBAHAN' : 'BUAT SEKARANG'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAllocateOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-[var(--surface-card)] rounded-[32px] w-full max-w-md p-8 shadow-2xl relative border border-[var(--border)]">
                        <button onClick={() => setIsAllocateOpen(false)} className="absolute right-6 top-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-black text-dagang-green mb-1">Setor ke {selectedGoal?.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-8">Tambahkan saldo alokasi dari dompet Anda.</p>
                        <form onSubmit={handleAllocateSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Sumber Dompet</label>
                                <select
                                    value={allocateWalletId}
                                    onChange={(e) => setAllocateWalletId(e.target.value)}
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none font-black text-dagang-green text-[var(--text-main)]"
                                    required
                                >
                                    <option value="" className="bg-[var(--surface-card)]">Pilih Dompet</option>
                                    {myWallets.map((w: any) => (
                                        <option key={w.id} value={w.id} className="bg-[var(--surface-card)]">{w.name} (Rp {w.balance.toLocaleString('id-ID')})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Nominal</label>
                                <input
                                    type="text"
                                    value={formatRupiah(allocateAmount) || ''}
                                    onChange={(e) => setAllocateAmount(parseRupiah(e.target.value))}
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none font-black text-[28px] text-dagang-green placeholder:text-[var(--text-muted)]/20"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-dagang-green text-white rounded-2xl font-black text-[14px] shadow-xl shadow-dagang-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                KONFIRMASI SETORAN
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
                    <div className="bg-[var(--surface-card)] rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-[var(--border)]">
                        <button onClick={() => setIsCategoryModalOpen(false)} className="absolute right-6 top-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-serif mb-6 text-[var(--text-main)]">
                            {editingCategory ? 'Edit Kategori Budget' : 'Tambah Kategori Budget'}
                        </h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const payload = {
                                name: catName,
                                percentage: catPercent,
                                description: catDesc,
                                icon: catIcon,
                                color: catColor,
                                bgColor: catBg,
                                type: catType,
                                order: budgetCategories.length + 1
                            };
                            if (editingCategory) {
                                await handleUpdateBudgetCategory(editingCategory.id, payload, isAdmin ? activeMemberId : undefined);
                            } else {
                                await handleCreateBudgetCategory(payload, isAdmin ? activeMemberId : undefined);
                            }
                            setIsCategoryModalOpen(false);
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    placeholder="cth. Kebutuhan Pokok"
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Persentase (%)</label>
                                    <input
                                        type="number"
                                        value={catPercent}
                                        onChange={(e) => setCatPercent(parseInt(e.target.value))}
                                        className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none font-bold text-[var(--text-main)]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Icon</label>
                                    <select
                                        value={catIcon}
                                        onChange={(e) => setCatIcon(e.target.value)}
                                        className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl outline-none font-bold appearance-none text-[var(--text-main)]"
                                    >
                                        <option value="ShoppingCart">Belanja</option>
                                        <option value="Coffee">Hiburan</option>
                                        <option value="Coins">Tabungan</option>
                                        <option value="ShieldCheck">Asuransi</option>
                                        <option value="Wallet">Lainnya</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Jenis Kebutuhan</label>
                                <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setCatType('kebutuhan')}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${catType === 'kebutuhan' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                                    >
                                        Kebutuhan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCatType('keinginan')}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${catType === 'keinginan' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                                    >
                                        Keinginan
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-dagang-dark text-white rounded-2xl font-black text-[14px] shadow-xl shadow-black/20 mt-4 transition-all hover:bg-black active:scale-95">
                                {editingCategory ? 'UPDATE KATEGORI' : 'TAMBAH KATEGORI'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
