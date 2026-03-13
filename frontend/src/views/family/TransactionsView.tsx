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
    Clock
} from 'lucide-react';
import { Transaction, Wallet as WalletModel } from '../../models';
import { Calculator as CalculatorComp } from '../../components/Calculator';

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
    categories: string[];
    handleDeleteTransaction: (id: string) => void;
    handleUpdateTransaction: (id: string, tx: any) => void;
    savings: any[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
    transactions,
    wallets,
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
    categories,
    handleDeleteTransaction,
    handleUpdateTransaction,
    savings
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterWallet, setFilterWallet] = useState<string>('all');
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || tx.type === filterType;
            const matchesWallet = filterWallet === 'all' || tx.walletId === filterWallet;
            return matchesSearch && matchesType && matchesWallet;
        });
    }, [transactions, searchQuery, filterType, filterWallet]);

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
                    <h2 className="text-[32px] font-serif leading-tight text-dagang-dark">Transaksi</h2>
                    <p className="text-dagang-gray text-sm mt-1">Uangmu lari ke mana aja?</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-6 py-3.5 bg-white border border-black/5 rounded-2xl text-[13px] font-bold text-dagang-gray hover:bg-dagang-cream/50 transition-all flex items-center gap-3 shadow-sm"
                    >
                        <Calculator className="w-5 h-5 text-dagang-accent" /> Tambah Banyak
                    </button>
                    <button
                        onClick={() => setIsSingleModalOpen(true)}
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
                    {/* Placeholder for Subcategory filter if needed later */}
                    <div className="px-5 py-3.5 bg-dagang-cream/30 text-[12px] font-bold text-dagang-gray/60 rounded-2xl cursor-not-allowed flex items-center gap-3">
                        <Target className="w-4 h-4 opacity-40" /> Semua Subkategori <ChevronDown className="w-4 h-4 opacity-40" />
                    </div>
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
                                            category: transaction.category || categories[0],
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
                categories={categories}
                handleCreateTransaction={handleCreateTransaction}
                handleUpdateTransaction={handleUpdateTransaction}
                isEditing={isEditing}
                editingTxId={editingTxId}
                savings={savings}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
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
                categories={categories}
                handleBulkCreateTransactions={handleBulkCreateTransactions}
            />
        </div>
    );
};

/* --- Subcomponents --- */

