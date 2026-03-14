import { useState, useEffect } from 'react';
// Dummy comment to trigger re-index
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { 
    CheckCircle2, 
    Download, 
    Home, 
    CreditCard, 
    Calendar, 
    Hash, 
    Zap,
    Loader2,
    ArrowLeft,
    ShieldCheck,
    Printer
} from 'lucide-react';
import api from '../../services/api';

export const PaymentInvoiceView = () => {
    const { reference } = useParams<{ reference: string }>();
    const { user } = useOutletContext<any>();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await api.get(`/payment/status/${reference}`);
                // Since GetPaymentStatus returns minimal data, we might need a full detail endpoint if we have one,
                // or we use what we have. Let's see if we have a GetPayment endpoint.
                // Based on payment_controller.go: 
                // GET /payment/:id (protected)
                // Let's try to get full details using the ID from the status check.
                
                const statusData = response.data;
                const fullResponse = await api.get(`/finance/payment/${statusData.id}`);
                setTransaction(fullResponse.data);
            } catch (error) {
                console.error("Failed to fetch transaction details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [reference]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                <p className="font-medium text-dagang-gray">Mengambil detail invoice...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-serif text-dagang-dark mb-2">Invoice Tidak Ditemukan</h2>
                <p className="text-dagang-gray mb-8">Maaf, kami tidak dapat menemukan detail transaksi untuk referensi ini.</p>
                <Link to={`/${encodeURIComponent(user?.familyName)}/dashboard/overview`} className="text-dagang-green font-bold">
                    Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    const familyName = user?.familyName || '';

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Link 
                    to={`/${encodeURIComponent(familyName)}/dashboard/overview`}
                    className="inline-flex items-center gap-2 text-dagang-gray hover:text-dagang-dark transition-colors group font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
                </Link>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.print()}
                        className="h-12 px-6 bg-white border border-black/5 rounded-2xl flex items-center gap-2 font-bold text-sm hover:bg-dagang-cream transition-all shadow-sm"
                    >
                        <Printer className="w-4 h-4" /> Cetak
                    </button>
                    <button className="h-12 px-6 bg-dagang-dark text-white rounded-2xl flex items-center gap-2 font-bold text-sm hover:bg-black transition-all shadow-lg shadow-dagang-dark/10">
                        <Download className="w-4 h-4" /> Simpan PDF
                    </button>
                </div>
            </div>

            {/* Invoice Card */}
            <div className="bg-white rounded-[48px] border border-black/5 shadow-xl overflow-hidden print:border-none print:shadow-none">
                {/* Status Banner */}
                <div className={`p-8 text-center ${transaction.status === 'PAID' ? 'bg-dagang-green' : 'bg-amber-500'} text-white`}>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-serif mb-1">
                        {transaction.status === 'PAID' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
                    </h1>
                    <p className="opacity-80 text-sm">
                        Invoice ID: {transaction.reference}
                    </p>
                </div>

                <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Transaction Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-dagang-gray uppercase tracking-[0.2em] mb-4">Informasi Transaksi</h3>
                            <div className="space-y-5">
                                <InfoRow icon={Hash} label="Nomor Referensi" value={transaction.reference} />
                                <InfoRow icon={CreditCard} label="Metode Pembayaran" value={transaction.payment_name} />
                                <InfoRow icon={Calendar} label="Waktu Pembayaran" value={transaction.paid_at ? new Date(transaction.paid_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'} />
                                <InfoRow icon={ShieldCheck} label="Status" value={transaction.status} isStatus />
                            </div>
                        </div>

                        <div className="bg-dagang-cream/30 p-8 rounded-[32px] border border-dagang-green/10">
                            <h3 className="text-[10px] font-black text-dagang-gray uppercase tracking-[0.2em] mb-4">Paket Langganan</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-dagang-dark rounded-2xl flex items-center justify-center text-dagang-accent">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-dagang-dark">{transaction.plan_name}</div>
                                    <div className="text-xs text-dagang-gray">Berlaku selama masa aktif paket</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Breakdown */}
                    <div className="bg-dagang-gray/5 rounded-[40px] p-8 md:p-10">
                        <h3 className="text-[10px] font-black text-dagang-gray uppercase tracking-[0.2em] mb-6">Ringkasan Pembayaran</h3>
                        
                        <div className="space-y-4 mb-8">
                            <PriceRow label="Harga Paket" amount={transaction.amount} />
                            <PriceRow label="Biaya Layanan" amount={transaction.fee} />
                            <div className="h-px bg-black/5 my-4" />
                            <div className="flex justify-between items-center text-xl font-serif text-dagang-dark">
                                <span>Total Bayar</span>
                                <span className="text-2xl font-black text-dagang-green">
                                    Rp {(transaction.total_amount || (transaction.amount + transaction.fee))?.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-black/5 text-center">
                            <p className="text-[11px] text-dagang-gray leading-relaxed">
                                Invoice ini adalah bukti pembayaran yang sah. <br />
                                <strong>DagangFinance</strong> mengucapkan terima kasih atas kepercayaan Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer action */}
            <div className="flex justify-center">
                <Link 
                    to={`/${encodeURIComponent(familyName)}/dashboard/overview`}
                    className="h-16 px-12 bg-dagang-dark text-white rounded-full flex items-center gap-3 font-bold hover:bg-black transition-all shadow-xl shadow-dagang-dark/20 group"
                >
                    <Home className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Masuk ke Dashboard
                </Link>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value, isStatus }: any) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-dagang-gray/5 flex items-center justify-center text-dagang-gray shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest leading-none mb-1.5">{label}</div>
            <div className={`text-[15px] font-bold ${isStatus ? (value === 'PAID' ? 'text-dagang-green' : 'text-amber-500') : 'text-dagang-dark'}`}>
                {value}
            </div>
        </div>
    </div>
);

const PriceRow = ({ label, amount }: any) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-dagang-gray font-medium">{label}</span>
        <span className="font-bold text-dagang-dark">Rp {amount?.toLocaleString('id-ID')}</span>
    </div>
);

// End of file
