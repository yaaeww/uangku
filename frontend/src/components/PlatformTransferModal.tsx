import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, DollarSign, Calendar, AlignLeft, AlertTriangle, Edit3, TrendingDown, TrendingUp } from 'lucide-react';
import { useModal } from '../providers/ModalProvider';

interface PlatformTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transfer: any) => Promise<void>;
    allocations: any[]; 
    initialData?: any;
}

export const PlatformTransferModal = ({ isOpen, onClose, onSubmit, allocations, initialData }: PlatformTransferModalProps) => {
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        from_category: '',
        to_category: '',
        amount: '',
        type: 'TAKEN', // TAKEN or RETURN
        reason: '',
        transfer_date: new Date().toISOString().split('T')[0]
    });

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    from_category: initialData.from_category || '',
                    to_category: initialData.to_category || '',
                    amount: String(initialData.amount || ''),
                    type: initialData.type || 'TAKEN',
                    reason: initialData.reason || '',
                    transfer_date: initialData.transfer_date ? new Date(initialData.transfer_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                });
            } else {
                const firstValid = allocations?.find(a => a.target_amount > a.actual_amount);
                setFormData({
                    from_category: firstValid?.category_name || '',
                    to_category: '',
                    amount: '',
                    type: 'TAKEN',
                    reason: '',
                    transfer_date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, initialData, allocations]);
    const validSources = useMemo(() => {
        if (!allocations) return [];
        // If taking, must have balance. If returning, the borrower is the source.
        if (formData.type === 'TAKEN' && !initialData) {
            return allocations.filter(a => a.target_amount > a.actual_amount);
        }
        return allocations;
    }, [allocations, formData.type, initialData]);

    const validDestinations = useMemo(() => {
        if (!allocations) return [];
        return allocations;
    }, [allocations]);

    if (!isOpen) return null;

    const sourceAlloc = allocations?.find(a => a.category_name === formData.from_category);
    const destAlloc = allocations?.find(a => a.category_name === formData.to_category);
    
    // Adjust source remaining to include the current transfer if editing
    const initialAmount = (initialData && initialData.from_category === formData.from_category) ? parseFloat(initialData.amount) : 0;
    const sourceRemaining = sourceAlloc ? Math.round(sourceAlloc.target_amount - sourceAlloc.actual_amount + initialAmount) : 0;
    
    // Calculate preview for destination
    const destInitialAmount = (initialData && initialData.to_category === formData.to_category) ? parseFloat(initialData.amount) : 0;
    const destRemaining = destAlloc ? Math.round(destAlloc.target_amount - destAlloc.actual_amount - destInitialAmount) : 0;

    const transferAmount = parseFloat(formData.amount) || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (transferAmount <= 0) {
            showAlert('Validasi', 'Jumlah transfer harus lebih besar dari 0!', 'danger');
            return;
        }

        if (formData.from_category === formData.to_category) {
            showAlert('Validasi', 'Kategori sumber dan tujuan tidak boleh sama!', 'danger');
            return;
        }

        if (transferAmount > sourceRemaining) {
            showAlert('Validasi', 'Jumlah transfer melebihi sisa target!', 'danger');
            return;
        }

        if (!formData.reason.trim()) {
            showAlert('Validasi', 'Keterangan/alasan wajib diisi!', 'danger');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                amount: transferAmount,
                transfer_date: new Date(formData.transfer_date).toISOString()
            });
            onClose();
        } catch (error) {
            console.error('Failed to submit transfer:', error);
            showAlert('Error', 'Gagal memindahkan budget. Silakan coba lagi.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 lg:p-12 overflow-hidden">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[24px] md:rounded-[32px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-md px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex items-center justify-between border-b border-[var(--border)] z-20">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${initialData ? 'bg-amber-500/10 text-amber-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'} rounded-xl flex items-center justify-center`}>
                            {initialData ? <Edit3 className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-serif text-[24px] tracking-tight text-[var(--text-main)]">
                                {initialData ? 'Edit Penyesuaian' : 'Pindah Budget'}
                            </h2>
                            <p className="text-label text-[var(--text-muted)] uppercase tracking-widest font-mono opacity-70">Alokasi Dinamis Internal</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                    {/* Type Toggle */}
                    <div className="space-y-2">
                        <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest text-[10px]">Tipe Penyesuaian</label>
                        <div className="grid grid-cols-2 gap-2 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'TAKEN' })}
                                className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                    formData.type === 'TAKEN' 
                                    ? 'bg-[var(--accent)] text-white shadow-lg' 
                                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    Ambil Budget
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'RETURN' })}
                                className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                    formData.type === 'RETURN' 
                                    ? 'bg-blue-500 text-white shadow-lg' 
                                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Kembalikan
                                </div>
                            </button>
                        </div>
                    </div>
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Jumlah Pindah (Rp)</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">Rp</div>
                            <input 
                                required
                                type="text"
                                placeholder="0"
                                className="w-full pl-16 pr-8 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--accent)]/30 outline-none text-xl font-heading font-black text-[var(--text-main)] transition-all"
                                value={formData.amount ? parseInt(formData.amount, 10).toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({...formData, amount: val});
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* From Category Select */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Dari Kategori</label>
                            <div className="relative">
                                <select 
                                    className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--accent)]/30 outline-none appearance-none font-bold text-[var(--text-main)] text-sm transition-all"
                                    value={formData.from_category}
                                    onChange={(e) => setFormData({...formData, from_category: e.target.value})}
                                    required
                                >
                                    <option value="" disabled>Pilih Sumber</option>
                                    {validSources.map(a => (
                                        <option key={a.category_id} value={a.category_name} className="bg-[var(--surface-card)] text-[var(--text-main)]">
                                            {a.category_name} (Sisa: Rp {Math.round(a.target_amount - a.actual_amount + ((initialData && initialData.from_category === a.category_name) ? parseFloat(initialData.amount) : 0)).toLocaleString('id-ID')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* To Category Select */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Ke Kategori</label>
                            <div className="relative">
                                <select 
                                    className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--accent)]/30 outline-none appearance-none font-bold text-[var(--text-main)] text-sm transition-all"
                                    value={formData.to_category}
                                    onChange={(e) => setFormData({...formData, to_category: e.target.value})}
                                    required
                                >
                                    <option value="" disabled>Pilih Tujuan</option>
                                    {validDestinations.filter(a => a.category_name !== formData.from_category).map(a => (
                                        <option key={a.category_id} value={a.category_name} className="bg-[var(--surface-card)] text-[var(--text-main)]">
                                            {a.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Tanggal Pemindahan</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]/40" />
                                <input 
                                    required
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--accent)]/30 outline-none font-bold text-[var(--text-main)] text-sm transition-all"
                                    value={formData.transfer_date}
                                    onChange={(e) => setFormData({...formData, transfer_date: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Reason / Notes */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Alasan/Keterangan</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-[var(--text-muted)]/40" />
                                <textarea 
                                    required
                                    placeholder="Contoh: Tambahan budget promosi akhir bulan"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--accent)]/30 outline-none font-bold text-[var(--text-main)] text-sm transition-all resize-none h-24"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                />
                                </div>
                        </div>
                    </div>

                    {/* Two-Way Preview Dashboard */}
                    {transferAmount > 0 && sourceAlloc && destAlloc && (
                        <div className="space-y-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] animate-fade-in">
                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Simulasi Saldo Dana:</div>
                            
                            <div className="flex items-center gap-3">
                                {/* Source Card */}
                                <div className="flex-1 p-3 bg-[var(--surface-card)] rounded-xl border border-[var(--border)] shadow-sm">
                                    <div className="text-[8px] font-bold text-red-500 uppercase mb-1 truncate">{sourceAlloc.category_name}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                            Rp {Math.round(sourceRemaining).toLocaleString('id-ID')}
                                        </div>
                                        <ArrowRightLeft className="w-3 h-3 text-[var(--text-muted)] opacity-30" />
                                        <div className="text-[11px] font-mono font-black text-[var(--text-main)]">
                                            Rp {Math.round(sourceRemaining - transferAmount).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-red-500/10 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500 transition-all duration-500" 
                                            style={{ width: `${Math.max(0, Math.min(100, ((sourceRemaining-transferAmount)/sourceRemaining)*100))}%` }} 
                                        />
                                    </div>
                                </div>

                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center border border-[var(--border)] shadow-inner">
                                    <ArrowRightLeft className="w-4 h-4 text-[var(--accent)]" />
                                </div>

                                {/* Destination Card */}
                                <div className="flex-1 p-3 bg-[var(--surface-card)] rounded-xl border border-[var(--border)] shadow-sm">
                                    <div className="text-[8px] font-bold text-emerald-500 uppercase mb-1 truncate">{destAlloc.category_name}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                            Rp {Math.round(destAlloc.target_amount - destAlloc.actual_amount - destInitialAmount).toLocaleString('id-ID')}
                                        </div>
                                        <ArrowRightLeft className="w-3 h-3 text-[var(--text-muted)] opacity-30" />
                                        <div className="text-[11px] font-mono font-black text-emerald-500">
                                            Rp {Math.round(destAlloc.target_amount - destAlloc.actual_amount - destInitialAmount + transferAmount).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-emerald-500/10 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 transition-all duration-500" 
                                            style={{ width: `${Math.min(100, ((destRemaining+transferAmount)/(destRemaining+transferAmount+1000000))*100)}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warnings and Notes */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-500">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] sm:text-xs font-bold leading-relaxed">
                            Pemindahan budget akan mengurangi pagu target di kategori sumbar dan menambahkannya di kategori tujuan secara spesifik <strong className="font-black">untuk bulan/periode ini saja</strong>. Persentase alokasi kategori tidak akan berubah permanen.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 sm:pt-6 mt-6 sm:mt-8 border-t border-[var(--border)]">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 sm:py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-main)] rounded-xl font-bold transition-colors text-xs sm:text-sm uppercase tracking-widest"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3.5 sm:py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl font-bold transition-all hover:scale-[1.02] shadow-xl shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-widest"
                            disabled={loading || validSources.length === 0}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Pindah Saldo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
