import React from 'react';
import {
    UserCircle,
    Edit3,
    Ban,
    Plus,
    Search,
    Trash
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

interface UsersTabProps {
    users: any[];
    totalUsers: number;
    userStats?: any;
    currentPage: number;
    usersPerPage: number;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    handleEditUser: (u: any) => void;
    handleDeleteUser: (u: any) => void;
    handleToggleBlock: (id: string, isBlocked: boolean) => void;
    onPageChange: (page: number) => void;
    handleAddUser: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
    users,
    totalUsers,
    currentPage,
    usersPerPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleEditUser,
    handleDeleteUser,
    handleToggleBlock,
    onPageChange,
    handleAddUser,
    userStats
}) => {
    return (
        <div className="space-y-6">
            {/* User Statistics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Pengguna', value: userStats?.total || 0, icon: UserCircle, color: 'blue' },
                    { label: 'User Aktif', value: userStats?.active || 0, icon: UserCircle, color: 'green' },
                    { label: 'Pending Verifikasi', value: userStats?.pending || 0, icon: UserCircle, color: 'orange' },
                    { label: 'User Terblokir', value: userStats?.blocked || 0, icon: UserCircle, color: 'red' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm hover:translate-y-[-4px] transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                                stat.color === 'green' ? 'bg-green-500/10 text-green-500' :
                                stat.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{stat.label}</div>
                                <div className="text-2xl font-serif font-black text-[var(--text-main)] leading-none">{stat.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
                <div className="flex-1 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-dagang-amber/50 transition-all font-medium"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-dagang-amber/50 transition-all font-bold text-[var(--text-muted)]"
                    >
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="pending">Pending</option>
                        <option value="blocked">Terblokir</option>
                    </select>
                </div>
                <button 
                    onClick={handleAddUser}
                    className="px-6 py-3 bg-dagang-amber text-dagang-emerald-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-dagang-amber/10 border border-dagang-amber/20 flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Pengguna
                </button>
            </div>

            <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-black/5 dark:bg-white/5">
                            <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                                <th className="px-8 py-5 text-left font-black">PENGGUNA</th>
                                <th className="px-8 py-5 uppercase">STATUS</th>
                                <th className="px-8 py-5 uppercase">TANGGAL BERGABUNG</th>
                                <th className="px-8 py-5 text-right uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {users.map((u: any) => (
                                <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-center">
                                    <td className="px-8 py-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-[var(--text-muted)]">
                                                <UserCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-[var(--text-main)]">{u.full_name}</div>
                                                <div className="text-[10px] text-[var(--text-muted)] opacity-80">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {u.is_blocked ? (
                                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">TERBLOKIR</span>
                                        ) : u.status === 'pending_invite' ? (
                                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-nowrap">MENUNGGU REGISTRASI</span>
                                        ) : !u.is_verified ? (
                                            <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-nowrap">PENDING VERIFIKASI</span>
                                        ) : (
                                            <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-nowrap">AKTIF</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-xs text-[var(--text-muted)] opacity-70">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEditUser(u)} className="p-2 text-[var(--text-muted)] hover:text-blue-500 transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleToggleBlock(u.id, u.is_blocked)} className={`p-2 transition-colors ${u.is_blocked ? 'text-green-500 hover:text-green-600' : 'text-orange-500 hover:text-orange-600'}`}>
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteUser(u)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-[var(--text-muted)] opacity-50 text-[10px] uppercase font-black tracking-widest italic">Tidak ada pengguna ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                    <TablePagination 
                        currentPage={currentPage}
                        totalItems={totalUsers}
                        itemsPerPage={usersPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            </div>
        </div>
    );
};
