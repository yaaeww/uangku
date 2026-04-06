import React, { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Percent,
    CreditCard,
    ArrowRight,
    Download,
    FileSpreadsheet,
    FileDown,
    AlertCircle
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

interface TaxReportsTabProps {
    reportPeriod: string;
    setReportPeriod: (val: any) => void;
    financialSummary: any;
    exportToExcel: () => void;
    exportToPDF: () => void;
}

export const TaxReportsTab: React.FC<TaxReportsTabProps> = ({
    reportPeriod,
    setReportPeriod,
    financialSummary,
    exportToExcel,
    exportToPDF
}) => {
    const revenue = financialSummary?.total_revenue || 0;
    const totalFees = financialSummary?.total_fees || 0;
    const netRevenue = financialSummary?.net_revenue || (revenue - totalFees);
    const ppnTarget = revenue * 0.11;

    // Pagination states
    const [revPage, setRevPage] = useState(1);
    const [taxPage, setTaxPage] = useState(1);
    const revItemsPerPage = 5;
    const taxItemsPerPage = 5;

    const revenueDetails = financialSummary?.revenue_details || [];
    const taxDetails = financialSummary?.revenue_details || []; // Using the same source as ReportsTab did

    const paginatedRevDetails = revenueDetails.slice((revPage - 1) * revItemsPerPage, revPage * revItemsPerPage);
    const paginatedTaxDetails = taxDetails.slice((taxPage - 1) * taxItemsPerPage, taxPage * taxItemsPerPage);

    return (
        <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 transition-colors overflow-x-hidden">
            {/* Period Filter Bar */}
            <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-[28px] shadow-sm border border-[var(--border)]">
                <div className="flex flex-wrap bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1">
                    {[
                        { id: 'day', label: 'Hari Ini' },
                        { id: 'week', label: 'Minggu' },
                        { id: 'month', label: 'Bulan Ini' },
                        { id: 'last-month', label: 'Bulan Lalu' },
                        { id: 'year', label: 'Tahun' }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setReportPeriod(p.id as any)}
                            className={`flex-1 min-w-[60px] px-2 sm:px-4 md:px-6 py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                                reportPeriod === p.id 
                                ? 'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[0_4px_20px_-4px_rgba(26,107,74,0.15)] ring-1 ring-dagang-green/10 font-extrabold scale-105' 
                                : 'text-[var(--text-muted)] opacity-80 hover:text-[var(--text-main)]'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-muted)] font-medium flex-shrink-0">
                        Periode: <span className="text-[var(--text-main)] font-black">
                            {financialSummary?.period_start ? new Date(financialSummary.period_start).toLocaleDateString() : '...'} - {financialSummary?.period_end ? new Date(financialSummary.period_end).toLocaleDateString() : '...'}
                        </span>
                    </div>
                </div>
            </div>
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-black text-[var(--text-main)] tracking-tight">Laporan Pajak & Biaya</h2>
                    <p className="text-[var(--text-muted)] text-[10px] sm:text-xs uppercase font-black tracking-widest mt-1 opacity-70">Rincian Omzet, PPN, dan Biaya Gateway</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={exportToExcel}
                        className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg sm:rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">Excel</span>
                    </button>
                    <button 
                        onClick={exportToPDF}
                        className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg sm:rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">PDF</span>
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Gross Revenue Card */}
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm group hover:border-[var(--accent)]/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Total Omzet (Gross)</span>
                            <span className="text-[9px] text-blue-500/60 font-bold">Periode Ini</span>
                        </div>
                    </div>
                    <div className="text-2xl font-heading font-black text-[var(--text-main)] tracking-tighter">
                        Rp {revenue.toLocaleString('id-ID')}
                    </div>
                </div>

                {/* PPN Card */}
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Percent className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Potongan PPN (11%)</span>
                            <span className="text-[9px] text-amber-500/60 font-bold">Kewajiban Pajak</span>
                        </div>
                    </div>
                    <div className="text-2xl font-heading font-black text-amber-500 tracking-tighter">
                        - Rp {ppnTarget.toLocaleString('id-ID')}
                    </div>
                </div>

                {/* TriPay Card */}
                <div className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                            <CreditCard className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Biaya Gateway (TriPay)</span>
                            <span className="text-[9px] text-red-500/60 font-bold">Akumulasi Fee</span>
                        </div>
                    </div>
                    <div className="text-2xl font-heading font-black text-red-500 tracking-tighter">
                        - Rp {totalFees.toLocaleString('id-ID')}
                    </div>
                </div>
            </div>

            {/* DETAIL SECTION */}
            <div className="space-y-6 sm:space-y-8">
                {/* 1. Riwayat Pendapatan */}
                <div className="bg-[var(--surface-card)] rounded-2xl sm:rounded-[28px] border border-[var(--border)] overflow-hidden shadow-sm">
                    <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                        <h3 className="text-lg font-heading font-bold text-[var(--text-main)]">Riwayat Pendapatan Detail</h3>
                        <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest mt-1 opacity-70">Penjualan Paket & Layanan</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                    <th className="px-8 py-5 font-black">Ref / Keluarga</th>
                                    <th className="px-6 py-5 font-black">Paket</th>
                                    <th className="px-6 py-5 font-black">Jumlah Kotor</th>
                                    <th className="px-6 py-5 font-black">PPN (11%)</th>
                                    <th className="px-6 py-5 font-black">Setelah PPN</th>
                                    <th className="px-8 py-5 text-right font-black">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-sm">
                                {paginatedRevDetails.length > 0 ? paginatedRevDetails.map((rev: any) => (
                                    <tr key={rev.id} className="hover:bg-black/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-[var(--text-main)]">{rev.reference}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] opacity-70">{rev.family?.name || 'Tanpa Keluarga'}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="bg-dagang-amber/10 text-dagang-amber px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-dagang-amber/20">{rev.plan_name}</span>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-[var(--text-main)]">
                                            Rp {rev.total_amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-6 font-bold text-amber-500">
                                            - Rp {(rev.total_amount * 0.11).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-6 font-bold text-emerald-500">
                                            Rp {(rev.total_amount - (rev.total_amount * 0.11)).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-8 py-6 text-right text-xs text-[var(--text-muted)] font-medium">
                                            {new Date(rev.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] opacity-40 text-[10px] font-black uppercase tracking-widest">Tidak ada data pendapatan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                        <TablePagination 
                            currentPage={revPage}
                            totalItems={revenueDetails.length}
                            itemsPerPage={revItemsPerPage}
                            onPageChange={setRevPage}
                        />
                    </div>
                </div>

                {/* 2. Laporan Pajak & Fee Gateway */}
                <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                    <div className="p-6 sm:p-8 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                        <h3 className="text-lg font-heading font-bold text-[var(--text-main)]">Laporan Biaya Gateway Detail</h3>
                        <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest mt-1 opacity-70">Rincian Potongan oleh TriPay</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] opacity-80 border-b border-[var(--border)]">
                                    <th className="px-8 py-5 font-black">Reference</th>
                                    <th className="px-6 py-5 font-black">Pajak Merchant</th>
                                    <th className="px-6 py-5 font-black">Pajak Pembeli</th>
                                    <th className="px-6 py-5 font-black">Total Biaya Gateway</th>
                                    <th className="px-8 py-5 text-right font-black">Diterima Bersih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-sm">
                                {paginatedTaxDetails.length > 0 ? paginatedTaxDetails.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-black/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-[var(--text-main)]">{tx.reference}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] opacity-70">{tx.payment_name}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-red-500">- Rp {(tx.fee_merchant || 0).toLocaleString('id-ID')}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-tighter">Pajak Merchant</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-amber-500">Rp {(tx.fee_customer || 0).toLocaleString('id-ID')}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-tighter">Pajak Pembeli</div>
                                        </td>
                                        <td className="px-6 py-6 text-red-500 font-black">
                                            Rp {(tx.fee || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-emerald-500 font-heading font-black text-lg">
                                                Rp {(tx.amount || 0).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] opacity-40 text-[10px] font-black uppercase tracking-widest">Tidak ada data biaya transaksi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                        <TablePagination 
                            currentPage={taxPage}
                            totalItems={taxDetails.length}
                            itemsPerPage={taxItemsPerPage}
                            onPageChange={setTaxPage}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Note */}
            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[32px] flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                    <h5 className="text-sm font-black text-amber-600 uppercase tracking-tight mb-1">Informasi Kebijakan Pajak</h5>
                    <p className="text-xs text-amber-700/80 leading-relaxed">
                        Laporan ini mencakup seluruh kewajiban pajak platform. Potongan PPN (11%) dihitung otomatis dari total Omzet Kotor sebelum potongan biaya apapun. Biaya Gateway adalah nominal yang ditarik oleh penyedia layanan pembayaran (TriPay) untuk kelancaran transaksi otomatis di platform.
                    </p>
                </div>
            </div>
        </div>
    );
};
