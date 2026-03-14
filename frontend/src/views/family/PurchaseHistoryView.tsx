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
    Zap
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';

export const PurchaseHistoryView = () => {
    const { user } = useOutletContext<any>();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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
        if (!window.confirm('Hapus catatan riwayat pembelian ini?')) return;
        try {
            await FinanceController.deletePayment(id);
            setPayments(payments.filter(p => p.id !== id));
        } catch (error) {
            alert('Gagal menghapus riwayat');
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                <p className="font-medium text-dagang-gray">Memuat riwayat pembelian...</p>
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
                        className="inline-flex items-center gap-2 text-dagang-gray hover:text-dagang-dark transition-colors mb-4 group font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Overview
                    </Link>
                    <h1 className="text-h2 font-heading text-dagang-dark">Riwayat Pembelian</h1>
                    <p className="text-dagang-gray font-medium">Lacak semua transaksi paket langganan keluarga Anda.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray" />
                        <input 
                            type="text" 
                            placeholder="Cari referensi atau paket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 pl-11 pr-6 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-dagang-green/20 focus:border-dagang-green transition-all w-64 shadow-sm"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 px-6 bg-white border border-black/5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-dagang-green/20 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="PAID">Berhasil</option>
                        <option value="UNPAID">Pending</option>
                        <option value="EXPIRED">Kedaluwarsa</option>
                        <option value="FAILED">Gagal</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dagang-gray/5">
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest">Referensi & Paket</th>
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest text-center">Metode</th>
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest text-center">Total Bayar</th>
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest text-center">Tanggal</th>
                                <th className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest text-right px-10">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-dagang-cream/20 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-dagang-dark flex items-center justify-center text-dagang-accent shrink-0">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-dagang-dark">{p.plan_name}</div>
                                                    <div className="text-[11px] font-mono text-dagang-gray uppercase tracking-tight">{p.reference}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-dagang-dark uppercase tracking-wider">{p.payment_name || p.payment_method}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="text-sm font-black text-dagang-dark">
                                                Rp {(p.total_amount || (p.amount + p.fee))?.toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge status={p.status} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="text-sm font-medium text-dagang-gray">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right px-10">
                                            <div className="flex items-center justify-end gap-2 outline-none">
                                                <Link 
                                                    to={`/${encodeURIComponent(familyName)}/dashboard/family/invoice/${p.reference}`}
                                                    className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-dagang-gray hover:text-dagang-green hover:border-dagang-green transition-all shadow-sm"
                                                    title="Lihat Invoice"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(p.id)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center text-dagang-gray hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
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
                                        <div className="w-16 h-16 bg-dagang-cream rounded-full flex items-center justify-center mx-auto mb-4 text-dagang-gray opacity-20">
                                            <History className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-dagang-gray">Belum ada riwayat transaksi.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'PAID':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-dagang-green/10 text-dagang-green text-[10px] font-black uppercase tracking-widest rounded-full">
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
