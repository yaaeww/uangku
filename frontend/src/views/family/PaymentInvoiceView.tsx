import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useOutletContext } from 'react-router-dom';
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
    Printer,
    Upload,
    Image as ImageIcon,
    AlertCircle,
    Info,
    ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PaymentController } from '../../controllers/PaymentController';

export const PaymentInvoiceView = () => {
    const navigate = useNavigate();
    const { reference } = useParams<{ reference: string }>();
    const { user } = useOutletContext<any>();
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fetchTransaction = async () => {
        try {
            // 1. Get basic status
            const response = await api.get(`/payment/status/${reference}`);
            
            // 2. Get full details including plan_id
            const statusData = response.data;
            const fullResponse = await api.get(`/finance/payment/${statusData.id}`);
            const data = fullResponse.data;

            // 3. Smart Logic: Redirect to checkout if Pending (Tripay) & Not Expired
            // For Manual Payments (pay_code === 'MANUAL'), we stay here to upload proof
            if (data.status === 'UNPAID' && data.pay_code !== 'MANUAL') {
                const expiry = new Date(data.expired_at).getTime();
                const now = Date.now();
                
                if (now < expiry) {
                    // User still has time, send them back to interactive checkout
                    navigate(`/checkout?plan_id=${data.plan_id}`);
                    return;
                } else {
                    // Locally enforce expired status if server hasn't updated yet
                    data.status = 'EXPIRED';
                }
            }

            setTransaction(data);
        } catch (error) {
            console.error("Failed to fetch transaction details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransaction();
    }, [reference, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 2MB");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadProof = async () => {
        if (!selectedFile || !transaction) return;
        
        try {
            setUploading(true);
            await PaymentController.uploadProof(transaction.id, selectedFile);
            toast.success("Bukti transfer berhasil diupload. Menunggu verifikasi admin.");
            fetchTransaction(); // Refresh data
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal mengupload bukti transfer");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                <p className="font-medium text-[var(--text-muted)] opacity-60">Mengambil detail invoice...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <Zap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-serif text-[var(--text-main)] mb-2">Invoice Tidak Ditemukan</h2>
                <p className="text-[var(--text-muted)] opacity-70 mb-8">Maaf, kami tidak dapat menemukan detail transaksi untuk referensi ini.</p>
                <Link to={`/${encodeURIComponent(user?.familyName)}/dashboard/overview`} className="text-[var(--primary)] font-bold hover:underline">
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
                    className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
                </Link>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.print()}
                        className="h-12 px-6 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl flex items-center gap-2 font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                    >
                        <Printer className="w-4 h-4" /> Cetak
                    </button>
                    <button className="h-12 px-6 bg-[var(--text-main)] text-[var(--background)] rounded-2xl flex items-center gap-2 font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-black/20">
                        <Download className="w-4 h-4" /> Simpan PDF
                    </button>
                </div>
            </div>

            {/* Invoice Card */}
            <div className="bg-[var(--surface-card)] rounded-[48px] border border-[var(--border)] shadow-xl overflow-hidden print:border-none print:shadow-none">
                {/* Status Banner */}
                <div className={`p-8 text-center ${
                    transaction.status === 'PAID' ? 'bg-dagang-green' : 
                    transaction.status === 'PENDING_APPROVAL' ? 'bg-blue-600' :
                    transaction.status === 'REFUND' ? 'bg-blue-600' : 
                    (transaction.status === 'EXPIRED' || transaction.status === 'FAILED') ? 'bg-red-500' :
                    'bg-amber-500'
                } text-white`}>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500 border border-white/20">
                        {transaction.status === 'PAID' ? <CheckCircle2 className="w-10 h-10" /> : <Zap className="w-10 h-10" />}
                    </div>
                    <h1 className="text-3xl font-serif mb-1">
                        {transaction.status === 'PAID' ? 'Pembayaran Berhasil' : 
                         transaction.status === 'PENDING_APPROVAL' ? 'Menunggu Verifikasi' :
                         transaction.status === 'REFUND' ? 'Dana Dikembalikan' :
                         transaction.status === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' :
                         transaction.status === 'FAILED' ? 'Pembayaran Gagal' :
                         'Menunggu Pembayaran'}
                    </h1>
                    <p className="opacity-80 text-sm">
                        Invoice ID: {transaction.reference}
                    </p>
                </div>

                <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Transaction Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em] mb-4">Informasi Transaksi</h3>
                            <div className="space-y-5">
                                <InfoRow icon={Hash} label="Nomor Referensi" value={transaction.reference} />
                                <InfoRow icon={CreditCard} label="Metode Pembayaran" value={transaction.payment_name} />
                                <InfoRow 
                                    icon={Calendar} 
                                    label={transaction.status === 'PAID' ? "Waktu Pembayaran" : "Waktu Pesanan"} 
                                    value={new Date(transaction.status === 'PAID' ? transaction.paid_at : transaction.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} 
                                />
                                {transaction.status !== 'PAID' && transaction.expired_at && (
                                    <InfoRow 
                                        icon={Zap} 
                                        label="Batas Pembayaran" 
                                        value={new Date(transaction.expired_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} 
                                    />
                                )}
                                <InfoRow icon={ShieldCheck} label="Status" value={transaction.status} />
                            </div>
                        </div>

                        <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] border border-[var(--border)]">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em] mb-4">Paket Langganan</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[var(--text-main)] rounded-2xl flex items-center justify-center text-[var(--accent)] border border-white/10">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[var(--text-main)]">{transaction.plan_name}</div>
                                    <div className="text-xs text-[var(--text-muted)] opacity-60">Berlaku selama masa aktif paket</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Breakdown & Manual Actions */}
                    <div className="space-y-8">
                        <div className="bg-black/5 dark:bg-white/5 rounded-[40px] p-8 md:p-10 border border-[var(--border)]">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em] mb-6">Ringkasan Pembayaran</h3>
                            
                            <div className="space-y-4 mb-8">
                                <PriceRow label="Harga Paket" amount={transaction.amount} />
                                <PriceRow label="Biaya Layanan" amount={transaction.fee} />
                                <div className="h-px bg-[var(--border)] my-4" />
                                <div className="flex justify-between items-center text-xl font-serif text-[var(--text-main)]">
                                    <span>Total Bayar</span>
                                    <span className="text-2xl font-black text-dagang-green">
                                        Rp {(transaction.total_amount || (transaction.amount + transaction.fee))?.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-[var(--border)] text-center">
                                <p className="text-[11px] text-[var(--text-muted)] opacity-70 leading-relaxed">
                                    Invoice ini adalah bukti pembayaran yang sah. <br />
                                    <strong>UangKu</strong> mengucapkan terima kasih atas kepercayaan Anda.
                                </p>
                            </div>
                        </div>

                        {/* Manual Payment Section */}
                        {transaction.pay_code === 'MANUAL' && (
                            <div className="space-y-6">
                                {/* Bank Info */}
                                {transaction.status === 'UNPAID' && (
                                    <div className="bg-[var(--text-main)] text-[var(--background)] p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16" />
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 border border-white/20">
                                                <CreditCard className="w-6 h-6 text-dagang-dark" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">TRANSFER MANUAL</div>
                                                <div className="text-lg font-bold">{transaction.payment_name}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">NOMOR REKENING</div>
                                                <div className="text-2xl font-mono tracking-wider font-bold text-dagang-accent">{transaction.account_number}</div>
                                                <div className="text-[11px] text-white/50 mt-1 uppercase font-black tracking-widest opacity-80">A/N {transaction.account_name}</div>
                                            </div>

                                            {/* Manual QR Code */}
                                            {transaction.qr_code_url && (
                                                <div className="bg-white p-5 rounded-2xl border border-white/10 flex flex-col items-center">
                                                    <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest mb-3">SCAN UNTUK BAYAR</div>
                                                    <img src={transaction.qr_code_url} alt="QR Code" className="w-[200px] h-[200px] object-contain rounded-xl" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-[11px] text-white/40 leading-relaxed italic">
                                            *Pastikan melakukan transfer sesuai nominal total yang tertera di atas agar verifikasi lancar.
                                        </div>
                                    </div>
                                )}

                                {/* Proof Upload */}
                                {transaction.status === 'UNPAID' && (
                                    <div className="bg-white dark:bg-black/20 p-8 rounded-[40px] border border-[var(--border)] shadow-xl space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-dagang-amber/10 text-dagang-amber rounded-xl flex items-center justify-center">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-heading font-black text-[var(--text-main)]">Upload Bukti Transfer</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {!previewUrl ? (
                                                <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-[var(--border)] rounded-3xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all group">
                                                    <ImageIcon className="w-10 h-10 text-[var(--text-muted)] opacity-30 group-hover:scale-110 transition-transform" />
                                                    <div className="text-center">
                                                        <p className="font-bold text-sm text-[var(--text-main)]">Klik untuk pilih file</p>
                                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">PNG, JPG, WEBP (Max 2MB)</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                            ) : (
                                                <div className="relative aspect-video rounded-3xl overflow-hidden border border-[var(--border)] bg-black/5">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                                    <button 
                                                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <button 
                                                onClick={handleUploadProof}
                                                disabled={!selectedFile || uploading}
                                                className="w-full py-5 bg-dagang-green text-white rounded-[24px] font-black tracking-widest uppercase text-xs shadow-xl shadow-dagang-green/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:scale-100"
                                            >
                                                {uploading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> MENGUPLOAD...</>
                                                ) : (
                                                    <><ShieldCheck className="w-4 h-4" /> KIRIM BUKTI TRANSFER</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Notes */}
                                {transaction.admin_notes && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] space-y-2 mb-6 text-left">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <Info className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Catatan dari Admin</span>
                                        </div>
                                        <p className="text-sm font-medium text-amber-900/80 dark:text-amber-400/80 leading-relaxed italic">
                                            "{transaction.admin_notes}"
                                        </p>
                                    </div>
                                )}

                                {/* Waiting Message */}
                                {transaction.status === 'PENDING_APPROVAL' && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[40px] text-center space-y-4">
                                            <div className="w-16 h-16 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                                                <AlertCircle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-blue-900 dark:text-blue-400">Verifikasi Sedang Berlangsung</h3>
                                                <p className="text-sm text-blue-800/70 dark:text-blue-400/60 leading-relaxed mt-2">
                                                    Bukti transfer Anda telah kami terima. Admin kami akan segera memverifikasi transaksi ini. 
                                                    Proses ini biasanya memakan waktu 5-30 menit pada jam kerja.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {transaction.proof_url && (
                                            <div className="bg-[var(--surface-card)] border border-[var(--border)] p-6 rounded-[32px] space-y-3">
                                                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-between">
                                                    Bukti yang diupload
                                                    <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex items-center gap-1 hover:underline">
                                                        Liat Full <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="aspect-video rounded-2xl overflow-hidden border border-[var(--border)] bg-black/5">
                                                    <img src={transaction.proof_url} alt="Bukti Transfer" className="w-full h-full object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer action */}
            <div className="flex justify-center">
                <Link 
                    to={`/${encodeURIComponent(familyName)}/dashboard/overview`}
                    className="h-16 px-12 bg-[var(--text-main)] text-[var(--background)] rounded-full flex items-center gap-3 font-bold hover:opacity-90 transition-all shadow-xl shadow-black/20 group"
                >
                    <Home className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Masuk ke Dashboard
                </Link>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-muted)] opacity-60 shrink-0 border border-[var(--border)]">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest leading-none mb-1.5">{label}</div>
            <div className={`text-[15px] font-bold ${
                value === 'PAID' ? 'text-dagang-green' : 
                value === 'PENDING_APPROVAL' ? 'text-blue-600' :
                value === 'REFUND' ? 'text-blue-600' :
                (value === 'EXPIRED' || value === 'FAILED') ? 'text-red-500' :
                'text-amber-500'
            }`}>
                {value === 'PENDING_APPROVAL' ? 'VERIFIKASI' : value}
            </div>
        </div>
    </div>
);

const PriceRow = ({ label, amount }: any) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--text-muted)] opacity-70 font-medium">{label}</span>
        <span className="font-bold text-[var(--text-main)]">Rp {amount?.toLocaleString('id-ID')}</span>
    </div>
);

// End of file
