import React, { useState } from 'react';
import {
    Plus,
    Calendar,
    DollarSign,
    ArrowUpCircle,
    History,
    Info,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    Trash2
} from 'lucide-react';
import { FinanceController } from '../../controllers/FinanceController';

interface DebtViewProps {
    debts: any[];
    wallets: any[];
    handleCreateDebt: (debt: any) => void;
    handleRecordPayment: (payment: any) => void;
}

export const DebtView: React.FC<DebtViewProps & { handleDeleteDebt: (id: string) => void }> = ({
    debts,
    wallets,
    handleCreateDebt,
    handleRecordPayment,
    handleDeleteDebt
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isPaying, setIsPaying] = useState<string | null>(null);
    const [viewHistory, setViewHistory] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [newDebt, setNewDebt] = useState({
        name: '',
        totalAmount: 0,
        dueDate: '',
        description: ''
    });

    const [payment, setPayment] = useState({
        amount: 0,
        walletId: '',
        description: '',
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
        setPayment({ amount: 0, walletId: '', description: '', paymentDate: new Date().toISOString().split('T')[0] });
        setIsPaying(null);
    };

    const handleViewHistory = async (debtId: string) => {
        setViewHistory(debtId);
        setLoadingHistory(true);
        try {
            const history = await FinanceController.getDebtHistory(debtId);
            setHistoryData(history);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-4 h-4" />;
            case 'overdue': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'overdue': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
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
                    <form onSubmit={onCreateSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest">Nama Hutang</label>
                                <input
                                    type="text"
                                    value={newDebt.name}
                                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                    placeholder="Misal: Kredit Mobil"
                                    className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold"
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
                                    className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest">Deskripsi (Optional)</label>
                            <textarea
                                value={newDebt.description}
                                onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                                placeholder="Detail hutang..."
                                className="w-full px-5 py-3.5 bg-dagang-cream/50 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all min-h-[100px]"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3.5 bg-dagang-cream text-dagang-gray rounded-xl font-bold">Batal</button>
                            <button type="submit" className="px-10 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Simpan Catatan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {debts.map((debt) => {
                    const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                    return (
                        <div key={debt.id} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <div className="flex gap-2">
                                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${getStatusClass(debt.status)}`}>
                                        {getStatusIcon(debt.status)} {debt.status}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteDebt(debt.id)}
                                        className="p-1.5 text-dagang-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                <h3 className="text-xl font-bold text-dagang-dark line-clamp-1">{debt.name}</h3>
                                {debt.description && (
                                    <p className="text-xs text-dagang-gray line-clamp-2 italic">{debt.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-dagang-gray font-bold pt-2">
                                    <Calendar className="w-3.5 h-3.5" /> Jatuh Tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID')}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Progress Pelunasan</span>
                                    <span className="text-[12px] font-black text-red-500">{progress.toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 bg-black/5 rounded-full mb-8 overflow-hidden">
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

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleViewHistory(debt.id)}
                                        className="py-3.5 bg-dagang-cream text-dagang-gray rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-dagang-dark hover:text-white transition-all"
                                    >
                                        <History className="w-4 h-4" /> Riwayat
                                    </button>
                                    <button
                                        disabled={debt.status === 'paid'}
                                        onClick={() => setIsPaying(debt.id)}
                                        className="py-3.5 bg-dagang-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUpCircle className="w-4 h-4" /> Bayar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {isPaying && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 bg-animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-serif text-dagang-dark">Cicil Hutang</h3>
                            <button onClick={() => setIsPaying(null)} className="p-2 text-dagang-gray hover:bg-dagang-cream rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
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
                                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} (Saldo: Rp {w.balance.toLocaleString()})</option>)}
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
                            <div className="space-y-2">
                                <label className="text-xs font-black text-dagang-gray uppercase tracking-widest">Catatan Pembayaran (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-dagang-cream/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-dagang-green/20 font-bold"
                                    value={payment.description}
                                    onChange={(e) => setPayment({ ...payment, description: e.target.value })}
                                    placeholder="Misal: Cicilan bulan Maret"
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

            {/* History Modal */}
            {viewHistory && (
                <div className="fixed inset-0 bg-dagang-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-serif text-dagang-dark">Riwayat Pembayaran</h3>
                            <button onClick={() => setViewHistory(null)} className="p-2 text-dagang-gray hover:bg-dagang-cream rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-dagang-gray mb-8">Daftar cicilan yang telah dibayarkan untuk hutang ini.</p>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {loadingHistory ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-dagang-dark/10 border-t-dagang-dark rounded-full animate-spin" />
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-20 bg-dagang-cream/30 rounded-[32px] border border-dashed border-dagang-dark/10">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-dagang-gray/30">
                                        <Info className="w-8 h-8" />
                                    </div>
                                    <p className="text-dagang-gray font-bold">Belum ada riwayat pembayaran.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyData.map((h) => {
                                        const wallet = wallets.find(w => w.id === h.walletId);
                                        return (
                                            <div key={h.id} className="bg-dagang-cream/30 rounded-2xl p-5 border border-dagang-dark/5 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-dagang-dark">{h.description || 'Cicilan Hutang'}</div>
                                                        <div className="text-[10px] text-dagang-gray font-black uppercase tracking-widest mt-0.5">
                                                            {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {wallet?.name || 'Wallet'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-emerald-600">Rp {h.amount.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-8 mt-4 border-t border-black/5">
                            <button 
                                onClick={() => setViewHistory(null)} 
                                className="w-full py-4 bg-dagang-dark text-white rounded-2xl font-bold hover:bg-black transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
