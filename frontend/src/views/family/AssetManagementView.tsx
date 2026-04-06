import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
// Asset Management View
import {
    Plus,
    Landmark,
    TrendingUp,
    X,
    Edit3,
    Trash2,
    Calendar,
    Building2
} from 'lucide-react';
import { useModal } from '../../providers/ModalProvider';
import { motion } from 'framer-motion';
import { formatRupiah, parseRupiah } from '../../utils/formatters';

interface AssetsViewProps {
    assets: any[];
    familyRole: string; // Added familyRole
    handleCreateAsset: (asset: any) => void;
    handleUpdateAsset: (asset: any) => void;
    handleDeleteAsset: (id: string) => void;
}

const ASSET_TYPES = [
    { id: 'liquid', label: 'Aset Likuid', icon: TrendingUp },
    { id: 'fixed', label: 'Aset Tetap', icon: Landmark }
];

export const AssetManagementView: React.FC<AssetsViewProps> = ({
    assets,
    familyRole,
    handleCreateAsset,
    handleUpdateAsset,
    handleDeleteAsset
}) => {
    const { currentUserId } = useOutletContext<any>();
    const canManageAssets = familyRole !== 'viewer';
    const canDeleteAssets = familyRole === 'head_of_family' || familyRole === 'treasurer';
    const { showAlert, showConfirm } = useModal();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editAssetId, setEditAssetId] = useState<string | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [type, setType] = useState('liquid');
    const [value, setValue] = useState(0);
    const [description, setDescription] = useState('');
    const [acquiredDate, setAcquiredDate] = useState(new Date().toISOString().split('T')[0]);

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (asset: any) => {
        setEditAssetId(asset.id);
        setName(asset.name);
        setType(asset.type || 'liquid');
        setValue(asset.value);
        setDescription(asset.description || '');
        setAcquiredDate(new Date(asset.acquiredDate).toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setType('liquid');
        setValue(0);
        setDescription('');
        setAcquiredDate(new Date().toISOString().split('T')[0]);
        setEditAssetId(null);
        setIsModalOpen(false);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || value <= 0) {
            showAlert('Validasi', 'Nama dan Nilai Aset harus diisi', 'warning');
            return;
        }

        const payload = {
            id: editAssetId,
            name,
            type,
            value,
            description,
            acquiredDate: new Date(acquiredDate).toISOString()
        };

        if (editAssetId) {
            handleUpdateAsset(payload);
        } else {
            handleCreateAsset(payload);
        }
        resetForm();
    };

    const confirmDelete = (id: string) => {
        showConfirm('Hapus Aset', 'Apakah Anda yakin ingin menghapus catatan aset ini?', () => {
            handleDeleteAsset(id);
        }, 'danger');
    };

    const liquidAssets = assets.filter(a => a.type === 'liquid');
    const fixedAssets = assets.filter(a => a.type === 'fixed');
    const totalLiquid = liquidAssets.reduce((sum, a) => sum + a.value, 0);
    const totalFixed = fixedAssets.reduce((sum, a) => sum + a.value, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-h2 font-heading text-[var(--text-main)]">Manajemen Aset</h2>
                    <p className="text-body-s text-[var(--text-muted)] opacity-80 mt-1">Pantau total kekayaan dan inventaris aset keluarga Anda secara sitematis.</p>
                </div>
                {canManageAssets && !isModalOpen && (
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Tambah Aset
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#1A6B4A] to-[#0D3B2A] p-8 rounded-[40px] text-white shadow-2xl shadow-[#1A6B4A]/20 relative overflow-hidden group border border-white/5">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Total Aset Likuid</span>
                        </div>
                        <div className="text-5xl font-serif font-black tracking-tight text-white mb-2">Rp {totalLiquid.toLocaleString('id-ID')}</div>
                        <div className="w-12 h-1 bg-dagang-accent rounded-full mb-4 opacity-50" />
                        <p className="text-[11px] text-white/60 leading-relaxed font-medium max-w-[240px]">Uang tunai, saldo bank, emas, dan investasi yang mudah dicairkan.</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#0A1F18] to-[#142B23] p-8 rounded-[40px] text-white shadow-2xl shadow-black/40 relative overflow-hidden group border border-white/5">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-dagang-accent/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-white/5 rounded-xl backdrop-blur-md border border-white/5">
                                <Landmark className="w-5 h-5 text-dagang-accent" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Total Aset Tetap</span>
                        </div>
                        <div className="text-5xl font-serif font-black tracking-tight text-white mb-2">Rp {totalFixed.toLocaleString('id-ID')}</div>
                        <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
                        <p className="text-[11px] text-white/60 leading-relaxed font-medium max-w-[240px]">Properti, kendaraan, alat elektronik, dan barang berharga lainnya.</p>
                    </div>
                </div>
            </div>

            {/* Asset Sections */}
            <div className="space-y-12">
                <AssetSection 
                    title="Aset Likuid" 
                    icon={TrendingUp} 
                    assets={liquidAssets} 
                    onEdit={openEditModal} 
                    onDelete={confirmDelete} 
                    canManageAssets={canManageAssets} 
                    canDeleteAssets={canDeleteAssets} 
                    currentUserId={currentUserId}
                    familyRole={familyRole}
                />
                <AssetSection 
                    title="Aset Tetap" 
                    icon={Landmark} 
                    assets={fixedAssets} 
                    onEdit={openEditModal} 
                    onDelete={confirmDelete} 
                    canManageAssets={canManageAssets} 
                    canDeleteAssets={canDeleteAssets} 
                    currentUserId={currentUserId}
                    familyRole={familyRole}
                />
            </div>

            {/* Modal */}
             {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[var(--surface-card)] rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative border border-[var(--border)] overflow-y-auto max-h-[90vh]"
                    >
                        <button onClick={resetForm} className="absolute right-8 top-8 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-serif mb-2 text-[var(--text-main)]">{editAssetId ? 'Edit Aset' : 'Tambah Aset'}</h3>
                        <p className="text-sm text-[var(--text-muted)] opacity-80 mb-10">Catat kekayaan keluarga untuk perencanaan finansial yang akurat.</p>

                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-[var(--text-muted)] opacity-70 uppercase tracking-[0.2em] ml-2 block">Tipe Aset</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {ASSET_TYPES.map(at => (
                                        <button
                                            key={at.id}
                                            type="button"
                                            onClick={() => setType(at.id)}
                                            className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${type === at.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-transparent bg-black/5 dark:bg-white/5'}`}
                                        >
                                            <at.icon className={`w-6 h-6 ${type === at.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                                            <span className="text-xs font-bold text-[var(--text-main)]">{at.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Nama Aset</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="cth. Emas Antam 10gr, Toyota Avanza"
                                    className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-bold text-[var(--text-main)] transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Estimasi Nilai (Rp)</label>
                                <input
                                    type="text"
                                    value={formatRupiah(value) || ''}
                                    onChange={(e) => setValue(parseRupiah(e.target.value))}
                                    className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-black text-2xl text-[var(--primary)] transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Tanggal Akuisisi</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={acquiredDate}
                                        onChange={(e) => setAcquiredDate(e.target.value)}
                                        className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-bold text-[var(--text-main)] transition-all"
                                    />
                                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Catatan (Pilihan)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Informasi tambahan terkait aset ini..."
                                    className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-medium text-[var(--text-main)] transition-all h-24 resize-none"
                                />
                            </div>

                            <button type="submit" className="w-full py-5 bg-[var(--primary)] text-white rounded-[24px] font-black text-[15px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-[var(--primary)]/30 mt-4">
                                {editAssetId ? 'Simpan Perubahan' : 'Catat Aset'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

interface AssetSectionProps {
    title: string;
    icon: any;
    assets: any[];
    onEdit: (asset: any) => void;
    onDelete: (id: string) => void;
    canManageAssets: boolean;
    canDeleteAssets: boolean;
    currentUserId: string;
    familyRole: string;
}

const AssetSection: React.FC<AssetSectionProps> = ({ 
    title, 
    icon: Icon, 
    assets, 
    onEdit, 
    onDelete, 
    canManageAssets, 
    canDeleteAssets,
    currentUserId,
    familyRole
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl flex items-center justify-center text-[var(--primary)] shadow-sm">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-serif text-[var(--text-main)] font-black tracking-tight">{title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-8 h-1 bg-[var(--primary)] rounded-full opacity-30" />
                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                            {assets.length} ITEM TERCATAT
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                    <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--surface-card)] rounded-[32px] p-8 border border-[var(--border)] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                                {asset.type === 'liquid' ? <TrendingUp className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canManageAssets && (asset.userId === currentUserId || familyRole === 'head_of_family' || familyRole === 'treasurer') && (
                                    <button 
                                        onClick={() => onEdit(asset)} 
                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] bg-black/5 dark:bg-white/5 rounded-lg transition-all"
                                        title="Ubah Aset"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                                {canManageAssets && (asset.userId === currentUserId || familyRole === 'head_of_family' || familyRole === 'treasurer') && (
                                    <button 
                                        onClick={() => onDelete(asset.id)} 
                                        className="p-2 text-[var(--text-muted)] hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-lg transition-all"
                                        title="Hapus Aset"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 mb-8">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                <span className="text-[var(--text-muted)] opacity-70">Acquired {new Date(asset.acquiredDate).toLocaleDateString()}</span>
                                {asset.ownerName && (
                                    <span className="text-[var(--primary)] px-2 py-0.5 bg-[var(--primary)]/5 rounded-md">Oleh: {asset.ownerName}</span>
                                )}
                            </div>
                            <h4 className="text-lg font-bold text-[var(--text-main)]">{asset.name}</h4>
                            {asset.description && <p className="text-xs text-[var(--text-muted)] line-clamp-1">{asset.description}</p>}
                        </div>

                        <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
                            <div>
                                <div className="text-[9px] font-black text-[var(--text-muted)] opacity-60 uppercase tracking-[0.2em] mb-1">Nilai Saat Ini</div>
                                <div className="text-2xl font-serif text-[var(--text-main)] font-black tracking-tighter">Rp {asset.value.toLocaleString('id-ID')}</div>
                            </div>
                            <div className={`p-2 rounded-xl ${asset.type === 'liquid' ? 'bg-dagang-green/10 text-dagang-green' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                {asset.type === 'liquid' ? <TrendingUp className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {assets.length === 0 && (
                    <div className="col-span-full py-12 bg-black/5 dark:bg-white/5 rounded-[32px] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center opacity-60">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Belum ada data {title}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
