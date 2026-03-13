import React, { useState } from 'react';
import {
    Plus,
    CreditCard,
    TrendingUp,
    X,
    ChevronDown,
    Building2,
    Smartphone,
    CreditCard as CardIcon,
    Clock,
    Banknote,
    Edit3,
    Trash2
} from 'lucide-react';
import { Wallet as WalletModel } from '../../models';

interface WalletsViewProps {
    wallets: WalletModel[];
    handleCreateWallet: (name: string, type: string, accountNumber: string, initialBalance: number) => void;
    handleUpdateWallet: (wallet: WalletModel) => void;
    handleDeleteWallet: (id: string) => void;
}

const WALLET_TYPES = [
    { id: 'Bank', label: 'Bank', icon: Building2 },
    { id: 'E-Wallet', label: 'E-Wallet', icon: Smartphone },
    { id: 'Kartu Kredit', label: 'Kartu Kredit', icon: CardIcon },
    { id: 'PayLater', label: 'PayLater', icon: Clock },
    { id: 'Tunai', label: 'Tunai', icon: Banknote }
];

export const WalletsView: React.FC<WalletsViewProps> = ({
    wallets,
    handleCreateWallet,
    handleUpdateWallet,
    handleDeleteWallet
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editWalletId, setEditWalletId] = useState<string | null>(null);

    // Form States
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Bank');
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newBalance, setNewBalance] = useState<number>(0);

    const openCreateModal = () => {
        resetForm();
        setEditWalletId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setEditWalletId(item.id);
        setNewName(item.name);
        setNewType(item.walletType || 'Bank');
        setNewAccountNumber(item.accountNumber || '');
        setNewBalance(item.balance);
        setIsModalOpen(true);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        if (newBalance < 0) {
            alert('Nominal tidak boleh negatif');
            return;
        }

        if (editWalletId) {
            handleUpdateWallet({
                id: editWalletId,
                name: newName,
                walletType: newType,
                accountNumber: newAccountNumber,
                balance: newBalance
            } as any);
        } else {
            handleCreateWallet(newName, newType, newAccountNumber, newBalance);
        }

        resetForm();
    };

    const resetForm = () => {
        setNewName('');
        setNewType('Bank');
        setNewAccountNumber('');
        setNewBalance(0);
        setEditWalletId(null);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-h2 font-heading text-dagang-dark">Kelola Dompet</h2>
                    <p className="text-body-s text-dagang-gray mt-1">Simpan dan pantau saldo dari berbagai akun finansial Anda.</p>
                </div>
                {!isModalOpen && (
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-dagang-dark text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Tambah Dompet
                    </button>
                )}
            </div>

            {/* Total Wealth Summary (Top) */}
            <div className="bg-dagang-dark rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-dagang-dark/20 group animate-in slide-in-from-top-4 duration-700">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-dagang-green/10 to-transparent pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-dagang-green/5 rounded-full blur-[100px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-dagang-accent group-hover:scale-110 transition-transform shadow-inner">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-h4 mobile:text-h3 font-heading text-white/90">Total Kekayaan Bersih</h3>
                        </div>
                        <p className="text-white/40 text-xs md:text-sm max-w-md leading-relaxed hidden md:block">
                            Nilai total dari seluruh aset digital dan uang tunai yang Anda kelola dalam sistem Uangku.
                        </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Portfolio Balance</div>
                        <div className="text-4xl md:text-5xl font-serif text-dagang-accent tracking-tighter drop-shadow-sm">
                            Rp {wallets.reduce((acc, w) => acc + w.balance, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Overlay for Action */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={resetForm}
                            className="absolute right-6 top-6 p-2 text-dagang-gray hover:text-dagang-dark hover:bg-dagang-cream rounded-full transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-serif mb-8 text-dagang-dark">
                            {editWalletId ? 'Ubah Dompet' : 'Tambah Dompet'}
                        </h3>

                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-dagang-gray uppercase tracking-widest">Tipe</label>
                                <div className="relative">
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all appearance-none font-bold text-[15px]"
                                    >
                                        {WALLET_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dagang-gray pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-dagang-gray uppercase tracking-widest">Nama</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="cth. BCA Pribadi"
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-dagang-gray uppercase tracking-widest">Nomor Rekening (Opsional)</label>
                                <input
                                    type="text"
                                    value={newAccountNumber}
                                    onChange={(e) => setNewAccountNumber(e.target.value)}
                                    placeholder="Nomor Rekening"
                                    className="w-full px-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-bold text-[15px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-dagang-gray uppercase tracking-widest">Saldo Saat Ini</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-dagang-gray">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newBalance}
                                        onChange={(e) => setNewBalance(parseFloat(e.target.value))}
                                        className={`w-full pl-12 pr-5 py-4 bg-dagang-cream/50 border-none rounded-2xl focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all font-black text-[18px]`}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-dagang-accent text-dagang-dark rounded-2xl font-black text-[16px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-dagang-accent/20 mt-4"
                            >
                                {editWalletId ? 'Simpan Perubahan' : 'Tambah'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 transition-all">
                {wallets.map((wallet) => (
                    <div key={wallet.id} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 bg-dagang-cream rounded-2xl flex items-center justify-center text-dagang-green shadow-sm">
                                <CreditCard className="w-7 h-7" />
                            </div>
                            <div className="flex items-center gap-2">
                                {wallet.walletType && (
                                    <div className="px-3 py-1 bg-dagang-cream rounded-full text-[10px] font-black uppercase text-dagang-gray">
                                        {wallet.walletType}
                                    </div>
                                )}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(wallet)}
                                        className="p-2 text-dagang-gray hover:text-dagang-green hover:bg-dagang-green/5 rounded-lg transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWallet(wallet.id)}
                                        className="p-2 text-dagang-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[12px] font-black text-dagang-gray/40 uppercase tracking-[0.2em]">
                                {wallet.accountNumber || 'Wallet'}
                            </div>
                            <h3 className="text-xl font-bold text-dagang-dark">{wallet.name}</h3>
                        </div>
                        <div className="mt-8 pt-8 border-t border-black/5">
                            <div className="text-[11px] font-black text-dagang-gray/30 uppercase tracking-[0.1em] mb-1">Total Saldo</div>
                            <div className="text-2xl font-serif text-dagang-dark">Rp {wallet.balance.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
