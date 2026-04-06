import React, { Fragment } from 'react';
import {
    ChevronUp,
    ChevronDown,
    Ban,
    UserCircle,
    Trash2,
    Users,
    Crown,
    Zap,
    Search,
    Filter
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

interface FamiliesTabProps {
    paginatedFamilies: any[];
    familyStats: {
        total: number;
        active: number;
        trial: number;
        blocked: number;
    } | null;
    expandedFamilies: Set<string>;
    toggleFamily: (id: string) => void;
    settings: any[];
    handleToggleFamilyBlock: (id: string, isBlocked: boolean) => void;
    handleDeleteFamily: (id: string, name: string) => void;
    currentPage: number;
    totalFamilies: number;
    usersPerPage: number;
    onPageChange: (page: number) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
}

export const FamiliesTab: React.FC<FamiliesTabProps> = ({
    paginatedFamilies,
    familyStats,
    expandedFamilies,
    toggleFamily,
    settings,
    handleToggleFamilyBlock,
    handleDeleteFamily,
    currentPage,
    totalFamilies,
    usersPerPage,
    onPageChange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter
}) => {
    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Total Keluarga</div>
                        <div className="text-2xl font-heading font-black text-[var(--text-dark)]">{familyStats?.total || 0}</div>
                    </div>
                </div>
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                        <Crown className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Paket Aktif</div>
                        <div className="text-2xl font-heading font-black text-[var(--text-dark)]">{familyStats?.active || 0}</div>
                    </div>
                </div>
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Masa Trial</div>
                        <div className="text-2xl font-heading font-black text-[var(--text-dark)]">{familyStats?.trial || 0}</div>
                    </div>
                </div>
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                        <Ban className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Terblokir</div>
                        <div className="text-2xl font-heading font-black text-[var(--text-dark)]">{familyStats?.blocked || 0}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[var(--surface-card)] p-4 rounded-[32px] border border-[var(--border)] shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Cari nama keluarga..."
                        className="w-full h-12 pl-11 pr-4 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <select 
                            className="w-full h-12 pl-11 pr-10 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Paket Aktif</option>
                            <option value="trial">Masa Trial</option>
                            <option value="blocked">Terblokir</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-black/5 dark:bg-white/5">
                            <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                                <th className="px-8 py-5 text-left font-black">ENTITAS KELUARGA</th>
                                <th className="px-8 py-5 uppercase font-black">STATUS SISTEM</th>
                                <th className="px-8 py-5 uppercase font-black">PAKET</th>
                                <th className="px-8 py-5 text-right font-black">KONTROL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedFamilies?.length > 0 ? paginatedFamilies.map((fam) => (
                                <Fragment key={fam.id}>
                                    <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[var(--border)]">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => toggleFamily(fam.id)}
                                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-[var(--text-main)]"
                                                >
                                                    {expandedFamilies.has(fam.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <div>
                                                    <div className="font-bold text-[var(--text-main)] text-lg leading-tight">{fam.name}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-mono font-medium">{fam.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {fam.is_blocked ? (
                                                    <span className="w-fit bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-red-500/20">
                                                        Terblokir / Nonaktif
                                                    </span>
                                                ) : fam.status === 'trial' ? (
                                                    <span className="w-fit bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-amber-500/20 animate-pulse">
                                                        Masa Trial ({settings.find(s => s.key === 'trial_duration_days')?.value || '10'} Hari)
                                                    </span>
                                                ) : (
                                                    <span className="w-fit bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-500/20">
                                                        Pencatatan Aktif
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`bg-[var(--accent)] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-[var(--accent)]/50 ${fam.subscription_plan?.toUpperCase() === 'PREMIUM' ? 'bg-amber-400 text-black ring-amber-500' : ''}`}>
                                                {fam.subscription_plan || 'Free Plan'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleFamilyBlock(fam.id, fam.is_blocked)} 
                                                    className={`p-2 transition-colors ${fam.is_blocked ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}`}
                                                    title={fam.is_blocked ? 'Aktifkan' : 'Nonaktifkan'}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteFamily(fam.id, fam.name)} 
                                                    className="p-2 text-red-500 hover:text-red-600 transition-colors"
                                                    title="Hapus Keluarga & Anggota"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedFamilies.has(fam.id) && (
                                        <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                                            <td colSpan={4} className="px-12 py-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Anggota Keluarga</h4>
                                                        <div className="space-y-3">
                                                            {fam.members && fam.members.length > 0 ? fam.members.map((m: any) => (
                                                                <div key={m.id} className="flex items-center gap-3 p-3 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-sm">
                                                                    <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-[var(--text-muted)]">
                                                                        <UserCircle className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-[var(--text-main)]">{m.user?.full_name || 'Tanpa Nama'}</div>
                                                                        <div className="text-[10px] text-[var(--text-muted)]">{m.user?.email}</div>
                                                                    </div>
                                                                    {m.user_id === fam.owner_id && (
                                                                        <span className="ml-auto bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded text-[8px] font-black uppercase border border-[var(--accent)]/20">Kepala</span>
                                                                    )}
                                                                </div>
                                                            )) : (
                                                                <div className="text-xs text-[var(--text-muted)] opacity-80 italic">Belum ada anggota keluarga</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Statistik Keuangan</h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-sm">
                                                                    <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter mb-1">Total Wallets</div>
                                                                    <div className="text-xl font-heading font-black text-[var(--text-main)]">{fam.wallets_count || 0}</div>
                                                                </div>
                                                                <div className="p-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-sm">
                                                                    <div className="text-xl font-heading font-black text-[var(--accent)]">Rp {fam.total_balance?.toLocaleString('id-ID') || 0}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                                            <div className="text-[9px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-tighter mb-2">Metadata Sistem</div>
                                                            <div className="text-[10px] text-[var(--text-main)] opacity-70 space-y-1">
                                                                <div>Dibuat: {new Date(fam.created_at).toLocaleString('id-ID')}</div>
                                                                {fam.status === 'trial' && (
                                                                    <div>Trial Sampai: {new Date(fam.trial_ends_at).toLocaleString('id-ID')}</div>
                                                                )}
                                                                {fam.status === 'active' && fam.subscription_ends_at && (
                                                                    <div className="font-bold text-[var(--accent)]">Berlangganan Sampai: {new Date(fam.subscription_ends_at).toLocaleString('id-ID')}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-[var(--text-muted)] opacity-60 italic text-sm">
                                        Tidak ada data keluarga ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                    <TablePagination 
                        currentPage={currentPage}
                        totalItems={totalFamilies}
                        itemsPerPage={usersPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            </div>
        </div>
    );
};
