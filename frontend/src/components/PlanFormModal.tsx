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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12">
            <div 
                className="absolute inset-0 bg-[#faf8f3]/60 backdrop-blur-lg animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-white rounded-[24px] mobile:rounded-[32px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[0_48px_140px_rgba(0,0,0,0.12)] border border-black/5 animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 mobile:px-8 py-5 mobile:py-6 flex items-center justify-between border-b border-black/5 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-dagang-green-pale text-dagang-green rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="font-heading text-h3 mobile:text-h2 tracking-tight">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-dagang-cream rounded-full transition-colors text-dagang-gray/40 hover:text-dagang-dark"
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
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Harga (Rp)
                            </label>
                            <input
                                type="number"
                                required
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Slot Member
                            </label>
                            <input
                                type="number"
                                required
                                name="max_members"
                                value={formData.max_members}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Durasi Aktif (Hari)
                            </label>
                            <input
                                type="number"
                                required
                                name="duration_days"
                                value={formData.duration_days}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all"
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
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-2xl text-[14px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                Fitur (Pisahkan dengan titik koma ;)
                            </label>
                            <textarea
                                name="features"
                                value={formData.features}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Contoh: Laporan Harian;Backup Data;Eksport PDF"
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-2xl text-[14px] focus:ring-2 focus:ring-dagang-green/20 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-dagang-cream text-dagang-dark rounded-2xl text-[15px] font-bold hover:bg-dagang-cream-dark transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-dagang-green text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-dagang-green/20 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Simpan Paket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
