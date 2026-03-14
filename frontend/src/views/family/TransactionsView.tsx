import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Search,
    Target,
    Calculator,
    Calendar,
    ChevronDown,
    X,
    Trash2,
    Check,
    Pencil,
    Camera,
    Sparkles
} from 'lucide-react';
import { Transaction, Wallet as WalletModel } from '../../models';
import { Calculator as CalculatorComp } from '../../components/Calculator';
import { ReceiptScannerModal } from '../../components/family/ReceiptScannerModal';

interface TransactionsViewProps {
    transactions: Transaction[];
    wallets: WalletModel[];
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
    handleDeleteTransaction: (id: string) => void;
    handleUpdateTransaction: (id: string, tx: any) => void;
    savings: any[];
    familyMembers?: any[];
    categories?: string[];
    incomeCategories?: any[];
    budgetCategories?: any[];
}

/* --- Constants & Helpers --- */

const incomeCategories = [
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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-6 py-3.5 bg-white border border-black/5 rounded-2xl text-[12px] font-bold transition-all shadow-sm hover:bg-dagang-cream/50 ${isOpen ? 'ring-2 ring-dagang-green/20' : ''}`}
            >
                {Icon && <Icon className="w-4 h-4 text-dagang-gray/40" />}
                <span className={value === 'all' ? 'text-dagang-gray/60' : 'text-dagang-dark'}>
                    {selectedOption ? selectedOption.label : label}
                </span>
                <ChevronDown className={`w-4 h-4 text-dagang-gray/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 md:right-0 md:left-auto mt-3 min-w-[240px] bg-white rounded-[24px] shadow-2xl shadow-black/10 border border-black/5 z-[151] py-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div
                            onClick={() => { onChange('all'); setIsOpen(false); }}
                            className={`px-6 py-3.5 text-[12px] font-bold cursor-pointer transition-all mx-2 rounded-xl mb-1 ${value === 'all' ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20' : 'hover:bg-dagang-cream/50 text-dagang-gray/60'}`}
                        >
                            {label}
                        </div>
                        {options.map(o => (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setIsOpen(false); }}
                                className={`px-6 py-3.5 text-[12px] font-bold cursor-pointer transition-all mx-2 rounded-xl mb-1 ${value === o.value ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20' : 'hover:bg-dagang-cream/50 text-dagang-dark'}`}
                            >
                                {o.label}
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
        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-white shadow-xl shadow-black/5' : 'hover:bg-white/50'}`}
    >
        <div className={`p-2 rounded-xl transition-all ${active ? 'bg-dagang-green text-white' : 'bg-dagang-cream text-dagang-gray/40'}`}>
            <Icon className="w-5 h-5" />
        </div>
        {active && <span className={`text-sm font-black uppercase tracking-widest ${color}`}>{label}</span>}
    </button>
);

const CategorySelector = ({ value, savingId, onChange, savings, type, incomeCategories, budgetCategories }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const groups = (budgetCategories || []).map((c: any) => c.id);
    const labels: any = (budgetCategories || []).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.name }), {});
    const groupColors: any = (budgetCategories || []).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.color }), {});
    const groupBgColors: any = (budgetCategories || []).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.bgColor }), {});

    const filteredSavings = (savings || []).filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );


    const selectedItem = savingId ? (savings || []).find((s: any) => s.id === savingId) : null;
    const isIncome = type === 'income';
    const displayText = selectedItem ? `${selectedItem.emoji} ${selectedItem.name}` : (value || (isIncome ? 'Pilih sumber pemasukan...' : 'Pilih kategori...'));

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 bg-dagang-cream/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-dagang-cream/50 transition-all"
            >
                <span className={`font-bold ${!value && !savingId ? 'text-dagang-gray/40' : 'text-dagang-dark'}`}>
                    {displayText}
                </span>
                <ChevronDown className={`w-5 h-5 text-dagang-gray/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-black/5 z-[220] overflow-hidden animate-in slide-in-from-top-2 duration-200 flex flex-col max-h-[400px]">
                        <div className="p-4 border-b border-black/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/30" />
                                <input
                                    type="text"
                                    placeholder="Cari kategori..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none text-sm font-bold"
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
                                    {(incomeCategories || []).filter((cat: any) => cat.name.toLowerCase().includes(search.toLowerCase())).map((cat: any) => (
                                        <div
                                            key={cat.name}
                                            onClick={() => {
                                                onChange(cat.name, '');
                                                setIsOpen(false);
                                            }}
                                            className="px-6 py-3 flex items-center justify-between hover:bg-dagang-cream/30 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{cat.emoji}</span>
                                                <span className="text-sm font-bold text-dagang-dark">{cat.name}</span>
                                            </div>
                                            {value === cat.name && !savingId && <Check className="w-4 h-4 text-dagang-green" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Budget Goals */}
                                    {groups.map((groupId: string) => {
                                        const groupItems = filteredSavings.filter((s: any) => s.budgetCategoryId === groupId);
                                        if (groupItems.length === 0) return null;
                                        
                                        const colorClass = groupColors[groupId] || 'text-dagang-gray';
                                        const bgColorClass = groupBgColors[groupId] || 'bg-dagang-cream/50';

                                        return (
                                            <div key={groupId} className="mb-2">
                                                <div className={`px-6 py-2 text-[10px] font-black tracking-widest ${bgColorClass.replace('bg-', 'bg-').replace('/50', '/20')} ${colorClass}`}>
                                                    BUDGET: {labels[groupId].toUpperCase()}
                                                </div>
                                                {groupItems.map((item: any) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => {
                                                            onChange(item.name, item.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="px-6 py-3 flex items-center justify-between hover:bg-dagang-cream/30 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg">{item.emoji || '💰'}</span>
                                                            <span className="text-sm font-bold text-dagang-dark">{item.name}</span>
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
    onOpenCalculator,
    incomeCategories,
    budgetCategories
}: any) => {
    if (!isOpen) return null;

    const handleSubmit = async () => {

        if (isEditing && editingTxId) {
            try {
                await handleUpdateTransaction(editingTxId, newTx);
                onClose();
            } catch (err: any) {
                console.error("[ERROR] handleUpdateTransaction failed", err);
                alert("Gagal menyimpan perubahan: " + err.message);
            }
        } else {
            handleCreateTransaction();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 mobile:p-4">
            <div className="absolute inset-0 bg-dagang-dark/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[500px] max-h-[92vh] overflow-y-auto rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                <div className="p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-dagang-dark">{isEditing ? 'Ubah Transaksi' : 'Transaksi Baru'}</h3>
                        <button onClick={onClose} className="p-2.5 bg-dagang-cream/50 rounded-xl hover:bg-dagang-cream transition-all">
                            <X className="w-5 h-5 text-dagang-gray" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-1.5 bg-dagang-cream/30 rounded-2xl w-fit mx-auto">
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
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/30" />
                                <input
                                    type="date"
                                    value={newTx.date}
                                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Jumlah</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-dagang-dark/20 text-xs text-dagang-green">Rp</div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newTx.amount || ''}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseFloat(e.target.value));
                                            setNewTx({ ...newTx, amount: isNaN(val) ? 0 : val });
                                        }}
                                        placeholder="0"
                                        className="w-full pl-11 pr-11 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none font-black text-lg text-dagang-green"
                                    />
                                    <button 
                                        onClick={onOpenCalculator}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-dagang-green rounded-lg shadow-sm hover:scale-110 transition-all active:scale-90"
                                    >
                                        <Calculator className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">
                                {activeTab === 'expense' || activeTab === 'transfer' ? 'Dari Dompet' : 'Ke Dompet'}
                            </label>
                            <select
                                value={newTx.walletId}
                                onChange={(e) => setNewTx({ ...newTx, walletId: e.target.value })}
                                className="w-full px-4 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none font-bold text-sm appearance-none"
                            >
                                <option value="">Pilih Dompet...</option>
                                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">
                                {activeTab === 'transfer' ? 'Ke Dompet' : 'Kategori'}
                            </label>
                            {activeTab === 'transfer' ? (
                                <select
                                    value={newTx.toWalletId}
                                    onChange={(e) => setNewTx({ ...newTx, toWalletId: e.target.value })}
                                    className="w-full px-4 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none font-bold text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    {wallets.filter((w: any) => w.id !== newTx.walletId).map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <CategorySelector
                                    value={newTx.category}
                                    savingId={newTx.savingId}
                                    savings={savings}
                                    type={newTx.type}
                                    incomeCategories={incomeCategories}
                                    budgetCategories={budgetCategories}
                                    onChange={(cat: string, sId: string) => setNewTx({ ...newTx, category: cat, savingId: sId })}
                                />
                            )}
                        </div>

                        <div className="mobile:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Catatan</label>
                            <input
                                type="text"
                                value={newTx.description}
                                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                placeholder="cth. Kopi Kenangan"
                                className="w-full px-4 py-3 bg-dagang-cream/30 border-none rounded-xl outline-none font-bold text-sm"
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

const BulkTransactionModal = ({ isOpen, onClose, wallets, savings, handleBulkCreateTransactions, budgetCategories }: any) => {
    const [rows, setRows] = useState<any[]>([
        { date: new Date().toISOString().split('T')[0], amount: 0, type: 'expense', walletId: wallets?.[0]?.id || '', category: '', savingId: '', description: '' },
    ]);

    useEffect(() => {
        if (isOpen && wallets.length > 0 && !rows[0].walletId) {
            setRows([{ ...rows[0], walletId: wallets[0].id }]);
        }
    }, [isOpen, wallets]);

    if (!isOpen) return null;

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, { ...lastRow, amount: 0, description: '', category: '', savingId: '' }]);
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
        }
        setRows(newRows);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 mobile:p-4">
            <div className="absolute inset-0 bg-dagang-dark/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#F9FAFB] w-full max-w-[1000px] max-h-[92vh] overflow-y-auto rounded-[32px] mobile:rounded-[48px] shadow-2xl animate-in fade-in zoom-in-95 duration-500 custom-scrollbar">
                <div className="p-4 mobile:p-10">
                    <div className="flex items-center justify-between mb-6 mobile:mb-10">
                        <div>
                            <h3 className="text-xl mobile:text-[28px] font-black text-dagang-dark tracking-tight">Input Transaksi Massal</h3>
                            <p className="text-dagang-gray/50 text-[10px] mobile:text-sm mt-1">Gunakan scroll/geser ke samping untuk melihat semua kolom.</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white border border-black/5 rounded-xl hover:bg-dagang-cream transition-all shadow-sm">
                            <X className="w-5 h-5 text-dagang-gray" />
                        </button>
                    </div>

                    <div className="bg-white rounded-[24px] mobile:rounded-[32px] border border-black/5 overflow-hidden shadow-sm mb-6 mobile:mb-10">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em] bg-dagang-cream/10">
                                        <th className="w-14 px-4 py-4" />
                                        <th className="px-4 py-4 text-left">Tanggal</th>
                                        <th className="px-4 py-4 text-left">Jumlah</th>
                                        <th className="px-4 py-4 text-left">Tipe</th>
                                        <th className="px-4 py-4 text-left">Dompet</th>
                                        <th className="px-4 py-4 text-left">Kategori / Ke</th>
                                        <th className="px-4 py-4 text-left">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-dagang-cream/10 transition-colors">
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
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={row.amount || ''}
                                                    onChange={(e) => updateRow(idx, 'amount', parseFloat(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-none p-0 text-xs font-black outline-none placeholder:text-dagang-gray/20 text-dagang-green"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.type}
                                                    onChange={(e) => updateRow(idx, 'type', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer"
                                                >
                                                    <option value="expense">Keluar</option>
                                                    <option value="income">Masuk</option>
                                                    <option value="transfer">Pindah</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.walletId}
                                                    onChange={(e) => updateRow(idx, 'walletId', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer"
                                                >
                                                    <option value="">Pilih...</option>
                                                    {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.type === 'transfer' ? (
                                                    <select
                                                        value={row.toWalletId}
                                                        onChange={(e) => updateRow(idx, 'toWalletId', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer"
                                                    >
                                                        <option value="">Pilih...</option>
                                                        {wallets.filter((w: any) => w.id !== row.walletId).map((w: any) => (
                                                            <option key={w.id} value={w.id}>{w.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={row.savingId || row.category}
                                                        onChange={(e) => {
                                                            const isRowIncome = row.type === 'income';
                                                            if (isRowIncome) {
                                                                const cat = incomeCategories.find(c => c.name === e.target.value);
                                                                updateRow(idx, 'category', cat?.name || '');
                                                                updateRow(idx, 'savingId', '');
                                                            } else {
                                                                const s = savings.find((s: any) => s.id === e.target.value);
                                                                updateRow(idx, 'category', s?.name || '');
                                                                updateRow(idx, 'savingId', s?.id || '');
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none cursor-pointer"
                                                    >
                                                        <option value="">Pilih...</option>
                                                        {row.type === 'income' ? (
                                                            incomeCategories.map((c: any) => (
                                                                <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                                                            ))
                                                        ) : (
                                                            budgetCategories.map((cat: any) => (
                                                                <optgroup key={cat.id} label={cat.name.toUpperCase()}>
                                                                    {(savings || []).filter((s: any) => s.budgetCategoryId === cat.id).map((s: any) => (
                                                                        <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                                                                    ))}
                                                                </optgroup>
                                                            ))
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
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none placeholder:text-dagang-gray/20"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col mobile:flex-row items-center gap-4 mobile:justify-between">
                        <button
                            onClick={addRow}
                            className="w-full mobile:w-auto px-8 py-3.5 bg-white border border-black/5 rounded-2xl text-[13px] font-bold text-dagang-dark hover:bg-dagang-cream/50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5 text-dagang-green" /> Tambah Baris
                        </button>
                        <button
                            onClick={() => {
                                const invalid = rows.some(r => !r.walletId || r.amount <= 0 || (r.type === 'transfer' && !r.toWalletId));
                                if (invalid) {
                                    alert('Pastikan semua baris sudah mengisi data dengan benar.');
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

const TransactionItem = ({
    transaction: tx,
    wallets,
    expanded,
    onToggle,
    onEdit,
    onDelete
}: {
    transaction: Transaction,
    wallets: WalletModel[],
    expanded: boolean,
    onToggle: () => void,
    onEdit: (tx: Transaction) => void,
    onDelete: (id: string) => void
}) => {
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const isSaving = tx.type === 'saving';

    const wallet = wallets.find(w => w.id === tx.walletId);
    const toWallet = isTransfer ? wallets.find(w => w.id === tx.toWalletId) : null;

    return (
        <div className={`bg-white rounded-[32px] border border-black/5 overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'shadow-2xl shadow-black/5' : 'hover:shadow-xl hover:shadow-black/5'}`}>
            <div
                className="p-5 md:p-6 flex items-center justify-between cursor-pointer group"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
            >
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isIncome ? 'bg-green-50 text-dagang-green' :
                        isTransfer ? 'bg-blue-50 text-blue-500' :
                        isSaving ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                    }`}>
                        {isIncome ? <TrendingUp className="w-6 h-6" /> :
                         isTransfer ? <ArrowRightLeft className="w-6 h-6" /> :
                         isSaving ? <Target className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h4 className="text-[15px] font-bold text-dagang-dark leading-snug">{tx.description}</h4>
                            {tx.user?.fullName && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-dagang-dark/5 rounded-full border border-black/5" title={`Dicatat oleh ${tx.user.fullName}`}>
                                    <div className="w-4 h-4 rounded-full bg-dagang-green/20 flex items-center justify-center text-[9px] font-black text-dagang-green">
                                        {tx.user.fullName[0].toUpperCase()}
                                    </div>
                                    <span className="text-[9px] font-bold text-dagang-gray/60 uppercase tracking-tighter">{tx.user.fullName.split(' ')[0]}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-dagang-gray opacity-30">
                                {tx.category || (isSaving ? 'Tabungan' : 'Lainnya')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-[17px] font-black tracking-tight ${isIncome ? 'text-dagang-green' : isSaving ? 'text-amber-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'} Rp {tx.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <div className="text-[10px] font-bold text-dagang-gray opacity-20 uppercase tracking-wider">{tx.type}</div>
                        <ChevronDown className={`w-3 h-3 text-dagang-gray opacity-20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-6 pt-2 border-t border-black/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-[11px] font-bold py-3 border-b border-black/[0.03]">
                            <span className="text-dagang-gray opacity-40 uppercase tracking-widest">DARI</span>
                            <span className="text-dagang-dark">{wallet?.name || '-'}</span>
                        </div>
                        {isTransfer && (
                            <div className="flex items-center justify-between text-[11px] font-bold py-3 border-b border-black/[0.03]">
                                <span className="text-dagang-gray opacity-40 uppercase tracking-widest">KE</span>
                                <span className="text-dagang-dark">{toWallet?.name || '-'}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] font-bold py-3 border-b border-black/[0.03]">
                            <span className="text-dagang-gray opacity-40 uppercase tracking-widest">KATEGORI</span>
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-dagang-cream/30 rounded-md">
                                    <Target className="w-3 h-3 text-dagang-gray opacity-30" />
                                </span>
                                <span className="text-dagang-dark">{tx.category || 'Tabungan'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold py-3 border-b border-black/[0.03]">
                            <span className="text-dagang-gray opacity-40 uppercase tracking-widest">TANGGAL</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-dagang-gray opacity-20" />
                                <span className="text-dagang-dark">
                                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold py-3 border-b border-black/[0.03]">
                            <span className="text-dagang-gray opacity-40 uppercase tracking-widest">DICATAT OLEH</span>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-dagang-dark/5 flex items-center justify-center text-[10px] font-bold text-dagang-dark">
                                    {tx.user?.fullName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-dagang-dark">{tx.user?.fullName || 'Sistem / Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => onEdit(tx)}
                            className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-dagang-gray hover:bg-dagang-cream/50 transition-all active:scale-95"
                        >
                            <Pencil className="w-4 h-4" /> UBAH
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Yakin kamu akan menghapus transaksi ini? Dana akan dikembalikan ke dompet dan budget.')) {
                                    onDelete(tx.id);
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-3 py-4 bg-red-50/50 border border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-100 transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> HAPUS
                        </button>
                    </div>
                </div>
            )}
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
    savings = [],
    familyMembers = [],
    budgetCategories = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterWallet, setFilterWallet] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

    const categoryOptions = useMemo(() => {
        const budgetOpts = budgetCategories.map(bc => ({ label: bc.name, value: bc.id }));
        const incomeOpts = incomeCategories.map(ic => ({ label: ic.name, value: ic.name }));

        if (filterType === 'income') return incomeOpts;
        if (filterType === 'expense' || filterType === 'transfer') return budgetOpts;
        
        // For 'all', combine and add prefixes to avoid confusion
        return [
            ...budgetCategories.map(bc => ({ label: `Budget: ${bc.name}`, value: bc.id })),
            ...incomeCategories.map(ic => ({ label: `Masuk: ${ic.name}`, value: ic.name }))
        ];
    }, [filterType, budgetCategories]);

    useEffect(() => {
        if (filterCategory === 'all') return;
        const isValid = categoryOptions.some(opt => opt.value === filterCategory);
        if (!isValid) setFilterCategory('all');
    }, [filterType, categoryOptions, filterCategory]);

    const [isEditing, setIsEditing] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || tx.type === filterType;
            const matchesWallet = filterWallet === 'all' || tx.walletId === filterWallet;
            
            let matchesCategory = true;
            if (filterCategory !== 'all') {
                if (tx.type === 'income') {
                    matchesCategory = tx.category === filterCategory;
                } else {
                    // expense, saving, or transfer linked to a saving goal
                    const saving = savings.find(s => s.id === tx.savingId);
                    matchesCategory = saving?.budgetCategoryId === filterCategory;
                }
            }

            return matchesSearch && matchesType && matchesWallet && matchesCategory;
        });
    }, [transactions, searchQuery, filterType, filterWallet, filterCategory, savings]);

    // Grouping by Date
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};
        filteredTransactions.forEach(tx => {
            const dateStr = new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(tx);
        });
        return groups;
    }, [filteredTransactions]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header with Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-h2 font-heading leading-tight text-dagang-dark">Transaksi</h2>
                    <p className="text-body-s text-dagang-gray mt-1">Uangmu lari ke mana aja?</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-6 py-3.5 bg-white border border-black/5 rounded-2xl text-[13px] font-bold text-dagang-gray hover:bg-dagang-cream/50 transition-all flex items-center gap-3 shadow-sm"
                    >
                        <Calculator className="w-5 h-5 text-dagang-accent" /> Tambah Banyak
                    </button>
                    <button
                        onClick={() => setIsScannerModalOpen(true)}
                        className="px-6 py-3.5 bg-white border border-dagang-accent/20 rounded-2xl text-[13px] font-bold text-dagang-accent hover:bg-dagang-accent/5 transition-all flex items-center gap-3 shadow-sm group"
                    >
                        <div className="relative">
                            <Camera className="w-5 h-5" />
                            <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-dagang-accent animate-pulse" />
                        </div>
                        Scan Struk AI
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditingTxId(null);
                            // Ensure FamilyDashboard gets fresh state if needed via NEW tx initialization logic
                            setNewTx({
                                description: '',
                                walletId: wallets[0]?.id || '',
                                toWalletId: '',
                                amount: 0,
                                fee: 0,
                                date: new Date().toISOString().split('T')[0],
                                category: '',
                                type: 'expense',
                                savingId: ''
                            });
                            setActiveTab('expense');
                            setIsSingleModalOpen(true);
                        }}
                        className="px-6 py-3.5 bg-dagang-green text-white rounded-2xl text-[13px] font-bold hover:bg-dagang-green-light transition-all flex items-center gap-3 shadow-xl shadow-dagang-green/20"
                    >
                        <Plus className="w-5 h-5" /> Transaksi Baru
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-dagang-gray/30" />
                    <input
                        type="text"
                        placeholder="Cari catatan atau kategori..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-dagang-cream/30 border-none rounded-[24px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all placeholder:text-dagang-gray/40 font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
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
                        options={wallets.map(w => ({ label: w.name, value: w.id }))}
                    />
                    <FilterDropdown
                        label="Semua Kategori"
                        value={filterCategory}
                        onChange={setFilterCategory}
                        options={categoryOptions}
                    />
                </div>
            </div>

            {/* History List Grouped */}
            <div className="space-y-10">
                {Object.keys(groupedTransactions).length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-black/10">
                        <div className="w-20 h-20 bg-dagang-cream/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-dagang-gray/20" />
                        </div>
                        <h4 className="text-xl font-bold text-dagang-dark">Tidak ada transaksi</h4>
                        <p className="text-dagang-gray text-sm mt-2 opacity-60">Coba ubah filter atau cari kata kunci lain.</p>
                    </div>
                ) : Object.entries(groupedTransactions).map(([date, txs]) => (
                    <div key={date} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[11px] font-black text-dagang-gray/40 uppercase tracking-[0.25em]">{date}</h3>
                            <span className="text-[11px] font-bold text-dagang-gray/20">
                                Total: Rp {txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {txs.map(tx => (
                                <TransactionItem
                                    key={tx.id}
                                    transaction={tx}
                                    wallets={wallets}
                                    expanded={expandedTxId === tx.id}
                                    onToggle={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                                    onEdit={(transaction) => {
                                        setNewTx({
                                            description: transaction.description,
                                            walletId: transaction.walletId,
                                            toWalletId: transaction.toWalletId || '',
                                            amount: transaction.amount,
                                            fee: transaction.fee || 0,
                                            date: transaction.date.split('T')[0],
                                            category: transaction.category || '',
                                            type: transaction.type,
                                            savingId: transaction.savingId || ''
                                        });
                                        setEditingTxId(transaction.id);
                                        setIsEditing(true);
                                        setActiveTab(transaction.type === 'saving' ? 'expense' : transaction.type as any);
                                        setIsSingleModalOpen(true);
                                    }}
                                    onDelete={handleDeleteTransaction}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            <SingleTransactionModal
                isOpen={isSingleModalOpen}
                onClose={() => {
                    setIsSingleModalOpen(false);
                    setIsEditing(false);
                    setEditingTxId(null);
                }}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                newTx={newTx}
                setNewTx={setNewTx}
                wallets={wallets}
                handleCreateTransaction={handleCreateTransaction}
                handleUpdateTransaction={handleUpdateTransaction}
                isEditing={isEditing}
                editingTxId={editingTxId}
                savings={savings}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                incomeCategories={incomeCategories}
                budgetCategories={budgetCategories}
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
                budgetCategories={budgetCategories}
                handleBulkCreateTransactions={handleBulkCreateTransactions}
            />

            <ReceiptScannerModal
                isOpen={isScannerModalOpen}
                onClose={() => setIsScannerModalOpen(false)}
                familyMembers={familyMembers}
                wallets={wallets}
                onConfirm={(txs) => {
                    handleBulkCreateTransactions(txs);
                }}
            />
        </div>
    );
};
