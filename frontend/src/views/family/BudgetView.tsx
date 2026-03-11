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

interface CategoryConfig {
    id: string;
    label: string;
    description: string;
    color: string;
    bg: string;
    icon: any;
}

const CATEGORIES: CategoryConfig[] = [
    {
        id: 'needs',
        label: 'Kebutuhan',
        description: 'Biaya rutin bulanan yang wajib dipenuhi (50%)',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        icon: ShoppingCart
    },
    {
        id: 'wants',
        label: 'Keinginan',
        description: 'Pengeluaran gaya hidup & hiburan (30%)',
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        icon: Coffee
    },
    {
        id: 'savings',
        label: 'Tabungan',
        description: 'Investasi & dana untuk masa depan (10%)',
        color: 'text-dagang-green',
        bg: 'bg-dagang-green/5',
        icon: Coins
    },
    {
        id: 'emergency',
        label: 'Dana Darurat',
        description: 'Cadangan dana untuk keadaan tak terduga (10%)',
        color: 'text-red-500',
        bg: 'bg-red-50',
        icon: ShieldCheck
    }
];

export const BudgetView = () => {
    const context = useOutletContext<any>() || {};
    const {
        wallets = [],
        savings = [],
        handleCreateSaving,
        handleUpdateSaving,
        handleDeleteSaving,
        handleAllocateToSaving
    } = context;

    const [totalBudget, setTotalBudget] = useState<number>(10000000);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState<number>(10000000);

    const [categoryAllocations, setCategoryAllocations] = useState({
        needs: 50,
        wants: 30,
        savings: 10,
        emergency: 10
    });

    const [isEditingPercentages, setIsEditingPercentages] = useState(false);
    const [tempPercentages, setTempPercentages] = useState(categoryAllocations);

    const totalPercentage = Object.values(categoryAllocations).reduce((a, b) => a + b, 0);
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

    const renderCategoryGroup = (cat: CategoryConfig) => {
        const catSavings = savings.filter((s: any) => s.category === cat.id);
        const allocationPercent = (categoryAllocations as any)[cat.id];
        const categoryBudget = (totalBudget * allocationPercent) / 100;
        const catTransactions = (context.transactions || []).filter((tx: any) =>
            tx.type === 'expense' && savings.some((s: any) => s.id === tx.savingId && s.category === cat.id)
        );
        const totalTarget = catSavings.reduce((acc: number, s: any) => acc + s.targetAmount, 0);
        const totalUsed = catTransactions.reduce((acc: number, tx: any) => acc + tx.amount, 0);

        const progress = categoryBudget > 0 ? (totalTarget / categoryBudget) * 100 : 0;
        const usedProgress = categoryBudget > 0 ? (totalUsed / categoryBudget) * 100 : 0;

        return (
            <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 ${cat.bg} ${cat.color} rounded-xl shadow-inner`}>
                            <cat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-dagang-dark flex items-center gap-2">
                                {cat.label}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} font-black`}>
                                    {allocationPercent}%
                                </span>
                            </h3>
                            <p className="text-[11px] text-dagang-gray/60 font-medium">{cat.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-dagang-gray/30 uppercase">Alokasi</div>
                            <div className="text-sm font-serif text-dagang-dark">Rp {categoryBudget.toLocaleString()}</div>
                        </div>
                        <button
                            onClick={() => openCreateModal(cat.id)}
                            className="p-2 bg-dagang-cream rounded-lg text-dagang-gray hover:text-dagang-green transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="h-2 bg-black/5 rounded-full overflow-hidden relative">
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 opacity-20 ${cat.id === 'savings' ? 'bg-dagang-green' : (cat.id === 'emergency' ? 'bg-red-500' : (cat.id === 'needs' ? 'bg-blue-500' : 'bg-amber-500'))}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${cat.id === 'savings' ? 'bg-dagang-green' : (cat.id === 'emergency' ? 'bg-red-500' : (cat.id === 'needs' ? 'bg-blue-500' : 'bg-amber-500'))}`}
                        style={{ width: `${Math.min(usedProgress, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-dagang-gray/40 uppercase tracking-widest px-1">
                    <span>Terpakai: Rp {totalUsed.toLocaleString()}</span>
                    <span>Batas: Rp {categoryBudget.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catSavings.map((s: any) => {
                        const sProgress = (s.currentBalance / s.targetAmount) * 100;
                        const sUsed = (context.transactions || []).filter((tx: any) => tx.savingId === s.id && tx.type === 'expense').reduce((a: number, b: any) => a + b.amount, 0);
                        return (
                            <div key={s.id} className="bg-white border border-black/5 rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-dagang-cream/50 rounded-xl flex items-center justify-center text-xl shadow-inner">
                                        {s.emoji || '💰'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-dagang-dark truncate">{s.name}</h4>
                                        <div className="text-[10px] text-dagang-gray/40 font-bold uppercase tracking-wider">
                                            Jatuh Tempo: {s.dueDate || '-'}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(s)} className="p-1.5 text-dagang-gray hover:text-dagang-green hover:bg-dagang-green/5 rounded-md">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteSaving(s.id)} className="p-1.5 text-dagang-gray hover:text-red-500 hover:bg-red-50 rounded-md">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <div className="text-[10px] font-black text-dagang-gray/30 uppercase tracking-widest">Digunakan</div>
                                        <div className="text-sm font-serif">Rp {sUsed.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-dagang-gray/30 uppercase tracking-widest">Alokasi</div>
                                        <div className="text-sm font-serif">Rp {s.targetAmount.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="h-1 bg-black/5 rounded-full overflow-hidden mb-4">
                                    <div className={`h-full ${cat.color.replace('text', 'bg')} opacity-40`} style={{ width: `${Math.min(sProgress, 100)}%` }} />
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedGoal(s);
                                        setIsAllocateOpen(true);
                                    }}
                                    className="w-full py-2 bg-dagang-cream hover:bg-dagang-green/5 text-dagang-gray hover:text-dagang-green text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <TrendingUp className="w-3.5 h-3.5" /> NABUNG
                                </button>
                            </div>
                        );
                    })}
                    {catSavings.length === 0 && (
                        <div className="col-span-1 md:col-span-2 py-8 border-2 border-dashed border-black/5 rounded-2xl flex flex-col items-center justify-center text-dagang-gray/40">
                            <Info className="w-6 h-6 mb-2 opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-widest">Belum ada alokasi</p>
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
                                            setTempPercentages(categoryAllocations);
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
                            setTempPercentages(categoryAllocations);
                            setIsEditingPercentages(true);
                        }}
                        className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all"
                    >
                        ATUR SEKARANG
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {CATEGORIES.map(renderCategoryGroup)}
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
                                        {CATEGORIES.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
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
                                    onChange={(e) => setAllocateAmount(parseFloat(e.target.value))}
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
                            {CATEGORIES.map(cat => (
                                <div key={cat.id} className="space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-dagang-dark">{cat.label}</span>
                                        <span className={`${cat.color} font-black`}>{(tempPercentages as any)[cat.id]}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={(tempPercentages as any)[cat.id]}
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
                                    <div className={`text-2xl font-serif ${Object.values(tempPercentages).reduce((a, b: any) => a + b, 0) === 100 ? 'text-dagang-green' : 'text-red-500'}`}>
                                        {Object.values(tempPercentages).reduce((a, b: any) => a + b, 0)}%
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
                                        onClick={() => {
                                            setCategoryAllocations(tempPercentages);
                                            setIsEditingPercentages(false);
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
        </div>
    );
};
