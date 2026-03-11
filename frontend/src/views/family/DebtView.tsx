import React, { useState } from 'react';
import {
    Plus,
    Calendar,
    DollarSign,
    ArrowUpCircle
} from 'lucide-react';

interface DebtViewProps {
    debts: any[];
    wallets: any[];
    handleCreateDebt: (debt: any) => void;
    handleRecordPayment: (payment: any) => void;
}

export const DebtView: React.FC<DebtViewProps> = ({
    debts,
    wallets,
    handleCreateDebt,
    handleRecordPayment
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isPaying, setIsPaying] = useState<string | null>(null);
    const [newDebt, setNewDebt] = useState({
        name: '',
        totalAmount: 0,
        dueDate: '',
        description: ''
    });
    const [payment, setPayment] = useState({
        debtId: '',
        amount: 0,
        walletId: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    const onCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreateDebt(newDebt);
        setNewDebt({ name: '', totalAmount: 0, dueDate: '', description: '' });
        setIsAdding(false);
    };

    const onPaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleRecordPayment({ ...payment, debtId: isPaying });
        setPayment({ debtId: '', amount: 0, walletId: '', paymentDate: new Date().toISOString().split('T')[0] });
        setIsPaying(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-serif text-dagang-dark">Hutang & Piutang</h2>
                    <p className="text-dagang-gray text-sm mt-1">Pantau dan cicil hutang keluarga Anda secara teratur.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Catat Hutang Baru
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white rounded-[32px] p-8 border border-red-100 shadow-xl shadow-red-500/5 animate-in zoom-in-95 duration-300">
                    <h3 className="text-lg font-bold mb-6 text-dagang-dark">Tambah Catatan Hutang</h3>
                    <form onSubmit={onCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest">Nama Hutang</label>
                            <input
                                type="text"
                                value={newDebt.name}
                                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                placeholder="Misal: Kredit Mobil"
                                className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest">Total Hutang (Rp)</label>
                            <input
                                type="number"
                                min="1"
                                value={newDebt.totalAmount || ''}
                                onChange={(e) => setNewDebt({ ...newDebt, totalAmount: parseFloat(e.target.value) })}
                                placeholder="0"
                                className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest">Jatuh Tempo</label>
                            <input
                                type="date"
                                value={newDebt.dueDate}
                                onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                                className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">Simpan</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3.5 bg-dagang-cream text-dagang-gray rounded-xl font-bold">Batal</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {debts.map((debt) => {
                    const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                    return (
                        <div key={debt.id} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <div className="text-[14px] font-black text-red-500">{progress.toFixed(0)}% Lunas</div>
                            </div>
                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-bold text-dagang-dark">{debt.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-dagang-gray font-bold">
                                    <Calendar className="w-3.5 h-3.5" /> Jatuh Tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID')}
                                </div>
                            </div>
                            <div className="h-2 bg-black/5 rounded-full mb-8 overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between mb-8">
                                <div>
                                    <div className="text-[10px] font-black text-dagang-gray/30 uppercase tracking-[0.1em] mb-1">Sisa Hutang</div>
                                    <div className="text-lg font-serif text-red-500">Rp {debt.remainingAmount.toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-dagang-gray/30 uppercase tracking-[0.1em] mb-1">Total</div>
                                    <div className="text-lg font-serif text-dagang-dark">Rp {debt.totalAmount.toLocaleString()}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPaying(debt.id)}
                                className="w-full py-3.5 bg-dagang-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                            >
                                <ArrowUpCircle className="w-5 h-5" /> Bayar Cicilan
                            </button>
                        </div>
                    );
                })}
            </div>

            {isPaying && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-serif text-dagang-dark mb-2">Cicil Hutang</h3>
                        <p className="text-dagang-gray mb-8">Pilih dompet dan masukkan jumlah yang ingin dibayarkan.</p>

                        <form onSubmit={onPaymentSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-dagang-gray uppercase tracking-widest">Pilih Dompet Pembayar</label>
                                <select
                                    className="w-full px-6 py-4 bg-dagang-cream/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-dagang-green/20 font-bold"
                                    value={payment.walletId}
                                    onChange={(e) => setPayment({ ...payment, walletId: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih Wallet</option>
                                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} (Rp {w.balance.toLocaleString()})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-dagang-gray uppercase tracking-widest">Jumlah Bayar (Rp)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-6 py-4 bg-dagang-cream/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-dagang-green/20 font-bold text-xl"
                                    value={payment.amount || ''}
                                    onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 py-4 bg-dagang-green text-white rounded-2xl font-bold hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10">Catat Pembayaran</button>
                                <button type="button" onClick={() => setIsPaying(null)} className="px-8 py-4 bg-dagang-cream text-dagang-gray rounded-2xl font-bold hover:bg-red-50 hover:text-red-500 transition-all">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
