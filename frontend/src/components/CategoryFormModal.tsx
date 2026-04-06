import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    title: string;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}) => {
    const [name, setName] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [type, setType] = useState('EXPENSE');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setPercentage(initialData.percentage || 0);
            setType(initialData.type || 'EXPENSE');
        } else {
            setName('');
            setPercentage(0);
            setType('EXPENSE');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, percentage: Number(percentage), type });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--surface-card)] w-full max-w-md rounded-[40px] shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-heading font-black text-[var(--text-main)]">{title}</h3>
                        <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest mt-1 opacity-70 italic underline decoration-2 decoration-[var(--accent)]">Atur Alokasi Anggaran</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-4 py-4 px-6 bg-[var(--accent)]/5 rounded-3xl border border-[var(--accent)]/10">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] ml-1">Tipe Kategori</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setType('EXPENSE')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'EXPENSE' ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:bg-black/10'}`}
                            >
                                Pengeluaran
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PROFIT')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'PROFIT' ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:bg-black/10'}`}
                            >
                                Alokasi Laba
                            </button>
                        </div>
                        <p className="text-[8px] text-[var(--text-muted)] opacity-60 ml-2 italic">
                            {type === 'EXPENSE' ? '* Dipotong dari anggaran biaya operasional platform.' : '* Memecah laba bersih menjadi beberapa pos (Dana Cadangan, Payout, dsb).'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] ml-1">Nama Kategori</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'EXPENSE' ? "Gaji, Server, Marketing..." : "Dana Cadangan, Dividen, Investasi..."}
                            className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] transition-all outline-none font-bold text-[var(--text-main)]"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] ml-1">Porsi Dari Anggaran (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                min="0"
                                max="100"
                                step="any"
                                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] transition-all outline-none font-bold text-[var(--text-main)]"
                                required
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[var(--accent)]">%</div>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] opacity-60 ml-2 italic underline decoration-1 decoration-[var(--accent)]">Persentase ini dihitung dari total anggaran pengeluaran (misal 60% dari revenue).</p>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-5 border-2 border-[var(--border)] text-[var(--text-muted)] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black/5 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-8 py-5 bg-[var(--accent)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--accent)]/20"
                        >
                            Simpan Kategori
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