const FilterDropdown = ({ label, value, options, onChange }: { label: string, value: string, options: any[], onChange: (v: string) => void }) => (
    <div className="relative group">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none pl-6 pr-12 py-3.5 bg-dagang-cream/30 text-[12px] font-bold text-dagang-gray/60 hover:text-dagang-dark rounded-2xl outline-none transition-all cursor-pointer border border-transparent group-hover:border-black/5"
        >
            <option value="all">{label}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/30 pointer-events-none" />
    </div>
);

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
                onClick={onToggle}
            >
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-105 ${isIncome ? 'bg-green-50 text-dagang-green' :
                        isTransfer ? 'bg-blue-50 text-blue-500' :
                            isSaving ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                        }`}>
                        {isIncome ? <TrendingUp className="w-6 h-6" /> :
                            isTransfer ? <ArrowRightLeft className="w-6 h-6" /> :
                                isSaving ? <Target className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="text-[15px] font-bold text-dagang-dark leading-snug">{tx.description}</h4>
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
                            <span className="text-dagang-gray opacity-40 uppercase tracking-widest">WAKTU</span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-dagang-gray opacity-20" />
                                <span className="text-dagang-dark">
                                    {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
                            onClick={() => onDelete(tx.id)}
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

const CategorySelector = ({ value, savingId, onChange, savings, staticCategories }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const groups = ['needs', 'wants', 'savings', 'emergency'];
    const labels: any = {
        needs: 'KEBUTUHAN',
        wants: 'KEINGINAN',
        savings: 'TABUNGAN',
        emergency: 'DANA DARURAT'
    };

    const colors: any = {
        needs: 'bg-blue-500/10 text-blue-500',
        wants: 'bg-amber-500/10 text-amber-500',
        savings: 'bg-dagang-green/10 text-dagang-green',
        emergency: 'bg-red-500/10 text-red-500'
    };

    const filteredSavings = savings.filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredStatics = staticCategories.filter((c: string) =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    const selectedItem = savingId ? savings.find((s: any) => s.id === savingId) : null;
    const displayText = selectedItem ? `${selectedItem.emoji} ${selectedItem.name}` : (value || 'Pilih kategori...');

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
                            {groups.map(group => {
                                const groupItems = filteredSavings.filter((s: any) => s.category === group);
                                if (groupItems.length === 0) return null;
                                return (
                                    <div key={group} className="mb-2">
                                        <div className={`px-6 py-2 text-[10px] font-black tracking-widest ${colors[group]}`}>
                                            {labels[group]}
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

                            {filteredStatics.length > 0 && (
                                <div>
                                    <div className="px-6 py-2 text-[10px] font-black tracking-widest bg-gray-50 text-gray-500">
                                        LAINNYA
                                    </div>
                                    {filteredStatics.map((cat: string) => (
                                        <div
                                            key={cat}
                                            onClick={() => {
                                                onChange(cat, '');
                                                setIsOpen(false);
                                            }}
                                            className="px-6 py-3 flex items-center justify-between hover:bg-dagang-cream/30 cursor-pointer transition-colors"
                                        >
                                            <span className="text-sm font-bold text-dagang-dark">{cat}</span>
                                            {value === cat && !savingId && <Check className="w-4 h-4 text-dagang-green" />}
                                        </div>
                                    ))}
                                </div>
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
    categories,
    handleCreateTransaction,
    handleUpdateTransaction,
    isEditing,
    editingTxId,
    savings,
    onOpenCalculator
}: any) => {
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (isEditing && editingTxId) {
            handleUpdateTransaction(editingTxId, newTx);
            onClose();
        } else {
            handleCreateTransaction();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dagang-dark/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[560px] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-dagang-dark">Transaksi Baru</h3>
                        <button onClick={onClose} className="p-3 bg-dagang-cream/50 rounded-2xl hover:bg-dagang-cream transition-all">
                            <X className="w-6 h-6 text-dagang-gray" />
                        </button>
                    </div>

                    {/* Form Content - Same as before but inside modal */}
                    <div className="flex flex-wrap gap-2 md:gap-4 p-2 bg-dagang-cream/30 rounded-3xl w-fit mx-auto">
                        <TransactionTab
                            active={activeTab === 'expense'}
                            onClick={() => { setActiveTab('expense'); setNewTx({ ...newTx, type: 'expense' }); }}
                            icon={TrendingDown}
                            label="Pengeluaran"
                            color="text-red-500"
                        />
                        <TransactionTab
                            active={activeTab === 'income'}
                            onClick={() => { setActiveTab('income'); setNewTx({ ...newTx, type: 'income' }); }}
                            icon={TrendingUp}
                            label="Pemasukan"
                            color="text-dagang-green"
                        />
                        <TransactionTab
                            active={activeTab === 'transfer'}
                            onClick={() => { setActiveTab('transfer'); setNewTx({ ...newTx, type: 'transfer' }); }}
                            icon={ArrowRightLeft}
                            label="Transfer"
                            color="text-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* TANGGAL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dagang-gray/30" />
                                <input
                                    type="date"
                                    value={newTx.date}
                                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-dagang-cream/30 border-none rounded-2xl outline-none font-bold"
                                />
                            </div>
                        </div>

                        {/* JUMLAH */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">Jumlah</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-dagang-dark/20 text-sm">Rp</div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newTx.amount || ''}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseFloat(e.target.value));
                                            setNewTx({ ...newTx, amount: isNaN(val) ? 0 : val });
                                        }}
                                        placeholder="0"
                                        className="w-full pl-14 pr-14 py-4 bg-dagang-cream/30 border-none rounded-2xl outline-none font-bold text-lg"
                                    />
                                    <button 
                                        onClick={onOpenCalculator}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white text-dagang-green rounded-xl shadow-sm hover:scale-110 transition-all active:scale-90"
                                    >
                                        <Calculator className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">
                                {activeTab === 'expense' ? 'Dari Dompet' : 'Ke Dompet'}
                            </label>
                            <select
                                value={newTx.walletId}
                                onChange={(e) => setNewTx({ ...newTx, walletId: e.target.value })}
                                className="w-full px-6 py-4 bg-dagang-cream/30 border-none rounded-2xl outline-none font-bold appearance-none"
                            >
                                <option value="">Pilih Dompet...</option>
                                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">
                                {activeTab === 'transfer' ? 'Ke Dompet' : 'Kategori'}
                            </label>
                            {activeTab === 'transfer' ? (
                                <select
                                    value={newTx.toWalletId}
                                    onChange={(e) => setNewTx({ ...newTx, toWalletId: e.target.value })}
                                    className="w-full px-6 py-4 bg-dagang-cream/30 border-none rounded-2xl outline-none font-bold appearance-none"
                                >
                                    <option value="">Select...</option>
                                    {wallets.filter((w: any) => w.id !== newTx.walletId).map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>
                                    ))}
                                </select>
                            ) : (
                                <CategorySelector
                                    value={newTx.category}
                                    savingId={newTx.savingId}
                                    savings={savings}
                                    staticCategories={categories}
                                    onChange={(cat: string, sId: string) => setNewTx({ ...newTx, category: cat, savingId: sId })}
                                />
                            )}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">Catatan</label>
                            <input
                                type="text"
                                value={newTx.description}
                                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                placeholder="cth. Kopi Kenangan"
                                className="w-full px-6 py-4 bg-dagang-cream/30 border-none rounded-2xl outline-none font-bold"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-5 bg-dagang-green text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20"
                    >
                        {isEditing ? 'Simpan Perubahan' : `Tambah ${activeTab === 'expense' ? 'Pengeluaran' : activeTab === 'income' ? 'Pemasukan' : 'Transfer'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BulkTransactionModal = ({ isOpen, onClose, wallets, categories, handleBulkCreateTransactions }: any) => {
    const [rows, setRows] = useState<any[]>([
        { date: new Date().toISOString().split('T')[0], amount: 0, type: 'expense', walletId: wallets[0]?.id || '', category: categories[0], description: '' },
    ]);

    useEffect(() => {
        if (isOpen && wallets.length > 0 && !rows[0].walletId) {
            setRows([{ ...rows[0], walletId: wallets[0].id }]);
        }
    }, [isOpen, wallets]);

    if (!isOpen) return null;

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, { ...lastRow, amount: 0, description: '' }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const updateRow = (index: number, field: string, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dagang-dark/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#F9FAFB] w-full max-w-[1000px] rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-[28px] font-black text-dagang-dark tracking-tight">Input Transaksi Massal</h3>
                            <p className="text-dagang-gray/50 text-sm mt-1">Tambah banyak transaksi sekaligus. Otomatis ikut baris sebelumnya.</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-dagang-cream transition-all shadow-sm">
                            <X className="w-6 h-6 text-dagang-gray" />
                        </button>
                    </div>

                    <div className="bg-white rounded-[32px] border border-black/5 overflow-hidden shadow-sm mb-10">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-[0.2em] bg-dagang-cream/10">
                                    <th className="w-16 px-4 py-5" />
                                    <th className="px-4 py-5 text-left">Tanggal</th>
                                    <th className="px-4 py-5 text-left">Jumlah</th>
                                    <th className="px-4 py-5 text-left">Tipe</th>
                                    <th className="px-4 py-5 text-left">Dompet</th>
                                    <th className="px-4 py-5 text-left">Kategori / To</th>
                                    <th className="px-4 py-5 text-left">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-dagang-cream/10 transition-colors">
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => removeRow(idx)}
                                                className="p-2.5 text-red-500/30 hover:text-red-500 transition-colors bg-red-500/5 hover:bg-red-500/10 rounded-xl"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => updateRow(idx, 'date', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="number"
                                                value={row.amount || ''}
                                                onChange={(e) => updateRow(idx, 'amount', parseFloat(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-transparent border-none p-0 text-[13px] font-black outline-none placeholder:text-dagang-gray/20"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <select
                                                value={row.type}
                                                onChange={(e) => updateRow(idx, 'type', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="expense">Pengeluaran</option>
                                                <option value="income">Pemasukan</option>
                                                <option value="transfer">Transfer</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-4">
                                            <select
                                                value={row.walletId}
                                                onChange={(e) => updateRow(idx, 'walletId', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="">Pilih...</option>
                                                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-4">
                                            {row.type === 'transfer' ? (
                                                <select
                                                    value={row.toWalletId}
                                                    onChange={(e) => updateRow(idx, 'toWalletId', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none cursor-pointer"
                                                >
                                                    <option value="">Select...</option>
                                                    {wallets.filter((w: any) => w.id !== row.walletId).map((w: any) => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <select
                                                    value={row.category}
                                                    onChange={(e) => updateRow(idx, 'category', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none cursor-pointer"
                                                >
                                                    {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="text"
                                                value={row.description}
                                                onChange={(e) => updateRow(idx, 'description', e.target.value)}
                                                placeholder="cth. Kopi Kenangan"
                                                className="w-full bg-transparent border-none p-0 text-[13px] font-bold outline-none placeholder:text-dagang-gray/20"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={addRow}
                            className="px-8 py-4 bg-white border border-black/5 rounded-2xl text-[14px] font-bold text-dagang-dark hover:bg-dagang-cream/50 transition-all flex items-center gap-3 shadow-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5 text-dagang-green" /> Tambah Baris
                        </button>
                        <button
                            onClick={() => {
                                const invalid = rows.some(r => !r.walletId || r.amount <= 0 || (r.type === 'transfer' && !r.toWalletId));
                                if (invalid) {
                                    alert('Pastikan semua baris sudah memilih dompet, mengisi jumlah > 0, dan memilih dompet tujuan untuk transfer.');
                                    return;
                                }
                                handleBulkCreateTransactions(rows);
                            }}
                            className="px-10 py-4 bg-dagang-green text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20 flex items-center gap-3 active:scale-95"
                        >
                            <Check className="w-5 h-5" /> Simpan Semua
                        </button>
                    </div>
                </div>
            </div>
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
