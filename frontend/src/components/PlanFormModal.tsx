import React, { useState, useEffect } from 'react';
import { X, Package, Shield, Users, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (planData: any) => void;
    initialData?: any;
    title: string;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}) => {
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        max_members: 5,
        duration_days: 30,
        description: '',
        features: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                price: initialData.price || 0,
                max_members: initialData.max_members || 5,
                duration_days: initialData.duration_days || 30,
                description: initialData.description || '',
                features: initialData.features || ''
            });
        } else {
            setFormData({
                name: '',
                price: 0,
                max_members: 5,
                duration_days: 30,
                description: '',
                features: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'max_members' || name === 'duration_days' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12 overflow-hidden">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-[var(--surface-card)] rounded-[24px] mobile:rounded-[32px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-md px-6 mobile:px-8 py-5 mobile:py-6 flex items-center justify-between border-b border-[var(--border)] z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="font-serif text-[24px] tracking-tight text-[var(--text-main)]">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-label font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Nama Paket
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Contoh: Paket Sultan"
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Harga (Rp)
                            </label>
                            <input
                                type="number"
                                required
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Slot Member
                            </label>
                            <input
                                type="number"
                                required
                                name="max_members"
                                value={formData.max_members}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Durasi Aktif (Hari)
                            </label>
                            <input
                                type="number"
                                required
                                name="duration_days"
                                value={formData.duration_days}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                Deskripsi Pendek
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Jelaskan paket ini secara singkat..."
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-2xl text-[14px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                Fitur (Pisahkan dengan titik koma ;)
                            </label>
                            <textarea
                                name="features"
                                value={formData.features}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Contoh: Laporan Harian;Backup Data;Eksport PDF"
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-2xl text-[14px] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-2xl text-[15px] font-bold hover:opacity-80 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-emerald-900/10 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Simpan Paket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
