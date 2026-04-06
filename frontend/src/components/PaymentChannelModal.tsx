import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info, Percent, PhilippinePeso as RpIcon } from 'lucide-react';

interface PaymentChannel {
    id?: string;
    code: string;
    name: string;
    group: string;
    type: string;
    fee_flat: number;
    fee_percent: number;
    is_active: boolean;
    fee_borne_by: string;
    custom_fee_merchant: number;
    icon_url: string;
    is_manual?: boolean;
    account_name?: string;
    account_number?: string;
    description?: string;
}

interface PaymentChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PaymentChannel) => void;
    initialData: PaymentChannel | null;
}

export const PaymentChannelModal: React.FC<PaymentChannelModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    initialData 
}) => {
    const [formData, setFormData] = useState<PaymentChannel>({
        id: undefined,
        code: '',
        name: '',
        group: '',
        type: '',
        fee_flat: 0,
        fee_percent: 0,
        is_active: true,
        fee_borne_by: 'merchant',
        custom_fee_merchant: 0,
        icon_url: ''
    });

    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Reset for new manual channel
            setFormData({
                id: undefined,
                code: '',
                name: '',
                group: 'Manual Transfer',
                type: 'direct',
                fee_flat: 0,
                fee_percent: 0,
                is_active: true,
                fee_borne_by: 'customer',
                custom_fee_merchant: 0,
                icon_url: '',
                is_manual: true,
                account_name: '',
                account_number: '',
                description: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);
            formDataUpload.append('code', formData.code || 'manual');

            const response = await fetch('/api/v1/admin/payment-channels/upload-logo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataUpload
            });

            const data = await response.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, icon_url: data.url }));
            }
        } catch (error) {
            console.error('Logo upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggle = () => {
        setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--surface-card)] w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 relative shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-dagang-amber/10 text-dagang-amber rounded-2xl flex items-center justify-center">
                            {initialData?.icon_url ? (
                                <img src={initialData.icon_url} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                                <RpIcon className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-heading font-black text-[var(--text-main)]">
                                {initialData ? `Konfigurasi ${formData.name}` : 'Tambah Manual Bank'}
                            </h2>
                            <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">{formData.code || 'BARU'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute right-8 top-8 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-[var(--text-muted)]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                        {/* Common Basic Info for Manual */}
                        {formData.is_manual && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[var(--test-muted)] uppercase tracking-widest">Nama Bank</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Contoh: BANK BCA"
                                        className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[var(--test-muted)] uppercase tracking-widest">Kode Unik</label>
                                    <input 
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        placeholder="Contoh: BCA_MANUAL"
                                        className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Status & Borne By */}
                        <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Status Aktif</label>
                            <button 
                                type="button"
                                onClick={handleToggle}
                                className={`
                                    w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                                    ${formData.is_active 
                                        ? 'bg-dagang-green/10 border-dagang-green/30 text-dagang-green' 
                                        : 'bg-red-500/10 border-red-500/30 text-red-500'}
                                `}
                            >
                                <span className="font-bold">{formData.is_active ? 'Metode Aktif' : 'Metode Mati'}</span>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.is_active ? 'bg-dagang-green' : 'bg-red-500'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-5' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Ditanggung Oleh</label>
                            <select 
                                name="fee_borne_by"
                                value={formData.fee_borne_by}
                                onChange={handleChange}
                                disabled={!formData.is_manual}
                                className={`w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-bold text-[var(--text-main)] appearance-none cursor-pointer ${!formData.is_manual ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                <option value="merchant">Merchant (Aplikasi)</option>
                                <option value="customer">Customer (Pembeli)</option>
                            </select>
                        </div>
                    </div>

                    {/* Manual Bank Fields */}
                    {formData.is_manual && (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">No. Rekening</label>
                                    <input 
                                        type="text"
                                        name="account_number"
                                        value={formData.account_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-mono font-bold text-[var(--text-main)]"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Nama Pemilik</label>
                                    <input 
                                        type="text"
                                        name="account_name"
                                        value={formData.account_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-bold text-[var(--text-main)]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Scan QR (Static QRIS / Rekening)</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl flex items-center justify-center overflow-hidden">
                                        {formData.icon_url ? (
                                            <img src={formData.icon_url} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <RpIcon className="w-6 h-6 text-[var(--text-muted)]" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            onChange={handleLogoUpload} 
                                            accept="image/*"
                                            className="hidden" 
                                            id="bank-logo-upload" 
                                        />
                                        <label 
                                            htmlFor="bank-logo-upload"
                                            className="px-4 py-2 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-xs font-bold hover:bg-black/5 cursor-pointer transition-colors inline-block"
                                        >
                                            {isUploading ? 'Mengunggah...' : 'Pilih Gambar QR (WebP Auto)'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Instruksi Pembayaran</label>
                                <textarea 
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Contoh: Silahkan transfer ke rekening diatas dan upload bukti pembayaran..."
                                    className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-medium text-sm text-[var(--text-main)]"
                                />
                            </div>
                        </>
                    )}

                    {/* Fees Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <RpIcon className="w-3 h-3" /> Fee Flat (Rp)
                            </label>
                            <input 
                                type="number"
                                name="fee_flat"
                                value={formData.fee_flat}
                                onChange={handleChange}
                                disabled={!formData.is_manual}
                                className={`w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-mono font-bold text-[var(--text-main)] ${!formData.is_manual ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Percent className="w-3 h-3" /> Fee Percent (%)
                            </label>
                            <input 
                                type="number"
                                step="0.01"
                                name="fee_percent"
                                value={formData.fee_percent}
                                onChange={handleChange}
                                disabled={!formData.is_manual}
                                className={`w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-mono font-bold text-[var(--text-main)] ${!formData.is_manual ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Custom Fee */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-3 h-3" /> Custom Admin Fee Platform (Rp)
                        </label>
                        <input 
                            type="number"
                            name="custom_fee_merchant"
                            value={formData.custom_fee_merchant}
                            onChange={handleChange}
                            placeholder="Tambahkan biaya admin tambahan..."
                            className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-mono font-bold text-[var(--text-main)]"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] font-medium px-2">
                            *Biaya ini akan ditambahkan ke total yang harus dibayar jika ditanggung Customer.
                        </p>
                    </div>

                    {/* Warning Box */}
                    {!formData.is_manual && (
                        <div className="bg-dagang-amber/10 border border-dagang-amber/20 p-4 rounded-2xl flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-dagang-amber shrink-0 mt-0.5" />
                            <p className="text-[11px] text-[var(--text-main)] leading-relaxed">
                                <b>Pengaturan Terkunci:</b> Nilai Fee dan status "Ditanggung Oleh" untuk metode otomatis (Tripay) dikunci karena mengikuti kebijakan real-time dari provider.
                            </p>
                        </div>
                    )}

                    </div>

                    {/* Footer Buttons */}
                    <div className="p-6 md:p-8 border-t border-[var(--border)] flex gap-4 bg-[var(--surface-card)] shrink-0">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-[var(--surface-subtle)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-main)] rounded-2xl font-bold transition-all border border-[var(--border)]"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-6 py-4 bg-dagang-amber hover:bg-dagang-amber/90 text-dagang-emerald-900 rounded-2xl font-black transition-all shadow-lg shadow-dagang-amber/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {initialData ? 'Simpan Perubahan' : 'Tambah Metode'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
