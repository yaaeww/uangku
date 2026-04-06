import React, { useState, useEffect } from 'react';
import { AdminController } from '../../controllers/AdminController';
import { 
    RefreshCw, 
    ShieldCheck, 
    AlertCircle, 
    ChevronRight,
    Search,
    CreditCard,
    Smartphone,
    Building2,
    Store,
    Info,
    Pencil,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentChannelModal } from '../../components/PaymentChannelModal';

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

export const PaymentSettings: React.FC = () => {
    const [channels, setChannels] = useState<PaymentChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editModal, setEditModal] = useState<{isOpen: boolean, channel: PaymentChannel | null}>({
        isOpen: false,
        channel: null
    });

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            setLoading(true);
            const data = await AdminController.getPaymentChannels();
            setChannels(data || []);
        } catch (error) {
            toast.error('Gagal mengambil data metode pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await AdminController.syncPaymentChannels();
            toast.success('Metode pembayaran berhasil disinkronkan dengan Tripay');
            fetchChannels();
        } catch (error) {
            toast.error('Gagal sinkronisasi dengan Tripay');
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdate = async (channel: PaymentChannel) => {
        try {
            if (channel.id) {
                await AdminController.updatePaymentChannel(channel);
                toast.success(`${channel.name} diperbarui`);
                setChannels(prev => prev.map(c => c.id === channel.id ? channel : c));
            } else {
                await AdminController.createPaymentChannel(channel);
                toast.success(`${channel.name} berhasil ditambahkan`);
                fetchChannels();
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Gagal menyimpan data';
            toast.error(msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) return;
        try {
            await AdminController.deletePaymentChannel(id);
            toast.success('Metode pembayaran berhasil dihapus');
            setChannels(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    const toggleStatus = (channel: PaymentChannel) => {
        const updated = { ...channel, is_active: !channel.is_active };
        handleUpdate(updated);
    };

    const updateBorneBy = (channel: PaymentChannel, borneBy: string) => {
        const updated = { ...channel, fee_borne_by: borneBy };
        handleUpdate(updated);
    };

    const filteredChannels = channels.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = Array.from(new Set(filteredChannels.map(c => c.group)));

    const getGroupIcon = (group: string) => {
        switch (group.toLowerCase()) {
            case 'virtual account': return <Building2 className="w-5 h-5" />;
            case 'e-wallet': return <Smartphone className="w-5 h-5" />;
            case 'retail outlet': return <Store className="w-5 h-5" />;
            default: return <CreditCard className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <RefreshCw className="w-10 h-10 animate-spin text-dagang-amber mb-4" />
                <p className="text-[var(--text-muted)] font-medium">Memuat konfigurasi pembayaran...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                        type="text"
                        placeholder="Cari bank atau metode pembayaran..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-dagang-amber outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setEditModal({ isOpen: true, channel: null })}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-dagang-amber hover:bg-dagang-amber/90 text-dagang-emerald-900 rounded-2xl font-black transition-all shadow-lg shadow-dagang-amber/20 group"
                >
                    <Building2 className="w-5 h-5" />
                    Tambah Manual Bank
                </button>
                <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-dagang-emerald-600 hover:bg-dagang-green text-white rounded-2xl font-bold transition-all shadow-lg shadow-dagang-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {syncing ? 'Sinkronkan Tripay' : 'Sinkronkan Tripay'}
                </button>
            </div>

            {/* Warning / Note */}
            <div className="bg-dagang-amber/10 border border-dagang-amber/20 p-4 rounded-2xl flex gap-4 items-start">
                <AlertCircle className="w-6 h-6 text-dagang-amber shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="text-dagang-amber font-bold mb-1">Catatan Penting</p>
                    <p className="text-[var(--text-main)] leading-relaxed">
                        Pengaturan ini menentukan bagaimana biaya gateway Tripay dibebankan. Anda dapat memilih apakah biaya ditanggung oleh <b>Merchant (Aplikasi)</b> atau <b>Customer (Pembeli)</b>. Pastikan sinkronisasi dilakukan secara berkala untuk mendapatkan data fee terbaru dari Tripay.
                    </p>
                </div>
            </div>

            {/* Channel Groups */}
            {groups.length === 0 ? (
                <div className="text-center py-20 bg-[var(--surface-card)] rounded-3xl border border-dashed border-[var(--border)]">
                    <img src="/assets/empty-pms.svg" alt="" className="w-32 h-32 mx-auto mb-4 opacity-20 grayscale" />
                    <p className="text-[var(--text-muted)]">Tidak ada metode pembayaran ditemukan.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {groups.map(group => (
                        <div key={group} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-dagang-amber/10 text-dagang-amber rounded-xl">
                                    {getGroupIcon(group)}
                                </div>
                                <h3 className="text-xl font-heading font-black text-[var(--text-main)] uppercase tracking-wider">
                                    {group}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredChannels.filter(c => c.group === group).map(channel => (
                                    <div key={channel.code} className={`
                                        bg-[var(--surface-card)] rounded-3xl border transition-all duration-300 overflow-hidden
                                        ${channel.is_active ? 'border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1' : 'border-dashed opacity-60 grayscale scale-[0.98]'}
                                    `}>
                                        {/* Status Header */}
                                        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] p-1 flex items-center justify-center overflow-hidden shadow-sm">
                                                    {channel.icon_url ? (
                                                        <img src={channel.icon_url} alt={channel.name} className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <CreditCard className="w-6 h-6 text-dagang-green" />
                                                    )}
                                                </div>
                                                <div className="font-bold text-[var(--test-main)] truncate max-w-[120px]">
                                                    {channel.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setEditModal({ isOpen: true, channel })}
                                                    className="p-2 hover:bg-dagang-amber/10 text-dagang-amber rounded-xl transition-colors"
                                                    title="Edit Detail"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {channel.is_manual && (
                                                    <button 
                                                        onClick={() => channel.id && handleDelete(channel.id)}
                                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                                                        title="Hapus Metode"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => toggleStatus(channel)}
                                                    className={`
                                                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-offset-2 ring-offset-[var(--surface)] focus:ring-2 focus:ring-dagang-amber
                                                        ${channel.is_active ? 'bg-dagang-green' : 'bg-gray-300 dark:bg-gray-700'}
                                                    `}
                                                >
                                                    <span className={`
                                                        inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                                                        ${channel.is_active ? 'translate-x-6' : 'translate-x-1'}
                                                    `} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Channel Details */}
                                        <div className="p-6 space-y-5">
                                            {/* Pricing Breakdown */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[var(--surface-subtle)] p-3 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black mb-0.5">Fee Tripay</div>
                                                    <div className="text-sm font-bold text-dagang-green">
                                                        {channel.fee_percent > 0 ? `${channel.fee_percent}%` : ''}
                                                        {channel.fee_percent > 0 && channel.fee_flat > 0 ? ' + ' : ''}
                                                        {channel.fee_flat > 0 ? `Rp ${channel.fee_flat.toLocaleString('id-ID')}` : ''}
                                                        {channel.fee_flat === 0 && channel.fee_percent === 0 ? 'Gratis' : ''}
                                                    </div>
                                                </div>
                                                <div className="bg-[var(--surface-subtle)] p-3 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black mb-0.5">Tipe</div>
                                                    <div className="text-sm font-bold text-[var(--text-main)]">
                                                        {channel.type === 'direct' ? 'Langsung' : 'Redirect'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Configuration Selection */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest block">
                                                    Biaya Ditanggung Oleh:
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl">
                                                    {['merchant', 'customer'].map((borne) => (
                                                        <button
                                                            key={borne}
                                                            onClick={() => !channel.is_manual ? null : updateBorneBy(channel, borne)}
                                                            disabled={!channel.is_manual}
                                                            className={`
                                                                py-2 px-3 rounded-xl text-xs font-black transition-all border
                                                                ${channel.fee_borne_by === borne 
                                                                    ? 'bg-dagang-amber text-dagang-emerald-900 border-dagang-amber shadow-sm' 
                                                                    : 'text-[var(--text-muted)] border-transparent hover:bg-black/5 dark:hover:bg-white/5'}
                                                                ${!channel.is_manual ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                            `}
                                                        >
                                                            {borne.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Hidden info if disabled */}
                                            {!channel.is_active && (
                                                <div className="flex items-center gap-2 text-[10px] text-red-400 font-bold bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                                                    <Info className="w-3 h-3" />
                                                    Metode ini tidak akan tampil di kasir
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PaymentChannelModal 
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, channel: null })}
                initialData={editModal.channel}
                onSubmit={(updated) => {
                    handleUpdate(updated);
                    setEditModal({ isOpen: false, channel: null });
                }}
            />
        </div>
    );
};
