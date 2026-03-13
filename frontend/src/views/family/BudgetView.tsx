import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Plus,
    TrendingUp,
    Info,
    Edit3,
    Trash2,
    X,
    ChevronDown,
    Wallet,
    Coffee,
    ShoppingCart,
    Coins,
    ShieldCheck
} from 'lucide-react';

export const BudgetView = () => {
    const context = useOutletContext<any>() || {};
    const {
        wallets = [],
        budgetCategories = [],
        handleCreateBudgetCategory,
        handleUpdateBudgetCategory,
        handleDeleteBudgetCategory,
        handleCreateSaving,
        handleUpdateSaving,
        handleDeleteSaving,
        handleAllocateToSaving
    } = context;

    const [totalBudget, setTotalBudget] = useState<number>(10000000);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState<number>(10000000);

    const [isEditingPercentages, setIsEditingPercentages] = useState(false);
    const [tempPercentages, setTempPercentages] = useState<any>({});
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [catName, setCatName] = useState('');
    const [catPercent, setCatPercent] = useState(0);
    const [catIcon, setCatIcon] = useState('ShoppingCart');
    const [catColor, setCatColor] = useState('text-blue-500');
    const [catBg, setCatBg] = useState('bg-blue-50');
    const [catDesc, setCatDesc] = useState('');

    const totalPercentage = budgetCategories.reduce((acc: number, cat: any) => acc + cat.percentage, 0);
    const isAllocationComplete = totalPercentage === 100;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllocateOpen, setIsAllocateOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('needs');
    const [editSaving, setEditSaving] = useState<any>(null);

    // Form states
    const [name, setName] = useState('');
    const [target, setTarget] = useState<number>(0);
    const [initial, setInitial] = useState<number>(0);
    const [sourceWalletId, setSourceWalletId] = useState('');
    const [allocateAmount, setAllocateAmount] = useState<number>(0);
    const [allocateWalletId, setAllocateWalletId] = useState('');

    // New fields
    const [emoji, setEmoji] = useState('💰');
    const [dueDate, setDueDate] = useState<number>(0);

    const openCreateModal = (catId?: string) => {
        setEditSaving(null);
        setName('');
        setTarget(0);
        setInitial(0);
        setSelectedCategory(catId || 'needs');
        setEmoji('💰');
        setDueDate(0);
        setIsModalOpen(true);
    };

    const openEditModal = (saving: any) => {
        setEditSaving(saving);
        setName(saving.name);
        setTarget(saving.targetAmount);
        setInitial(saving.currentBalance);
        setSelectedCategory(saving.category || 'savings');
        setEmoji(saving.emoji || '💰');
        setDueDate(saving.dueDate || 0);
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
            handleCreateSaving(name, target, initial, sourceWalletId, selectedCategory, emoji, dueDate);
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

const CategoryRow = ({ cat, context, openCreateModal, openEditModal, handleDeleteSaving, setSelectedGoal, setIsAllocateOpen, totalBudget, openEditCategoryModal, handleDeleteCategory }: any) => {
    const [showInfo, setShowInfo] = useState(false);
    const catSavings = cat.items || [];
    const allocationPercent = cat.percentage;
    const categoryBudget = (totalBudget * allocationPercent) / 100;
    const catTransactions = (context.transactions || []).filter((tx: any) =>
        tx.type === 'expense' && catSavings.some((s: any) => s.id === tx.savingId)
    );
    const totalTarget = catSavings.reduce((acc: number, s: any) => acc + s.targetAmount, 0);
    const totalUsed = catTransactions.reduce((acc: number, tx: any) => acc + tx.amount, 0);

    const progress = categoryBudget > 0 ? (totalTarget / categoryBudget) * 100 : 0;
    const usedProgress = categoryBudget > 0 ? (totalUsed / categoryBudget) * 100 : 0;

    // Map string icon name to Lucide component
    const IconComponent = (cat.icon === 'ShoppingCart' ? ShoppingCart : 
                          cat.icon === 'Coffee' ? Coffee : 
                          cat.icon === 'Coins' ? Coins : 
                          cat.icon === 'ShieldCheck' ? ShieldCheck : Wallet);

    return (
        <div className="space-y-6 bg-white/50 backdrop-blur-sm p-8 rounded-[40px] border border-black/5 shadow-sm transition-all hover:shadow-xl hover:shadow-black/[0.02]">
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className={`p-4 ${cat.bg_color} ${cat.color} rounded-2xl shadow-sm relative group`}>
                        <IconComponent className="w-6 h-6" />
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditCategoryModal(cat)} className="p-1 bg-white border border-black/5 rounded-md shadow-sm hover:text-dagang-green">
                                <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 bg-white border border-black/5 rounded-md shadow-sm hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-serif text-2xl text-dagang-dark">
                                {cat.name}
                            </h3>
                            <span className={`text-[12px] px-3 py-1 rounded-full ${cat.bg_color} ${cat.color} font-black`}>
                                {allocationPercent}%
                            </span>
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`p-1.5 rounded-full transition-all ${showInfo ? 'bg-dagang-dark text-white' : 'text-dagang-gray/40 hover:text-dagang-dark hover:bg-black/5'}`}
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        </div>
                        {showInfo ? (
                            <div className="text-[12px] text-dagang-dark font-bold bg-dagang-cream/50 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300 border border-black/5">
                                {cat.description.replace(/\(\d+%\)/, `(${allocationPercent}%)`)}
                            </div>
                        ) : (
                            <p className="text-[13px] text-dagang-gray/60 font-medium">Klik ikon "i" untuk penjelasan</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <div className="text-[11px] font-black text-dagang-gray/30 uppercase tracking-widest mb-1">Total Alokasi Baris</div>
                        <div className="text-xl font-serif text-dagang-dark">Rp {categoryBudget.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => openCreateModal(cat.id)}
                        className="w-12 h-12 bg-dagang-dark text-white rounded-2xl flex items-center justify-center hover:bg-dagang-dark/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="h-3 bg-black/5 rounded-full overflow-hidden relative shadow-inner">
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 opacity-20 ${cat.color.replace('text', 'bg')}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${cat.color.replace('text', 'bg')}`}
                        style={{ width: `${Math.min(usedProgress, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[11px] font-black text-dagang-gray/40 uppercase tracking-[0.2em] px-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cat.color.replace('text', 'bg')}`} />
                        Terpakai: Rp {totalUsed.toLocaleString()}
                    </div>
                    <span>Sisa: Rp {(categoryBudget - totalUsed).toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {catSavings.map((s: any) => {
                    const sProgress = (s.currentBalance / s.targetAmount) * 100;
                    return (
                        <div key={s.id} className="bg-white border border-black/5 rounded-3xl p-5 hover:shadow-xl hover:shadow-black/[0.03] transition-all group relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-dagang-cream/50 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                    {s.emoji || '💰'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[14px] text-dagang-dark truncate">{s.name}</h4>
                                    <div className="text-[10px] text-dagang-gray/40 font-black uppercase tracking-wider flex items-center gap-1">
                                        <Info className="w-2.5 h-2.5" /> Tgl {s.dueDate || '-'}
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(s)} className="p-1.5 text-dagang-gray hover:text-dagang-green hover:bg-dagang-green/5 rounded-lg">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteSaving(s.id)} className="p-1.5 text-dagang-gray hover:text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mb-3">
                                <div className="text-right flex-1">
                                    <div className="text-[9px] font-black text-dagang-gray/30 uppercase tracking-widest">Alokasi</div>
                                    <div className="text-[13px] font-serif font-bold">Rp {s.targetAmount.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden mb-4">
                                <div className={`h-full ${cat.color.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${Math.min(sProgress, 100)}%` }} />
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedGoal(s);
                                    setIsAllocateOpen(true);
                                }}
                                className={`w-full py-2.5 ${cat.bg} ${cat.color} opacity-80 hover:opacity-100 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest`}
                            >
                                <Plus className="w-3.5 h-3.5" /> Isi Saldo
                            </button>
                        </div>
                    );
                })}
                {catSavings.length === 0 && (
                    <div className="col-span-full py-6 border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-dagang-gray/30 hover:bg-black/[0.01] transition-colors cursor-pointer" onClick={() => openCreateModal(cat.id)}>
                        <Plus className="w-5 h-5 mb-2 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Tambah Item Baru</p>
                    </div>
                )}
            </div>
        </div>
    );
};

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-dagang-dark rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-dagang-dark/20 min-h-[300px] flex flex-col justify-center">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-dagang-accent/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-5xl font-serif mb-4">Atur Budget</h2>
                        <p className="text-white/40 text-sm md:text-base max-w-md leading-relaxed">
                            "Berikan setiap rupiah Anda sebuah tugas." Alokasikan pemasukan secara strategis.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-dagang-accent/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                        {!isEditingBudget ? (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <div className="text-[10px] font-black text-dagang-accent uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" /> PENDAPATAN BULANAN
                                    </div>
                                    <div className="text-4xl md:text-5xl font-serif text-white tracking-tighter">
                                        Rp {totalBudget.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setTempPercentages(budgetCategories.reduce((a:any, c:any) => ({...a, [c.id]: c.percentage}), {}));
                                            setIsEditingPercentages(true);
                                        }}
                                        className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10"
                                        title="Atur Persentase"
                                    >
                                        <Coins className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTempBudget(totalBudget);
                                            setIsEditingBudget(true);
                                        }}
                                        className="px-8 py-3 bg-dagang-accent text-dagang-dark rounded-2xl font-black text-[12px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-dagang-accent/20"
                                    >
                                        UBAH PEMASUKAN
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="text-[10px] font-black text-dagang-accent uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Edit3 className="w-3 h-3" /> ESTIMASI PEMASUKAN
                                </div>
                                <div className="flex flex-col md:flex-row items-stretch gap-4">
                                    <div className="relative flex-1">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-serif text-white/40 text-2xl">Rp</span>
                                        <input
                                            type="number"
                                            value={tempBudget}
                                            onChange={(e) => setTempBudget(parseFloat(e.target.value))}
                                            className="w-full bg-white/10 border-none rounded-[24px] py-6 pl-16 pr-6 text-3xl font-serif text-white outline-none focus:ring-2 focus:ring-dagang-accent/20 transition-all font-black"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setTotalBudget(tempBudget);
                                                setIsEditingBudget(false);
                                            }}
                                            className="px-10 py-5 bg-dagang-accent text-dagang-dark rounded-[24px] font-black text-[14px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            SIMPAN
                                        </button>
                                        <button
                                            onClick={() => setIsEditingBudget(false)}
                                            className="px-10 py-5 bg-white/5 text-white/60 rounded-[24px] font-black text-[14px] hover:bg-white/10 transition-all"
                                        >
                                            BATAL
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!isAllocationComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900">Alokasi Budget Belum Selesai</h4>
                            <p className="text-sm text-amber-700">Total alokasi saat ini {totalPercentage}%. Sesuaikan agar menjadi 100%.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setTempPercentages(budgetCategories.reduce((a:any, c:any) => ({...a, [c.id]: c.percentage}), {}));
                            setIsEditingPercentages(true);
                        }}
                        className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all"
                    >
                        ATUR SEKARANG
                    </button>
                </div>
            )}

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setCatName('');
                        setCatPercent(0);
                        setCatDesc('');
                        setCatIcon('ShoppingCart');
                        setCatColor('text-blue-500');
                        setCatBg('bg-blue-50');
                        setIsCategoryModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-dagang-dark text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" /> TAMBAH KATEGORI BUDGET
                </button>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {budgetCategories.map((cat: any) => (
                    <CategoryRow 
                        key={cat.id} 
                        cat={cat} 
                        context={context} 
                        openCreateModal={openCreateModal} 
                        openEditModal={openEditModal} 
                        handleDeleteSaving={handleDeleteSaving} 
                        setSelectedGoal={setSelectedGoal} 
                        setIsAllocateOpen={setIsAllocateOpen} 
                        totalBudget={totalBudget} 
                        openEditCategoryModal={(c: any) => {
                            setEditingCategory(c);
                            setCatName(c.name);
                            setCatPercent(c.percentage);
                            setCatDesc(c.description);
                            setCatIcon(c.icon);
                            setCatColor(c.color);
                            setCatBg(c.bg_color);
                            setIsCategoryModalOpen(true);
                        }}
                        handleDeleteCategory={handleDeleteBudgetCategory}
                    />
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 text-dagang-gray hover:text-dagang-dark rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-serif mb-8 text-dagang-dark">
                            {editSaving ? 'Ubah Alokasi' : 'Buat Alokasi Baru'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Kategori Utama</label>
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all appearance-none font-bold text-[15px]"
                                    >
                                        {budgetCategories.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dagang-gray pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Nama Sub-Kategori</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="cth. Perbaikan Rumah, Investasi Saham"
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Target (Rp)</label>
                                    <input
                                        type="number"
                                        value={target || ''}
                                        onChange={(e) => setTarget(parseFloat(e.target.value))}
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                        required
                                    />
                                </div>
                                {!editSaving && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Setoran Awal (Rp)</label>
                                        <input
                                            type="number"
                                            value={initial || ''}
                                            onChange={(e) => setInitial(parseFloat(e.target.value))}
                                            className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Emoji</label>
                                    <input
                                        type="text"
                                        value={emoji}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        placeholder="💰, 🏠, 🍔"
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Jatuh Tempo (Tgl)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="31"
                                        value={dueDate || ''}
                                        onChange={(e) => setDueDate(parseInt(e.target.value))}
                                        placeholder="1-31"
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                    />
                                </div>
                            </div>

                            {!editSaving && initial > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-green uppercase tracking-widest pl-1 flex items-center gap-2">
                                        <Wallet className="w-3 h-3" /> Ambil Dari Dompet
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={sourceWalletId}
                                            onChange={(e) => setSourceWalletId(e.target.value)}
                                            className="w-full px-5 py-4 bg-dagang-green/5 border-2 border-dagang-green/20 rounded-2xl outline-none font-black text-dagang-green appearance-none"
                                            required
                                        >
                                            <option value="">Pilih Dompet</option>
                                            {wallets.map((w: any) => (
                                                <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dagang-green pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full py-4 bg-dagang-accent text-dagang-dark rounded-2xl font-black text-[16px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-dagang-accent/20 mt-4">
                                {editSaving ? 'SIMPAN PERUBAHAN' : 'BUAT SEKARANG'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAllocateOpen && (
                <div className="fixed inset-0 bg-dagang-green/10 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative border border-dagang-green/10">
                        <button onClick={() => setIsAllocateOpen(false)} className="absolute right-6 top-6 p-2 text-dagang-gray hover:text-dagang-dark rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-black text-dagang-green mb-1">Setor ke {selectedGoal?.name}</h3>
                        <p className="text-sm text-dagang-gray mb-8">Tambahkan saldo alokasi dari dompet Anda.</p>

                        <form onSubmit={handleAllocateSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest pl-1">Sumber Dompet</label>
                                <select
                                    value={allocateWalletId}
                                    onChange={(e) => setAllocateWalletId(e.target.value)}
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-black text-dagang-green"
                                    required
                                >
                                    <option value="">Pilih Dompet</option>
                                    {wallets.map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest pl-1">Nominal</label>
                                <input
                                    type="number"
                                    value={allocateAmount || ''}
                                    onChange={(e) => setAllocateAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-black text-[28px] text-dagang-green"
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

            {isEditingPercentages && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setIsEditingPercentages(false)} className="absolute right-6 top-6 p-2 text-dagang-gray hover:text-dagang-dark rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-serif mb-2 text-dagang-dark">Atur Strategi Budget</h3>
                        <p className="text-sm text-dagang-gray mb-8">Tentukan porsi budget untuk setiap kategori agar totalnya 100%.</p>

                        <div className="space-y-6">
                            {budgetCategories.map((cat: any) => (
                                <div key={cat.id} className="space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-dagang-dark">{cat.name}</span>
                                        <span className={`${cat.color} font-black`}>{(tempPercentages as any)[cat.id] ?? cat.percentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={(tempPercentages as any)[cat.id] ?? cat.percentage}
                                        onChange={(e) => setTempPercentages({
                                            ...tempPercentages,
                                            [cat.id]: parseInt(e.target.value)
                                        })}
                                        className="w-full h-2 bg-dagang-cream rounded-lg appearance-none cursor-pointer accent-dagang-dark"
                                    />
                                </div>
                            ))}

                            <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                                <div className="text-sm">
                                    <div className="text-dagang-gray uppercase text-[10px] font-black tracking-widest">Total Alokasi</div>
                                    <div className={`text-2xl font-serif ${(() => {
                                        const base = budgetCategories.reduce((a: any, c: any) => ({ ...a, [c.id]: c.percentage }), {});
                                        const merged = { ...base, ...tempPercentages };
                                        const total = Object.values(merged).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                                        return total === 100 ? 'text-dagang-green' : 'text-red-500';
                                    })()}`}>
                                        {(() => {
                                            const base = budgetCategories.reduce((a: any, c: any) => ({ ...a, [c.id]: c.percentage }), {});
                                            const merged = { ...base, ...tempPercentages };
                                            return Object.values(merged).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                                        })()}%
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsEditingPercentages(false)}
                                        className="px-6 py-3 bg-dagang-cream text-dagang-gray rounded-xl font-bold text-xs"
                                    >
                                        BATAL
                                    </button>
                                    <button
                                        onClick={async () => {
                                            for (const catId in tempPercentages) {
                                                const cat = budgetCategories.find((c: any) => c.id === catId);
                                                if (cat) {
                                                    await handleUpdateBudgetCategory(catId, { ...cat, percentage: tempPercentages[catId] });
                                                }
                                            }
                                            setIsEditingPercentages(false);
                                            setTempPercentages({});
                                        }}
                                        className="px-8 py-3 bg-dagang-dark text-white rounded-xl font-bold text-xs shadow-lg shadow-black/10"
                                    >
                                        SIMPAN STRATEGI
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setIsCategoryModalOpen(false)} className="absolute right-6 top-6 p-2 text-dagang-gray hover:text-dagang-dark rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-serif mb-6 text-dagang-dark">
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
                                order: budgetCategories.length + 1
                            };
                            if (editingCategory) {
                                await handleUpdateBudgetCategory(editingCategory.id, payload);
                            } else {
                                await handleCreateBudgetCategory(payload);
                            }
                            setIsCategoryModalOpen(false);
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    placeholder="cth. Kebutuhan Pokok"
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-bold"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Persentase (%)</label>
                                    <input
                                        type="number"
                                        value={catPercent}
                                        onChange={(e) => setCatPercent(parseInt(e.target.value))}
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Icon</label>
                                    <select
                                        value={catIcon}
                                        onChange={(e) => setCatIcon(e.target.value)}
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-bold appearance-none"
                                    >
                                        <option value="ShoppingCart">Shopping</option>
                                        <option value="Coffee">Coffee</option>
                                        <option value="Coins">Coins</option>
                                        <option value="ShieldCheck">Guard</option>
                                        <option value="Wallet">Wallet</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-dagang-gray uppercase tracking-widest pl-1">Deskripsi</label>
                                <textarea
                                    value={catDesc}
                                    onChange={(e) => setCatDesc(e.target.value)}
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl outline-none font-bold min-h-[80px]"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-dagang-dark text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all">
                                {editingCategory ? 'SIMPAN PERUBAHAN' : 'BUAT KATEGORI'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
