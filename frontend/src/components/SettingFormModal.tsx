import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle2 } from 'lucide-react';

interface SettingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    onUpload?: (file: File) => Promise<string>;
    initialValue?: string;
    title: string;
    settingKey: string;
}

export const SettingFormModal: React.FC<SettingFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onUpload,
    initialValue,
    title,
    settingKey
}) => {
    const [value, setValue] = useState('');
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue || '');
            setLocalPreview(null);
            setIsUploading(false);
        }
    }, [initialValue, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading) return;
        onSubmit(value);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12 overflow-hidden">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            <div className="bg-[var(--surface-card)] rounded-[24px] mobile:rounded-[32px] max-w-[480px] w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up custom-scrollbar">
                <div className="sticky top-0 bg-[var(--surface-card)]/80 backdrop-blur-md px-6 mobile:px-8 py-5 mobile:py-6 flex items-center justify-between border-b border-[var(--border)] z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-serif text-[24px] tracking-tight text-[var(--text-main)]">{title}</h2>
                            <p className="text-label text-[var(--text-muted)] font-mono uppercase tracking-widest opacity-70">{settingKey}</p>
                        </div>
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
                                Nilai Konfigurasi
                            </label>
                            {settingKey.includes('logo_url') ? (
                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploading}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && onUpload) {
                                                try {
                                                    // Instant local preview
                                                    const objectUrl = URL.createObjectURL(file);
                                                    setLocalPreview(objectUrl);
                                                    
                                                    setIsUploading(true);
                                                    const url = await onUpload(file);
                                                    setValue(url);
                                                    setLocalPreview(null); // Clear local preview once server URL is ready
                                                } catch (err) {
                                                    alert('Gagal upload logo');
                                                    setLocalPreview(null);
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }
                                        }}
                                        className={`w-full px-4 py-4 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    {isUploading && (
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--accent)] font-black uppercase tracking-widest animate-pulse">
                                            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                                            Sedang mengonversi ke WebP...
                                        </div>
                                    )}
                                    {value && (
                                        <div className="flex flex-col items-center gap-2 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Preview Logo</span>
                                            <img 
                                                src={localPreview || (String(value || '').startsWith('http') || String(value || '').startsWith('blob:') ? value : `${(import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}${value}`)} 
                                                alt="Logo Preview" 
                                                className="h-12 object-contain"
                                                onError={(e) => {
                                                    console.error("Preview image failed to load", e);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    required
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="Masukkan nilai baru..."
                                    className="w-full px-4 py-4 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl text-[18px] font-bold focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all text-center"
                                    autoFocus
                                />
                            )}
                            <p className="text-[11px] text-[var(--text-muted)] italic text-center mt-2">
                                {settingKey.includes('logo_url') 
                                    ? 'Pilih file gambar untuk mengganti logo.'
                                    : 'Pastikan format nilai sesuai dengan kebutuhan sistem (misal: angka untuk durasi hari).'}
                            </p>
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
                            disabled={isUploading}
                            className={`flex-1 py-4 bg-[var(--primary)] text-white rounded-2xl text-[15px] font-bold shadow-xl shadow-black/5 hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed translate-y-0' : ''}`}
                        >
                            {isUploading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Tunggu...
                                </span>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" /> Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
