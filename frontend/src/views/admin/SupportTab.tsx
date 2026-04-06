import React from 'react';
import { Reply, Calendar, ChevronDown } from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

interface SupportTabProps {
    paginatedSupportTickets: any[];
    handleReplyTicket: (ticket: any) => void;
    currentPage: number;
    totalTickets: number;
    usersPerPage: number;
    onPageChange: (page: number) => void;
    periodFilter?: string;
    onPeriodChange?: (val: string) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
    paginatedSupportTickets,
    handleReplyTicket,
    currentPage,
    totalTickets,
    usersPerPage,
    onPageChange,
    periodFilter,
    onPeriodChange
}) => {
    return (
        <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
            {/* Header and Filters */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)]">
                <div>
                    <h2 className="text-xl font-heading font-black text-[var(--text-main)]">Daftar Tiket Dukungan</h2>
                    <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Tanggapi pertanyaan dan kendala teknis pengguna.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative min-w-[200px]">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <select 
                            value={periodFilter || ''}
                            onChange={(e) => onPeriodChange?.(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-dagang-amber outline-none transition-all appearance-none font-bold text-sm cursor-pointer hover:border-dagang-amber/50"
                        >
                            <option value="">Semua Waktu</option>
                            <option value="7">7 Hari Terakhir</option>
                            <option value="30">30 Hari Terakhir</option>
                            <option value="90">90 Hari Terakhir</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-black/5 dark:bg-white/5">
                        <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                            <th className="px-8 py-5 text-left font-black">SUBJEK / PENGIRIM</th>
                            <th className="px-8 py-5 font-black">PESAN SINGKAT</th>
                            <th className="px-8 py-5 uppercase font-black">STATUS</th>
                            <th className="px-8 py-5 text-right font-black">AKSI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {paginatedSupportTickets?.map((ticket: any) => (
                            <tr key={ticket.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[var(--border)]">
                                <td className="px-8 py-6 text-left">
                                    <div className="font-bold text-[var(--text-main)] truncate max-w-[200px]">{ticket.subject}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] opacity-80">{ticket.family?.name || 'User'} • {new Date(ticket.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-xs text-[var(--text-main)] opacity-80 line-clamp-2 max-w-[300px]">{ticket.message}</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    {ticket.status === 'open' ? (
                                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">OPEN</span>
                                    ) : (
                                        <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">CLOSED</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleReplyTicket(ticket)} 
                                            className="p-2 text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                                            title="Balas"
                                        >
                                            <Reply className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedSupportTickets.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-[var(--text-muted)] opacity-50 text-[10px] uppercase font-black tracking-widest italic">Tidak ada tiket bantuan</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                <TablePagination 
                    currentPage={currentPage}
                    totalItems={totalTickets}
                    itemsPerPage={usersPerPage}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
};
