import React from 'react';
import { TablePagination } from '../../components/common/TablePagination';
import { Search, Filter, Calendar, CheckCircle } from 'lucide-react';

interface TransactionsTabProps {
    paginatedTransactions: any[];
    currentPage: number;
    totalTransactions: number;
    usersPerPage: number;
    onPageChange: (page: number) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    periodFilter: string;
    onPeriodChange: (period: string) => void;
    onVerify: (transaction: any) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
    paginatedTransactions,
    currentPage,
    totalTransactions,
    usersPerPage,
    onPageChange,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    periodFilter,
    onPeriodChange,
    onVerify
}) => {
    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input 
                        type="text"
                        placeholder="Cari referensi atau nama keluarga..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all font-medium"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full md:w-40 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl py-3 pl-10 pr-4 text-xs font-black uppercase tracking-wider appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 cursor-pointer"
                        >
                            <option value="">SEMUA STATUS</option>
                            <option value="PAID">SUCCESS</option>
                            <option value="UNPAID">PENDING</option>
                            <option value="PENDING_APPROVAL">VERIFIKASI</option>
                            <option value="FAILED">FAILED</option>
                            <option value="EXPIRED">EXPIRED</option>
                        </select>
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
                        <select 
                            value={periodFilter}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            className="w-full md:w-44 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl py-3 pl-10 pr-4 text-xs font-black uppercase tracking-wider appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 cursor-pointer"
                        >
                            <option value="">SEMUA WAKTU</option>
                            <option value="day">HARI INI</option>
                            <option value="week">MINGGU INI</option>
                            <option value="month">BULAN INI</option>
                            <option value="year">TAHUN INI</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-black/5 dark:bg-white/5">
                            <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                                <th className="px-8 py-5 text-left font-black">REFERENSI</th>
                                <th className="px-8 py-5 text-left font-black">KELUARGA / PAKET</th>
                                <th className="px-8 py-5 font-black">TOTAL</th>
                                <th className="px-8 py-5 uppercase font-black">STATUS</th>
                                <th className="px-8 py-5 text-right font-black">WAKTU</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedTransactions?.map((t) => (
                                <tr key={t.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[var(--border)]">
                                    <td className="px-8 py-6">
                                        <div className="font-black text-[var(--text-main)] text-xs">{t.reference}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] font-mono font-medium mt-1">{t.merchant_ref}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-[var(--text-main)]">{t.family?.name || 'Mengambil data...'}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border border-[var(--accent)]/20">{t.plan_name}</span>
                                            <span className="bg-[var(--sidebar-bg)] dark:bg-[var(--accent)] text-[var(--sidebar-text)] dark:text-black px-2 py-0.5 rounded text-[9px] font-black uppercase ring-1 ring-[var(--border)]">{t.payment_name || t.payment_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-heading font-black text-[var(--text-main)]">Rp {t.total_amount.toLocaleString('id-ID')}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] font-medium">Fee: Rp {t.fee.toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {t.status === 'PAID' ? (
                                            <span className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-200/50">SUCCESS</span>
                                        ) : t.status === 'PENDING_APPROVAL' ? (
                                            <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-200/50">VERIFIKASI</span>
                                        ) : t.status === 'UNPAID' ? (
                                            <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-amber-200/50">PENDING</span>
                                        ) : t.status === 'EXPIRED' ? (
                                            <span className="bg-gray-100 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-gray-200/50">EXPIRED</span>
                                        ) : (
                                            <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-red-200/50">FAILED</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right flex items-center justify-end gap-3">
                                        <div className="text-right">
                                            <div className="text-[11px] font-black text-[var(--text-main)]">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] font-medium">{new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        {t.status === 'PENDING_APPROVAL' && (
                                            <button 
                                                onClick={() => onVerify(t)}
                                                className="p-2 bg-dagang-amber text-dagang-emerald-900 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-dagang-amber/10"
                                                title="Verifikasi Pembayaran"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {paginatedTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] opacity-50 text-[10px] uppercase font-black tracking-widest italic">Tidak ada riwayat transaksi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalTransactions > usersPerPage && (
                    <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                        <TablePagination 
                            currentPage={currentPage}
                            totalItems={totalTransactions}
                            itemsPerPage={usersPerPage}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
