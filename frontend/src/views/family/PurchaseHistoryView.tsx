import { useState, useEffect } from 'react';
import { 
    History, 
    ExternalLink, 
    Trash2, 
    Search,
    ArrowLeft,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Zap,
    ChevronLeft,
    ChevronRight,
    Repeat
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';
import { useModal } from '../../providers/ModalProvider';

export const PurchaseHistoryView = () => {
    const { user } = useOutletContext<any>();
    const { showAlert, showConfirm } = useModal();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await FinanceController.getPayments();
            setPayments(data || []);
        } catch (error) {
            console.error("Failed to fetch payment history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (id: string) => {
        showConfirm('Hapus Riwayat', 'Hapus catatan riwayat pembelian ini?', async () => {
            try {
                await FinanceController.deletePayment(id);
                setPayments(payments.filter(p => p.id !== id));
            } catch (error) {
                showAlert('Gagal', 'Gagal menghapus riwayat', 'danger');
            }
        }, 'danger');
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (p.plan_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                <p className="font-medium text-[var(--text-muted)] opacity-60">Memuat riwayat pembelian...</p>
            </div>
        );
    }

    const familyName = user?.familyName || '';

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link 
                        to={`/${encodeURIComponent(familyName)}/dashboard/overview`}
                        className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-4 group font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Overview
                    </Link>
                    <h1 className="text-h2 font-heading text-[var(--text-main)]">Pembelian Paket</h1>
                    <p className="text-[var(--text-muted)] opacity-70 font-medium">Lacak semua transaksi paket langganan keluarga Anda.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 order-2 md:order-1">
                        <Link 
                            to={`/${encodeURIComponent(familyName)}/dashboard/family/pricing`}
                            className="h-10 px-6 bg-[#1a5336] hover:bg-[#1a5336]/90 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                            Perpanjang <Clock className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                            to={`/${encodeURIComponent(familyName)}/dashboard/family/pricing`}
                            className="h-10 px-6 bg-[var(--surface-card)] text-[var(--text-main)] border border-[var(--border)] rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            Ganti Paket <Repeat className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 order-1 md:order-2">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                            <input 
                                type="text" 
                                placeholder="Cari referensi atau paket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 pl-11 pr-6 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all w-64 shadow-sm text-[var(--text-main)]"
                            />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-12 px-6 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm cursor-pointer text-[var(--text-main)]"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="PAID">Berhasil</option>
                            <option value="UNPAID">Pending</option>
                            <option value="EXPIRED">Kedaluwarsa</option>
                            <option value="FAILED">Gagal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-[var(--surface-card)] rounded-[40px] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest">Referensi & Paket</th>
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-center">Metode</th>
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-center">Total Bayar</th>
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-center">Tanggal</th>
                                <th className="px-8 py-6 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-right px-10">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedPayments.length > 0 ? (
                                paginatedPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-dagang-dark flex items-center justify-center text-[var(--accent)] shrink-0 border border-white/10">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-[var(--text-main)]">{p.plan_name}</div>
                                                    <div className="text-[11px] font-mono text-[var(--text-muted)] opacity-60 uppercase tracking-tight">{p.reference}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">{p.payment_name || p.payment_method}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="text-sm font-black text-[var(--text-main)]">
                                                Rp {(p.total_amount || (p.amount + p.fee))?.toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge status={p.status} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="text-sm font-medium text-[var(--text-muted)] opacity-70">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right px-10">
                                            <div className="flex items-center justify-end gap-2 outline-none">
                                                <Link 
                                                    to={`/${encodeURIComponent(familyName)}/dashboard/family/invoice/${p.reference}`}
                                                    className="w-10 h-10 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-sm"
                                                    title="Lihat Invoice"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(p.id)}
                                                    className="w-10 h-10 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)] opacity-20 border border-[var(--border)]">
                                            <History className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-[var(--text-muted)] opacity-60">Belum ada riwayat transaksi.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)] flex items-center justify-between">
                        <div className="text-xs font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" /> Sebelumnya
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'PAID':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase tracking-widest rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Berhasil
                </span>
            );
        case 'UNPAID':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    <Clock className="w-3 h-3" /> Pending
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                    <XCircle className="w-3 h-3" /> {status}
                </span>
            );
    }
};
