import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle2 } from 'lucide-react';

interface SettingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    initialValue?: string;
    title: string;
    settingKey: string;
}

export const SettingFormModal: React.FC<SettingFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialValue,
    title,
    settingKey
}) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue || '');
        }
    }, [initialValue, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(value);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12">
            <div 
                className="absolute inset-0 bg-[#faf8f3]/60 backdrop-blur-lg animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-white rounded-[24px] mobile:rounded-[32px] max-w-[480px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[0_48px_140px_rgba(0,0,0,0.12)] border border-black/5 animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 mobile:px-8 py-5 mobile:py-6 flex items-center justify-between border-b border-black/5 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-dagang-accent/20 text-dagang-dark rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-heading text-h3 mobile:text-h2 tracking-tight">{title}</h2>
                            <p className="text-label text-dagang-gray font-mono uppercase tracking-widest opacity-50">{settingKey}</p>
                        </div>
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
                                Nilai Konfigurasi
                            </label>
                            <input
                                required
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Masukkan nilai baru..."
                                className="w-full px-4 py-4 bg-dagang-cream/50 border-none rounded-xl text-[18px] font-bold text-dagang-dark focus:ring-2 focus:ring-dagang-accent outline-none transition-all text-center"
                                autoFocus
                            />
                            <p className="text-[11px] text-dagang-gray italic text-center mt-2">
                                Pastikan format nilai sesuai dengan kebutuhan sistem (misal: angka untuk durasi hari).
                            </p>
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
                            className="flex-1 py-4 bg-dagang-dark text-white rounded-2xl text-[15px] font-bold shadow-xl hover:bg-dagang-accent hover:text-dagang-dark hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
