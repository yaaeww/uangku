import React, { useState, useEffect } from 'react';
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
    Trash2,
    Edit3,
    Check
} from 'lucide-react';
import { FinanceController } from '../../controllers/FinanceController';
import { formatRupiah, parseRupiah } from '../../utils/formatters';

interface DebtViewProps {
    debts: any[];
    wallets: any[];
    familyRole: string;
    currentUserId: string;
    handleCreateDebt: (debt: any) => void;
    handleRecordPayment: (payment: any) => void;
    handleUpdateDebt: (debt: any) => void;
}

export const DebtView: React.FC<DebtViewProps & { handleDeleteDebt: (id: string) => void }> = ({
    debts,
    wallets,
    familyRole,
    currentUserId,
    handleCreateDebt,
    handleRecordPayment,
    handleUpdateDebt,
    handleDeleteDebt
}) => {
    const canManageDebt = familyRole !== 'viewer';
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<any | null>(null);
    const [isPaying, setIsPaying] = useState<string | null>(null);
    const [viewHistory, setViewHistory] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const [newDebt, setNewDebt] = useState({
        name: '',
        totalAmount: 0,
        dueDate: '',
        description: '',
        installmentIntervalMonths: 0,
        installmentAmount: 0,
        penaltyAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        paymentDay: new Date().getDate(),
        nextInstallmentDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // Default one month from now
    });

    const [payment, setPayment] = useState({
        amount: 0,
        walletId: '',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    const onCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreateDebt({
            ...newDebt,
            installmentIntervalMonths: Number(newDebt.installmentIntervalMonths) || 0,
            installmentAmount: Number(newDebt.installmentAmount) || 0,
            penaltyAmount: Number(newDebt.penaltyAmount) || 0,
            paymentDay: Number(newDebt.paymentDay) || new Date().getDate(),
            nextInstallmentDueDate: newDebt.nextInstallmentDueDate || newDebt.dueDate
        });
        setNewDebt({ 
            name: '', 
            totalAmount: 0, 
            dueDate: '', 
            description: '',
            installmentIntervalMonths: 0,
            installmentAmount: 0,
            penaltyAmount: 0,
            startDate: new Date().toISOString().split('T')[0],
            paymentDay: new Date().getDate(),
            nextInstallmentDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        });
        setIsAdding(false);
    };

    const onPaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Check wallet balance
        const wallet = wallets.find(w => w.id === payment.walletId);
        if (wallet && payment.amount > wallet.balance) {
            setPaymentError(`Saldo ${wallet.name} tidak mencukupi! (Saldo: Rp ${wallet.balance.toLocaleString('id-ID')})`);
            return;
        }

        const debt = debts.find(d => d.id === isPaying);
        if (!debt) return;

        // 2. Check principal overflow
        if (!isConfirming && payment.amount > debt.remainingAmount) {
            setIsConfirming(true);
            return;
        }

        handleRecordPayment({ ...payment, debtId: isPaying });
        setIsPaying(null);
        setShowPaymentDetails(false);
        setIsConfirming(false);
        setPaymentError(null);
    };

    // Reset state when closing payment modal
    useEffect(() => {
        if (!isPaying) {
            setShowPaymentDetails(false);
            setPayment({
                amount: 0,
                walletId: wallets.filter(w => w.userId === currentUserId)[0]?.id || '',
                description: '',
                paymentDate: new Date().toISOString().split('T')[0]
            });
            setPaymentError(null);
            setIsConfirming(false);
        }
    }, [isPaying, wallets, currentUserId]);

    useEffect(() => {
        if (isPaying) {
            const debt = debts.find(d => d.id === isPaying);
            if (debt) {
                const isLate = (() => {
                    const d = new Date(debt.nextInstallmentDueDate);
                    d.setHours(0, 0, 0, 0);
                    const n = new Date();
                    n.setHours(0, 0, 0, 0);
                    return n > d;
                })();

                const currentPeriodTarget = isLate ? (debt.installmentAmount + debt.penaltyAmount) : debt.installmentAmount;
                const remainingForPeriod = Math.max(0, currentPeriodTarget - (debt.paidThisMonth || 0));
                
                // Default to remaining for period if any, else default to standard installment
                const defaultAmount = remainingForPeriod > 0 ? 
                    Math.min(remainingForPeriod, debt.remainingAmount) : 
                    Math.min(debt.installmentAmount, debt.remainingAmount);

                setPayment(prev => ({ 
                    ...prev, 
                    amount: Math.round(defaultAmount),
                    walletId: wallets.filter(w => w.userId === currentUserId)[0]?.id || prev.walletId || '',
                    description: `Cicilan ${debt.name} - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                }));
                setPaymentError(null);
                setIsConfirming(false);
            }
        }
    }, [isPaying, debts, wallets, currentUserId]);

    const onEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        handleUpdateDebt(isEditing);
        setIsEditing(null);
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

    const handleDeleteHistoryItem = async (transactionId: string, date: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus pembayaran ini? Saldo dompet akan dikembalikan secara otomatis.")) return;
        
        try {
            await FinanceController.deleteTransaction(transactionId, date);
            if (viewHistory) {
                await handleViewHistory(viewHistory);
            }
        } catch (error: any) {
            alert("Gagal menghapus riwayat: " + error.message);
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
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const getPeriodStatus = (nextDueDate: string, paidThisMonth: number, installmentAmount: number, penaltyAmount: number, status?: string) => {
        if (status === 'paid') return { label: 'LUNAS', color: 'emerald', icon: <CheckCircle2 className="w-4 h-4" /> };
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(nextDueDate);
        due.setHours(0, 0, 0, 0);
        const isOverdue = now > due;
        const currentTarget = isOverdue ? (installmentAmount + penaltyAmount) : installmentAmount;

        if (paidThisMonth >= currentTarget && installmentAmount > 0) {
            return { label: 'LUNAS', color: 'emerald', icon: <CheckCircle2 className="w-4 h-4" /> };
        }

        if (paidThisMonth > 0) {
            if (isOverdue) return { label: 'TELAT SEBAGIAN', color: 'red', icon: <AlertCircle className="w-4 h-4" /> };
            return { label: 'SEBAGIAN', color: 'amber', icon: <Clock className="w-4 h-4" /> };
        }

        if (isOverdue) return { label: 'TELAT', color: 'red', icon: <AlertCircle className="w-4 h-4" /> };
        return { label: 'BELUM BAYAR', color: 'blue', icon: <Clock className="w-4 h-4" /> };
    };

    const getMonthNameFromDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', { month: 'long' });
    };

    const getCurrentMonthName = () => {
        return new Date().toLocaleDateString('id-ID', { month: 'long' });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-serif text-[var(--text-main)]">Hutang & Piutang</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Pantau dan cicil hutang keluarga Anda secara teratur.</p>
                </div>
                {canManageDebt && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-6 py-3 bg-[var(--text-main)] text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Catat Hutang Baru
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[var(--surface-card)] rounded-[32px] p-8 border border-[var(--border)] shadow-xl shadow-red-500/5 animate-in zoom-in-95 duration-300">
                    <h3 className="text-lg font-bold mb-6 text-[var(--text-main)]">Tambah Catatan Hutang</h3>
                    <form onSubmit={onCreateSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Nama Hutang</label>
                                <input
                                    type="text"
                                    value={newDebt.name}
                                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                    placeholder="Misal: Kredit Mobil"
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Total Hutang (Rp)</label>
                                <input
                                    type="text"
                                    value={formatRupiah(newDebt.totalAmount) || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, totalAmount: parseRupiah(e.target.value) })}
                                    placeholder="0"
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Mulai Hutang</label>
                                <input
                                    type="date"
                                    value={newDebt.startDate}
                                    onChange={(e) => setNewDebt({ ...newDebt, startDate: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Jatuh Tempo Akhir</label>
                                <input
                                    type="date"
                                    value={newDebt.dueDate}
                                    onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)] border-dashed">
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest flex items-center gap-2">
                                    Tanggal Bayar Tiap Bulan
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">1-31</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={newDebt.paymentDay}
                                    onChange={(e) => setNewDebt({ ...newDebt, paymentDay: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                                <p className="text-[10px] text-[var(--text-muted)] opacity-60">Sistem akan menyesuaikan jika bulan tersebut tidak memiliki tanggal yang dipilih (misal: 31 di Feb).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border)] border-dashed">
                             <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest flex items-center gap-2">
                                    Dibayar Tiap...
                                    <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">Bulan</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newDebt.installmentIntervalMonths || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, installmentIntervalMonths: parseInt(e.target.value) })}
                                    placeholder="0 (Sekali bayar)"
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Besar Cicilan (Rp)</label>
                                <input
                                    type="text"
                                    value={formatRupiah(newDebt.installmentAmount) || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, installmentAmount: parseRupiah(e.target.value) })}
                                    placeholder="Nominal tiap bayar"
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest flex items-center gap-2">
                                    Denda Kalau Telat
                                    <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">Per Bln</span>
                                </label>
                                <input
                                    type="text"
                                    value={formatRupiah(newDebt.penaltyAmount) || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, penaltyAmount: parseRupiah(e.target.value) })}
                                    placeholder="0"
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                />
                            </div>
                        </div>

                        {newDebt.installmentIntervalMonths > 0 && (
                             <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[12px] font-bold text-blue-500 opacity-80 uppercase tracking-widest flex items-center gap-2">
                                    Batas Bayar Pertama
                                    <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">PENTING</span>
                                </label>
                                <input
                                    type="date"
                                    value={newDebt.nextInstallmentDueDate}
                                    onChange={(e) => setNewDebt({ ...newDebt, nextInstallmentDueDate: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl focus:ring-2 focus:ring-blue-500/40 outline-none transition-all font-bold text-blue-600"
                                    required
                                />
                                <p className="text-[10px] text-[var(--text-muted)] opacity-60">Pilih tanggal di mana cicilan bulan pertama harus lunas.</p>
                            </div>
                        )}

                        {newDebt.totalAmount > 0 && newDebt.installmentAmount > 0 && newDebt.installmentIntervalMonths > 0 && (
                             <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Analisis Pelunasan</div>
                                    <p className="text-sm text-[var(--text-main)] leading-relaxed">
                                        Hutang Rp {newDebt.totalAmount.toLocaleString('id-ID')} akan lunas dalam <span className="font-black text-blue-600">{Math.ceil(newDebt.totalAmount / newDebt.installmentAmount)} kali bayar</span> ({Math.ceil((newDebt.totalAmount / newDebt.installmentAmount) * newDebt.installmentIntervalMonths)} bulan).
                                        Estimasi lunas: <span className="font-black text-[var(--text-main)]">
                                            {(() => {
                                                const months = Math.ceil((newDebt.totalAmount / newDebt.installmentAmount) * newDebt.installmentIntervalMonths);
                                                const date = new Date();
                                                date.setMonth(date.getMonth() + months);
                                                return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                            })()}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Deskripsi (Optional)</label>
                            <textarea
                                value={newDebt.description}
                                onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                                placeholder="Detail hutang..."
                                className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all min-h-[100px] text-[var(--text-main)]"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3.5 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] rounded-xl font-bold">Batal</button>
                            <button type="submit" className="px-10 py-3.5 bg-[var(--primary)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10">Simpan Catatan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {debts.map((debt) => {
                    const nextDue = new Date(debt.nextInstallmentDueDate || new Date());
                    const today = new Date();
                    const status = getPeriodStatus(debt.nextInstallmentDueDate, debt.paidThisMonth, debt.installmentAmount, debt.penaltyAmount, debt.status);
                    const isCaughtUp = status.label === 'LUNAS';
                    const monthName = getMonthNameFromDate(debt.nextInstallmentDueDate);
                    
                    let colorClass = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                    if (isCaughtUp) {
                        colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                    } else if (status.color === 'amber') {
                        colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                    } else if (status.color === 'red') {
                        colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
                    }

                    const isLate = (() => {
                        const d = new Date(debt.nextInstallmentDueDate);
                        d.setHours(0, 0, 0, 0);
                        const n = new Date();
                        n.setHours(0, 0, 0, 0);
                        return n > d;
                    })();

                    const currentPeriodTarget = isLate ? (debt.installmentAmount + debt.penaltyAmount) : debt.installmentAmount;

                    return (
                        <div key={debt.id} className="bg-[var(--surface-card)] rounded-[32px] p-6 md:p-8 border border-[var(--border)] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] shrink-0">
                                    <DollarSign className="w-6 h-6 md:w-7 md:h-7" />
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end flex-1">
                                    <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full border text-[10px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 h-fit ${getStatusClass(debt.status)}`}>
                                        {getStatusIcon(debt.status)} {debt.status}
                                    </div>
                                    {debt.installmentIntervalMonths > 0 && (
                                        <div className="px-3 py-1 md:px-4 md:py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wider h-fit">
                                            Cicilan {debt.installmentIntervalMonths} Bln
                                        </div>
                                    )}
                                    {(debt.createdBy === currentUserId && familyRole !== 'viewer') && (
                                        <div className="flex gap-1 h-fit bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                                            <button 
                                                onClick={() => setIsEditing({
                                                    id: debt.id,
                                                    name: debt.name,
                                                    totalAmount: debt.totalAmount,
                                                    dueDate: debt.dueDate,
                                                    description: debt.description,
                                                    installmentIntervalMonths: debt.installmentIntervalMonths,
                                                    installmentAmount: debt.installmentAmount,
                                                    penaltyAmount: debt.penaltyAmount,
                                                    startDate: debt.startDate ? new Date(debt.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                                    paymentDay: debt.paymentDay || 1,
                                                    nextInstallmentDueDate: debt.nextInstallmentDueDate
                                                })}
                                                className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Ubah Hutang"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDebt(debt.id)}
                                                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Hapus Hutang"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                <h3 className="text-xl font-bold text-[var(--text-main)] line-clamp-1">{debt.name}</h3>
                                {debt.description && (
                                    <p className="text-xs text-[var(--text-muted)] opacity-70 line-clamp-2 italic">{debt.description}</p>
                                )}
                                <div className="flex flex-col gap-1.5 pt-2">
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] opacity-80 font-bold">
                                        <Calendar className="w-3.5 h-3.5" /> 
                                        <span>Jatuh Tempo: {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('id-ID') : 'Tidak Ada'}</span>
                                    </div>
                                    {debt.installmentIntervalMonths > 0 && (
                                        <>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${isLate ? 'text-red-500' : 'text-[var(--text-muted)] opacity-80'}`}>
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Next Cicilan: {new Date(debt.nextInstallmentDueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                {isLate && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse ml-1">LATE</span>}
                                            </div>
                                            <div className="mt-2 flex flex-col gap-1.5">
                                                <div className={`text-[10px] font-black px-2 py-1 rounded-lg border w-fit flex items-center gap-1.5 ${colorClass}`}>
                                                    {status.icon}
                                                    TAGIHAN {monthName.toUpperCase()}: {status.label}
                                                </div>
                                                {isCaughtUp && (
                                                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1 animate-in slide-in-from-left-2">
                                                        <Check className="w-3 h-3" /> Berhasil bayar untuk bulan ini!
                                                    </p>
                                                )}
                                                {!isCaughtUp && status.label !== 'LUNAS' && debt.paidThisMonth > 0 && (
                                                    <p className="text-[10px] text-[var(--text-muted)] opacity-60">
                                                        Sisa target: Rp {(currentPeriodTarget - debt.paidThisMonth).toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {debt.installmentAmount > 0 && (
                                <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] border-dashed">
                                    <div className="flex justify-between items-center text-[11px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-widest mb-1">
                                        <span>Rincian Cicilan</span>
                                        {debt.penaltyAmount > 0 && <span>Denda: Rp {debt.penaltyAmount.toLocaleString('id-ID')}</span>}
                                    </div>
                                    <div className="text-sm font-bold text-[var(--text-main)]">
                                        Rp {debt.installmentAmount.toLocaleString('id-ID')} <span className="text-[10px] font-medium opacity-50">/ {debt.installmentIntervalMonths} Bulan</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto">
                                    {debt.installmentAmount > 0 && (
                                    <div className={`mb-6 p-4 rounded-2xl border transition-all duration-500 ${isCaughtUp ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-50 dark:bg-zinc-900 border-[var(--border)]'}`}>
                                                {isCaughtUp ? (
                                                    <div className="flex flex-col items-center justify-center py-2 text-center">
                                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">BULAN INI SELESAI</span>
                                                        <span className="text-[9px] text-[var(--text-muted)] opacity-60 mt-1">
                                                            Target berikutnya mulai: {new Date(nextDue.getFullYear(), nextDue.getMonth(), 1).toLocaleDateString('id-ID', { month: 'long' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Progress Cicilan {getMonthNameFromDate(debt.nextInstallmentDueDate)}</span>
                                                                <span className="text-[11px] font-bold text-[var(--text-muted)]">
                                                                    Rp {(debt.paidThisMonth || 0).toLocaleString('id-ID')} / Rp {(currentPeriodTarget || 0).toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                            <span className="text-[13px] font-black text-blue-500">
                                                                {Math.min(100, Math.round(((debt.paidThisMonth || 0) / (currentPeriodTarget || 1)) * 100))}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-blue-500 transition-all duration-1000"
                                                                style={{ width: `${Math.min(100, ((debt.paidThisMonth || 0) / (currentPeriodTarget || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                        </div>
                                    )}

                                     <div className="space-y-4">
                                         <div>
                                             <div className="flex justify-between items-end mb-2">
                                                 <div className="flex flex-col">
                                                     <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Progress Pelunasan Total</span>
                                                     {debt.installmentAmount > 0 && (
                                                         <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">
                                                             {Math.floor(debt.paidAmount / debt.installmentAmount)} / {Math.ceil(debt.totalAmount / debt.installmentAmount)} Bulan Lunas
                                                         </span>
                                                     )}
                                                 </div>
                                                 <span className="text-[13px] font-black text-emerald-500">{Math.round((debt.paidAmount / debt.totalAmount) * 100)}%</span>
                                             </div>
                                             <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-[var(--border)]">
                                                 <div 
                                                     className="h-full bg-emerald-500 transition-all duration-1000"
                                                     style={{ width: `${(debt.paidAmount / debt.totalAmount) * 100}%` }}
                                                 />
                                             </div>
                                         </div>
                                     </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pt-4 border-t border-[var(--border)] border-dashed">
                                     <div className="flex-1">
                                         <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.1em] mb-0.5">Sisa Hutang</div>
                                         <div className="text-lg md:text-xl font-serif text-emerald-600 dark:text-emerald-400 break-all">Rp {debt.remainingAmount.toLocaleString('id-ID')}</div>
                                     </div>
                                     <div className="text-left sm:text-right flex-1">
                                         <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.1em] mb-0.5">Total Pinjaman</div>
                                         <div className="text-lg md:text-xl font-serif text-[var(--text-main)] break-all">Rp {debt.totalAmount.toLocaleString('id-ID')}</div>
                                     </div>
                                 </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleViewHistory(debt.id)}
                                            className="py-3 bg-slate-100 dark:bg-white/5 text-[var(--text-muted)] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
                                        >
                                            <History className="w-4 h-4" /> Riwayat
                                        </button>
                                    </div>
                                    {canManageDebt && (
                                        <button
                                            disabled={debt.status === 'paid'}
                                            onClick={() => setIsPaying(debt.id)}
                                            className="w-full py-4 bg-[var(--text-main)] text-[var(--background)] rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/5"
                                        >
                                            <ArrowUpCircle className="w-5 h-5" /> Bayar Cicilan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {isPaying && (() => {
                const currentDebt = debts.find(d => d.id === isPaying);
                if (!currentDebt) return null;

                const isLate = (() => {
                    const d = new Date(currentDebt.nextInstallmentDueDate);
                    d.setHours(0, 0, 0, 0);
                    const n = new Date();
                    n.setHours(0, 0, 0, 0);
                    return n > d;
                })();

                const currentPeriodTarget = currentDebt.installmentAmount + (isLate ? currentDebt.penaltyAmount : 0);
                const shortfall = Math.max(0, currentPeriodTarget - (currentDebt.paidThisMonth || 0));

                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 bg-animate-in fade-in duration-300">
                        <div className="bg-[var(--surface-card)] rounded-[40px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-[var(--border)] max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-serif text-[var(--text-main)] mb-1">Catat Pembayaran</h3>
                                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Untuk: {currentDebt.name}
                                    </p>
                                </div>
                                <button onClick={() => setIsPaying(null)} className="p-2 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Debt Settings Toggle Section */}
                                <div className={`overflow-hidden border border-[var(--border)] rounded-3xl transition-all duration-500 ${showPaymentDetails ? 'bg-[var(--background)]' : 'bg-black/5 dark:bg-white/5'}`}>
                                    <button 
                                        onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                                        className="w-full px-6 py-4 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                <Info className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Rincian Aturan & Kontrak</span>
                                        </div>
                                        <Plus className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${showPaymentDetails ? 'rotate-45' : ''}`} />
                                    </button>

                                    {showPaymentDetails && (
                                        <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Mulai Hutang</div>
                                                    <div className="text-sm font-bold text-[var(--text-main)]">{new Date(currentDebt.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                </div>
                                                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Jatuh Tempo Akhir</div>
                                                    <div className="text-sm font-bold text-[var(--text-main)] text-red-500">{new Date(currentDebt.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                </div>
                                                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Jatuh Tempo Rutin</div>
                                                    <div className="text-sm font-bold text-[var(--text-main)]">Tiap Tanggal {currentDebt.paymentDay}</div>
                                                </div>
                                                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Interval</div>
                                                    <div className="text-sm font-bold text-[var(--text-main)]">Tiap {currentDebt.installmentIntervalMonths} Bulan</div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/20">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[9px] font-black text-red-500 uppercase tracking-widest">Denda Keterlambatan</div>
                                                    <div className="text-sm font-black text-red-500">Rp {currentDebt.penaltyAmount.toLocaleString('id-ID')}</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] italic leading-relaxed opacity-70">
                                                "{currentDebt.description || 'Tidak ada deskripsi rincian kontrak.'}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Current Status Summary */}
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px]">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Target: {getMonthNameFromDate(currentDebt.nextInstallmentDueDate)}</div>
                                        <div className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest">Aktif</div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-700/60 font-bold">Harus Dibayar</span>
                                            <span className="font-black text-emerald-700">Rp {currentPeriodTarget.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-700/60 font-bold">Sudah Masuk</span>
                                            <span className="font-black text-emerald-500">Rp {(currentDebt.paidThisMonth || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center">
                                            <span className="text-xs font-black text-emerald-600 uppercase">Kekurangan</span>
                                            <span className="text-xl font-heading font-black text-emerald-700">
                                                Rp {shortfall.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {paymentError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-600 font-bold leading-relaxed">{paymentError}</p>
                                    </div>
                                )}

                                {isConfirming ? (
                                    <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-[32px] text-center space-y-6 animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-amber-500/20 rotate-3">
                                            <Info className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-serif text-[var(--text-main)]">Konfirmasi Nominal</h4>
                                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                                Jumlah <span className="font-black text-[var(--text-main)]">Rp {payment.amount.toLocaleString('id-ID')}</span> melebihi sisa hutang (<span className="font-black text-[var(--text-main)]">Rp {currentDebt.remainingAmount.toLocaleString('id-ID')}</span>).
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button onClick={onPaymentSubmit} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all">Ya, Tetap Catat</button>
                                            <button onClick={() => setIsConfirming(false)} className="w-full py-4 bg-black/5 text-[var(--text-muted)] rounded-2xl font-bold transition-all">Batal</button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={onPaymentSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Tanggal Bayar</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-bold text-[var(--text-main)]"
                                                        value={payment.paymentDate}
                                                        onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Pilih Dompet</label>
                                                    <select
                                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-bold text-[var(--text-main)]"
                                                        value={payment.walletId}
                                                        onChange={(e) => setPayment({ ...payment, walletId: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Dompet</option>
                                                        {wallets.filter(w => w.userId === currentUserId).map(w => (
                                                            <option key={w.id} value={w.id}>{w.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Jumlah Pembayaran (Rp)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/30 font-bold text-2xl text-[var(--text-main)]"
                                                    value={formatRupiah(payment.amount) || ''}
                                                    onChange={(e) => setPayment({ ...payment, amount: parseRupiah(e.target.value) })}
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Catatan</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-bold text-[var(--text-main)]"
                                                    value={payment.description}
                                                    onChange={(e) => setPayment({ ...payment, description: e.target.value })}
                                                    placeholder="Opsional..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <button type="submit" className="flex-1 py-4 bg-[var(--text-main)] text-[var(--background)] rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-black/10">Catat Pembayaran</button>
                                            <button type="button" onClick={() => setIsPaying(null)} className="px-8 py-4 bg-black/5 text-[var(--text-muted)] rounded-2xl font-bold transition-all">Batal</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* History Modal */}
            {viewHistory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[var(--surface-card)] rounded-[40px] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] border border-[var(--border)]">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-serif text-[var(--text-main)]">Riwayat Pembayaran</h3>
                            <button onClick={() => setViewHistory(null)} className="p-2 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-[var(--text-muted)] opacity-70 mb-8">Daftar cicilan yang telah dibayarkan untuk hutang ini.</p>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {loadingHistory ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-[32px] border border-dashed border-[var(--border)]">
                                    <div className="w-16 h-16 bg-[var(--surface-card)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)] opacity-50 border border-[var(--border)]">
                                        <Info className="w-8 h-8" />
                                    </div>
                                    <p className="text-[var(--text-muted)] font-bold">Belum ada riwayat pembayaran.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyData.map((h) => {
                                        const isPayment = h.type === 'payment';
                                        const wallet = wallets.find(w => w.id === h.walletId);
                                        
                                        return (
                                            <div key={h.id} className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-[var(--border)] flex items-center justify-between group hover:bg-[var(--surface-card)] hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 bg-[var(--surface-card)] rounded-xl flex items-center justify-center ${isPayment ? 'text-emerald-500' : 'text-red-500'} group-hover:scale-110 transition-transform border border-[var(--border)]`}>
                                                        {isPayment ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                         <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                                                             {isPayment ? (h.description || 'Cicilan Hutang') : 'Denda Keterlambatan'}
                                                             {h.isLate && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase">Terlambat</span>}
                                                         </div>
                                                        <div className="text-[10px] text-[var(--text-muted)] opacity-80 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                            <span>{new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                            {isPayment && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{wallet?.name || 'Wallet'}</span>
                                                                    {h.userName && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="text-[var(--primary)]">Oleh: {h.userName}</span>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                            {!isPayment && h.description && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-red-500/80 lowercase italic">{h.description}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`text-sm font-bold ${isPayment ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {isPayment ? '-' : '+'} Rp {h.amount.toLocaleString('id-ID')}
                                                    </div>
                                                    
                                                    {isPayment && h.transactionId && canManageDebt && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteHistoryItem(h.transactionId, h.date);
                                                            }}
                                                            className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            title="Hapus Pembayaran"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-8 mt-4 border-t border-[var(--border)]">
                            <button 
                                onClick={() => setViewHistory(null)} 
                                className="w-full py-4 bg-[var(--primary)] text-white rounded-3xl font-black text-sm hover:opacity-90 transition-all uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[var(--surface-card)] rounded-[40px] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 border border-[var(--border)] overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-serif text-[var(--text-main)]">Edit Catatan Hutang</h3>
                                <p className="text-[var(--text-muted)] text-sm">Sesuaikan detail hutang dan cicilan Anda.</p>
                            </div>
                            <button onClick={() => setIsEditing(null)} className="p-2 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={onEditSubmit} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Nama Hutang</label>
                                    <input
                                        type="text"
                                        value={isEditing.name}
                                        onChange={(e) => setIsEditing({ ...isEditing, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Mulai Hutang</label>
                                    <input
                                        type="date"
                                        value={isEditing.startDate ? isEditing.startDate.split('T')[0] : ''}
                                        onChange={(e) => setIsEditing({ ...isEditing, startDate: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Jatuh Tempo Akhir</label>
                                    <input
                                        type="date"
                                        value={isEditing.dueDate ? isEditing.dueDate.split('T')[0] : ''}
                                        onChange={(e) => setIsEditing({ ...isEditing, dueDate: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-[var(--border)] border-dashed">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest flex items-center gap-2">
                                    Tanggal Bayar Tiap Bulan
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">1-31</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={isEditing.paymentDay}
                                    onChange={(e) => setIsEditing({ ...isEditing, paymentDay: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border)] border-dashed">
                                 <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Tiap Berapa Bulan</label>
                                    <input
                                        type="number"
                                        value={isEditing.installmentIntervalMonths}
                                        onChange={(e) => setIsEditing({ ...isEditing, installmentIntervalMonths: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Jumlah Cicilan</label>
                                    <input
                                        type="text"
                                        value={formatRupiah(isEditing.installmentAmount) || ''}
                                        onChange={(e) => setIsEditing({ ...isEditing, installmentAmount: parseRupiah(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Biaya Denda</label>
                                    <input
                                        type="text"
                                        value={formatRupiah(isEditing.penaltyAmount) || ''}
                                        onChange={(e) => setIsEditing({ ...isEditing, penaltyAmount: parseRupiah(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                            </div>

                            {isEditing.installmentIntervalMonths > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Batas Bayar Bulan Ini</label>
                                    <input
                                        type="date"
                                        max={isEditing.dueDate ? isEditing.dueDate.split('T')[0] : undefined}
                                        value={isEditing.nextInstallmentDueDate && !isEditing.nextInstallmentDueDate.startsWith('0001') ? isEditing.nextInstallmentDueDate.split('T')[0] : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (isEditing.dueDate && val > isEditing.dueDate.split('T')[0]) {
                                                return; // Prevent value > final due date
                                            }
                                            setIsEditing({ ...isEditing, nextInstallmentDueDate: val });
                                        }}
                                        className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold text-[var(--text-main)]"
                                    />
                                    <p className="text-[10px] text-[var(--text-muted)]">Tanggal ini jadi acuan status "LUNAS" di dashboard. Tidak boleh melebihi Jatuh Tempo Akhir.</p>
                                </div>
                            )}

                            {/* Simulation for Edit Modal */}
                            {isEditing.totalAmount > 0 && isEditing.installmentAmount > 0 && isEditing.installmentIntervalMonths > 0 && (
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Analisis Pelunasan</div>
                                        <p className="text-sm text-[var(--text-main)] leading-relaxed">
                                            Hutang akan lunas dalam <span className="font-bold text-emerald-600">{Math.ceil(isEditing.totalAmount / isEditing.installmentAmount)} kali bayar</span> ({Math.ceil((isEditing.totalAmount / isEditing.installmentAmount) * isEditing.installmentIntervalMonths)} bulan).
                                            Estimasi lunas: <span className="font-black text-[var(--text-main)]">
                                                {(() => {
                                                    const months = Math.ceil((isEditing.totalAmount / isEditing.installmentAmount) * isEditing.installmentIntervalMonths);
                                                    const date = new Date(isEditing.nextInstallmentDueDate || new Date());
                                                    date.setMonth(date.getMonth() + months);
                                                    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                                })()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[var(--text-muted)] opacity-80 uppercase tracking-widest">Deskripsi</label>
                                <textarea
                                    value={isEditing.description}
                                    onChange={(e) => setIsEditing({ ...isEditing, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all min-h-[80px] text-[var(--text-main)]"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 py-4 bg-[var(--primary)] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg">Simpan Perubahan</button>
                                <button type="button" onClick={() => setIsEditing(null)} className="px-8 py-4 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] rounded-2xl font-bold">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const getMonthNameFromDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch (e) {
        return '-';
    }
};
