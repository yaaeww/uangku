import React from 'react';
import {
    Edit3,
    Trash2,
    Plus
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

interface PlansTabProps {
    paginatedPlans: any[];
    handleAddPlan: () => void;
    handleUpdatePlan: (plan: any) => void;
    handleDeletePlan: (id: number) => void;
    currentPage: number;
    totalPlans: number;
    usersPerPage: number;
    onPageChange: (page: number) => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({
    paginatedPlans,
    handleAddPlan,
    handleUpdatePlan,
    handleDeletePlan,
    currentPage,
    totalPlans,
    usersPerPage,
    onPageChange
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button 
                    onClick={handleAddPlan}
                    className="px-6 py-3 bg-dagang-amber text-dagang-emerald-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-dagang-amber/10 border border-dagang-amber/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Paket
                </button>
            </div>

            <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-black/5 dark:bg-white/5">
                            <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                                <th className="px-8 py-5 text-left font-black">NAMA PAKET</th>
                                <th className="px-8 py-5 font-black">HARGA</th>
                                <th className="px-8 py-5 font-black">LIMIT ANGGOTA</th>
                                <th className="px-8 py-5 font-black">DURASI</th>
                                <th className="px-8 py-5 text-right font-black">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedPlans?.map((plan: any) => (
                                <tr key={plan.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-center">
                                    <td className="px-8 py-6 text-left">
                                        <div className="font-bold text-[var(--text-main)]">{plan.name}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] opacity-80">ID: {plan.id}</div>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-[var(--text-main)]">Rp {plan.price.toLocaleString('id-ID')}</td>
                                    <td className="px-8 py-6 font-bold text-[var(--text-main)]">{plan.max_members} Orang</td>
                                    <td className="px-8 py-6 text-[var(--text-main)] opacity-80">{plan.duration_days} Hari</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleUpdatePlan(plan)} className="p-2 text-[var(--text-muted)] hover:text-blue-500 transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedPlans.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] opacity-50 text-[10px] uppercase font-black tracking-widest italic">Belum ada paket tersedia</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                    <TablePagination 
                        currentPage={currentPage}
                        totalItems={totalPlans}
                        itemsPerPage={usersPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            </div>
        </div>
    );
};
