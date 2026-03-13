import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, CheckCircle2 } from 'lucide-react';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
    initialData?: any;
    title: string;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                email: initialData.email || ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            
            <div className="bg-white rounded-[32px] max-w-[480px] w-full relative z-10 shadow-[0_48px_140px_rgba(0,0,0,0.12)] border border-black/5 animate-scale-up">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-black/5 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="font-serif text-[24px] tracking-tight">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-dagang-cream rounded-full transition-colors text-dagang-gray/40 hover:text-dagang-dark"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Nama Lengkap
                            </label>
                            <input
                                required
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Alamat Email
                            </label>
                            <input
                                type="email"
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-[15px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
