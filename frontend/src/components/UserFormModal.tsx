import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, CheckCircle2, KeyRound, Briefcase } from 'lucide-react';

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
        email: '',
        password: '',
        role: 'user',
        family_name: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                email: initialData.email || '',
                password: '',
                role: initialData.role || 'user',
                family_name: ''
            });
        } else {
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'family_admin', // Default to family_admin for new users as requested
                family_name: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const showFamilyInput = !initialData && formData.role !== 'super_admin' && formData.role !== 'writer';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12 overflow-hidden">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-[var(--surface-card)] rounded-[24px] mobile:rounded-[32px] max-w-[480px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-md px-6 mobile:px-8 py-5 mobile:py-6 flex items-center justify-between border-b border-[var(--border)] z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center">
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
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Nama Lengkap
                            </label>
                            <input
                                required
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Alamat Email
                            </label>
                            <input
                                type="email"
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5" /> Password
                            </label>
                            <input
                                type="password"
                                required={!initialData}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={initialData ? "Kosongkan jika tidak ingin diubah" : "Masukkan password (min. 6 karakter)"}
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> Peran (Role)
                            </label>
                            <select
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[15px] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all font-bold"
                            >
                                <option value="family_admin">Admin Keluarga (Kepala)</option>
                                <option value="user">User Biasa</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="family_member">Anggota Keluarga</option>
                                <option value="writer">Content Writer</option>
                            </select>
                        </div>

                        {showFamilyInput && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" /> Nama Keluarga Baru
                                </label>
                                <input
                                    required
                                    name="family_name"
                                    value={formData.family_name}
                                    onChange={handleChange}
                                    placeholder="Contoh: Keluarga Cemara"
                                    className="w-full px-4 py-3.5 bg-[var(--primary)]/5 text-[var(--text-main)] border border-[var(--primary)]/20 rounded-xl text-[15px] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                                />
                                <p className="text-[10px] text-[var(--text-muted)] italic">
                                    *User akan otomatis menjadi Kepala Keluarga di keluarga ini.
                                </p>
                            </div>
                        )}
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
                            className="flex-1 py-4 bg-[var(--primary)] text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-black/5 hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
