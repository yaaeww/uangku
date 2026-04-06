import React, { useState, useMemo } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, TrendingDown, AlertTriangle } from 'lucide-react';
import { useModal } from '../providers/ModalProvider';

interface PlatformExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (expense: any) => Promise<void>;
    initialData?: any;
    categories?: any[];
    allocations?: any[];
    expenseTarget?: number;
}

export const PlatformExpenseModal = ({ isOpen, onClose, onSubmit, initialData, categories: dynamicCategories, allocations, expenseTarget }: PlatformExpenseModalProps) => {
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Operasional',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const categories = useMemo(() => {
        let cats = [];
        if (dynamicCategories && dynamicCategories.length > 0) {
            cats = dynamicCategories.map(c => c.name);
        } else {
            cats = ['Operasional', 'Gaji', 'Marketing', 'Administrasi', 'Lain-lain'];
        }
        
        // Ensure Gateway Fee is always available as a special system category
        if (!cats.includes('Biaya Gateway (TriPay)')) {
            cats.unshift('Biaya Gateway (TriPay)');
        }
        return cats;
    }, [dynamicCategories]);

    const getAllocationInfo = () => {
        const alloc = allocations?.find((a: any) => a.category_name === formData.category);
        if (!alloc) {
            // Special fallback for System categories if they're not being matched by name
            if (formData.category === 'Biaya Gateway (TriPay)') {
                return allocations?.find((a: any) => a.category_id === 'tax-gateway');
            }
            if (formData.category === 'Pajak PPN (11%)') {
                return allocations?.find((a: any) => a.category_id === 'tax-ppn');
            }
            return null;
        }
        return alloc;
    };

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                category: initialData.category || 'Operasional',
                amount: initialData.amount.toString() || '',
                description: initialData.description || '',
                expense_date: initialData.expense_date ? new Date(initialData.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData, isOpen]);

    React.useEffect(() => {
        if (!initialData && categories.length > 0 && !categories.includes(formData.category)) {
            setFormData(prev => ({ ...prev, category: categories[0] }));
        }
    }, [categories, initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        
        if (amount <= 0) {
            showAlert('Validasi', 'Jumlah pengeluaran harus lebih besar dari 0!', 'danger');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                id: initialData?.id,
                amount: amount,
                // Ensure date is in ISO format for Go time.Time binding
                expense_date: new Date(formData.expense_date).toISOString()
            });
            onClose();
        } catch (error) {
            console.error('Failed to submit expense:', error);
            showAlert('Error', 'Gagal mencatat pengeluaran. Silakan coba lagi.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const alloc = getAllocationInfo();
    const isGatewayCategory = formData.category === 'Biaya Gateway (TriPay)';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 lg:p-12 overflow-hidden">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[24px] md:rounded-[32px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-md px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex items-center justify-between border-b border-[var(--border)] z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-serif text-[24px] tracking-tight text-[var(--text-main)]">{initialData ? 'Perbarui Operasional' : 'Catat Operasional Baru'}</h2>
                            <p className="text-label text-[var(--text-muted)] uppercase tracking-widest font-mono opacity-70">{initialData ? 'Edit Biaya Platform' : 'Input Biaya Platform'}</p>
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
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Jumlah (Rp)</label>
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">Rp</div>
                            <input 
                                required
                                type="text"
                                placeholder="0"
                                className="w-full pl-16 pr-8 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/10 outline-none text-xl font-heading font-black text-[var(--text-main)] transition-all"
                                value={formData.amount ? parseInt(formData.amount, 10).toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({...formData, amount: val});
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category Select */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Kategori</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]/40" />
                                <select 
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/10 outline-none appearance-none font-bold text-[var(--text-main)] text-sm transition-all"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    <optgroup label="PENGELUARAN OPERASIONAL" className="bg-[var(--surface-card)] text-[var(--text-muted)] text-[10px] font-black tracking-widest">
                                        <option value="Biaya Gateway (TriPay)" className="text-[var(--text-main)] font-bold">Biaya Gateway (TriPay)</option>
                                        <option value="Pajak PPN (11%)" className="text-[var(--text-main)] font-bold">Pajak PPN (11%)</option>
                                        {dynamicCategories?.filter(c => c.type !== 'PROFIT' && c.name !== 'Biaya Gateway (TriPay)' && c.name !== 'Pajak PPN (11%)').map(cat => (
                                            <option key={cat.id || cat.name} value={cat.name} className="text-[var(--text-main)]">{cat.name}</option>
                                        ))}
                                        {!dynamicCategories?.some(c => c.type !== 'PROFIT') && !dynamicCategories && (
                                            ['Operasional', 'Gaji', 'Marketing', 'Administrasi', 'Lain-lain'].map(cat => (
                                                <option key={cat} value={cat} className="text-[var(--text-main)]">{cat}</option>
                                            ))
                                        )}
                                    </optgroup>

                                    {dynamicCategories?.some(c => c.type === 'PROFIT') && (
                                        <optgroup label="PEMBAGIAN UNTUNG (PROFIT)" className="bg-[var(--surface-card)] text-[var(--accent)] text-[10px] font-black tracking-widest mt-2">
                                            {dynamicCategories.filter(c => c.type === 'PROFIT').map(cat => (
                                                <option key={cat.id || cat.name} value={cat.name} className="text-[var(--text-main)]">💰 {cat.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]/40" />
                                <input 
                                    required
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/10 outline-none font-bold text-[var(--text-main)] text-sm transition-all"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Budget Context Card */}
                    {(() => {
                        if (!alloc) return null;
                        
                        // Find matching category in the dynamicCategories to know its type
                        const matchedCat = dynamicCategories?.find(c => c.name === formData.category || (isGatewayCategory && c.id === 'tax-gateway'));
                        const isProfitType = matchedCat?.type === 'PROFIT';
                        
                        const remaining = Math.round(alloc.target_amount - alloc.actual_amount);
                        const usedPct = alloc.target_amount > 0 ? Math.min(Math.round((alloc.actual_amount / alloc.target_amount) * 100), 100) : 0;
                        const isOver = isGatewayCategory ? false : remaining < 0; 
                        const isPaidFull = isGatewayCategory && remaining <= 0;
                        
                        const inputAmount = parseFloat(formData.amount) || 0;
                        const afterThis = Math.round(remaining - inputAmount);
                        
                        return (
                            <div className={`p-5 rounded-[32px] border ${isProfitType ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20' : (isGatewayCategory ? (isPaidFull ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20') : (isOver ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'))} space-y-4 shadow-sm`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isProfitType ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : (isGatewayCategory ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}`}>
                                            <TrendingDown className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            {isProfitType ? 'Pos Laba Bersih' : (isGatewayCategory ? 'Rekonsiliasi Fee TriPay' : `Status Anggaran`)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest">
                                        {formData.category}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{isProfitType ? 'Jatah Laba' : (isGatewayCategory ? 'Hutang Fee' : 'Target')}</div>
                                        <div className="font-heading font-black text-xs sm:text-sm text-[var(--text-main)]">
                                            Rp {alloc.target_amount.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{isProfitType ? 'Diambil' : (isGatewayCategory ? 'Dibayar' : 'Terpakai')}</div>
                                        <div className={`font-heading font-black text-xs sm:text-sm ${isProfitType ? 'text-[var(--accent)]' : (isGatewayCategory ? 'text-emerald-500' : 'text-red-500')}`}>
                                            Rp {alloc.actual_amount.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{isProfitType ? 'Sisa Jatah' : (isGatewayCategory ? 'Sisa Hutang' : 'Sisa')}</div>
                                        <div className={`font-heading font-black text-xs sm:text-sm ${remaining > 0 ? (isGatewayCategory ? 'text-amber-500' : (isProfitType ? 'text-[var(--accent)]' : 'text-emerald-500')) : 'text-emerald-500'}`}>
                                            Rp {Math.max(0, remaining).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${isProfitType ? 'bg-[var(--accent)]' : (isGatewayCategory ? 'bg-emerald-500' : (usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'))}`} 
                                        style={{ width: `${usedPct}%` }} 
                                    />
                                </div>

                                {inputAmount > 0 && (
                                    <div className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isProfitType ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : (isGatewayCategory ? (afterThis <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-600') : (afterThis < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'))}`}>
                                        {(isGatewayCategory ? afterThis > 0 : afterThis < 0) ? <AlertTriangle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                        {isProfitType ? 
                                            (afterThis < 0 ? 'Melebihi jatah laba bersih!' : `Sisa laba: Rp ${afterThis.toLocaleString('id-ID')} setelah ini.`) :
                                            (isGatewayCategory ? 
                                                (afterThis <= 0 ? 'Pembayaran ini akan melunasi hutang fee.' : `Sisa hutang: Rp ${afterThis.toLocaleString('id-ID')}`) :
                                                (afterThis < 0 ? 'MELEBIHI ANGGARAN!' : `Sisa budget: Rp ${afterThis.toLocaleString('id-ID')}`)
                                            )
                                        }
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Description Input */}
                    <div className="space-y-2">
                        <label className="text-label font-bold text-[var(--text-muted)] px-2 uppercase tracking-widest">Keterangan / Memo</label>
                        <div className="relative flex items-start">
                            <FileText className="absolute left-4 top-4 w-4 h-4 text-[var(--text-muted)]/40" />
                            <textarea 
                                placeholder="Contoh: Pembayaran Server AWS Maret 2024"
                                className="w-full pl-12 pr-4 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/10 outline-none min-h-[100px] text-sm text-[var(--text-main)] font-medium transition-all"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-[var(--border)] rounded-2xl font-bold text-[13px] uppercase tracking-widest text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-[3] py-4 px-12 bg-[var(--primary)] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/5"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <DollarSign className="w-4 h-4" />
                            )}
                            {initialData ? 'Update Pengeluaran' : 'Simpan Pengeluaran'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
