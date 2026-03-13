import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Image as ImageIcon,
    CheckCircle2,
    ChevronRight,
    HelpCircle,
    Wallet,
    Loader2,
    ExternalLink,
    Copy,
    Info,
    Check,
    XCircle,
    Clock,
    RefreshCw,
} from 'lucide-react';

import { AdminController } from '../controllers/AdminController';
import { PaymentController } from '../controllers/PaymentController';
import { useAuthStore } from '../store/authStore';

const TRIPAY_MAPPING: Record<string, string> = {
    'qris': 'QRIS2',
    'va_bri': 'BRIVA',
    'va_bni': 'BNIVA',
    'va_mandiri': 'MANDIRIVA',
    'va_bca': 'BCAVA',
};

type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED';

export const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const planId = searchParams.get('plan_id');

    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState('qris');
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
    const [countdown, setCountdown] = useState(3);
    const [isPolling, setIsPolling] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const intervalRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);
    const user = useAuthStore(state => state.user);

    // Load plan on mount
    useEffect(() => {
        if (!planId) {
            navigate('/pricing');
            return;
        }
        AdminController.getPlanByID(planId)
            .then(setPlan)
            .catch(() => navigate('/pricing'))
            .finally(() => setLoading(false));
    }, [planId, navigate]);

    // Poll for payment status every 5 seconds
    useEffect(() => {
        if (!paymentResult || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED') {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        intervalRef.current = setInterval(async () => {
            try {
                const status = await PaymentController.getPaymentStatus(paymentResult.reference);
                if (status.status !== 'UNPAID') {
                    setPaymentStatus(status.status as PaymentStatus);
                    clearInterval(intervalRef.current);
                    setIsPolling(false);
                }
            } catch (err) {
                console.warn('[Polling] Error checking status:', err);
            }
        }, 5000);

        return () => clearInterval(intervalRef.current);
    }, [paymentResult, paymentStatus]);

    // Auto-redirect countdown after PAID
    useEffect(() => {
        if (paymentStatus !== 'PAID') return;
        setCountdown(3);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    const familyName = user?.familyName;
                    navigate(familyName ? `/${encodeURIComponent(familyName)}/dashboard` : '/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, [paymentStatus, navigate, user]);

    const handlePayment = async () => {
        if (!planId) return;
        setSubmitting(true);
        try {
            const result = await PaymentController.createPayment(planId, TRIPAY_MAPPING[method]);
            // If it's a redirect method (e-wallet) and has a checkout URL
            if (result.checkout_url && result.payment_method !== 'QRIS2' && !result.qr_code_url) {
                window.location.href = result.checkout_url;
                return;
            }
            setPaymentResult(result);
            setPaymentStatus('UNPAID');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal membuat pembayaran. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setPaymentResult(null);
        setPaymentStatus('UNPAID');
        clearInterval(intervalRef.current);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dagang-cream/50 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                <p className="font-bold text-dagang-dark">Menyiapkan pembayaran aman...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dagang-cream/50 text-dagang-dark font-sans selection:bg-dagang-green-pale selection:text-dagang-green relative">
            {/* Header */}
            <header className="px-6 py-6 md:px-[60px] bg-white border-b border-black/5 flex items-center justify-between sticky top-0 z-50">
                <div className="logo font-serif text-2xl text-dagang-green">
                    Dagang<span className="text-dagang-accent">Finance</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <Step num="1" label="Pilih Paket" done />
                    <Step num="2" label="Pembayaran" active={!paymentResult || paymentStatus === 'UNPAID'} done={paymentStatus === 'PAID'} />
                    <Step num="3" label="Selesai" active={paymentStatus === 'PAID'} />
                </div>
                <div className="text-[13px] text-dagang-gray hidden sm:flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Butuh bantuan?
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto p-6 md:p-12 lg:p-[72px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-10">
                    {!paymentResult ? (
                        /* === Step 1: Select Payment Method === */
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <a href="/pricing" className="p-2 hover:bg-black/5 rounded-full transition-all">
                                    <ArrowLeft className="w-5 h-5 text-dagang-gray" />
                                </a>
                                <h1 className="font-serif text-[32px]">Metode Pembayaran</h1>
                            </div>

                            <div className="space-y-4">
                                <PaymentMethod
                                    id="qris"
                                    title="QRIS (Gopay, OVO, Dana, LinkAja, dll)"
                                    description="Bayar cepat dengan scan kode QR"
                                    icon={<ImageIcon className="w-5 h-5" />}
                                    active={method === 'qris'}
                                    onClick={() => setMethod('qris')}
                                />
                                <PaymentMethod
                                    id="va_bri"
                                    title="Virtual Account BRI"
                                    description="Transfer dari rekening BRI, BCA, Mandiri dll"
                                    icon={<Wallet className="w-5 h-5" />}
                                    active={method === 'va_bri'}
                                    onClick={() => setMethod('va_bri')}
                                />
                                <PaymentMethod
                                    id="va_bni"
                                    title="Virtual Account BNI"
                                    description="Transfer dari rekening manapun ke VA BNI"
                                    icon={<Wallet className="w-5 h-5" />}
                                    active={method === 'va_bni'}
                                    onClick={() => setMethod('va_bni')}
                                />
                                <PaymentMethod
                                    id="va_mandiri"
                                    title="Virtual Account Mandiri"
                                    description="Transfer dari rekening Mandiri atau bank lain"
                                    icon={<CreditCard className="w-5 h-5" />}
                                    active={method === 'va_mandiri'}
                                    onClick={() => setMethod('va_mandiri')}
                                />
                            </div>

                            <div className="bg-white rounded-[24px] p-8 border border-black/5 shadow-sm space-y-6">
                                <h3 className="font-bold">Cara Pembayaran</h3>
                                <div className="text-center py-6 border-2 border-dashed border-dagang-green/20 rounded-[20px] bg-dagang-green-pale/50">
                                    <div className="text-[32px] mb-3">⚡</div>
                                    <p className="text-[14px] text-dagang-gray max-w-[300px] mx-auto">
                                        Klik tombol <strong>Bayar Sekarang</strong>. Detail pembayaran aman akan langsung muncul.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : paymentStatus === 'PAID' ? (
                        /* === Step 3: Payment Success === */
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-28 h-28 bg-dagang-green text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-dagang-green/30 animate-bounce-slow">
                                <Check className="w-14 h-14" />
                            </div>
                            <h2 className="font-serif text-[40px] mb-3 text-dagang-dark">Pembayaran Berhasil!</h2>
                            <p className="text-dagang-gray mb-6">Langganan Anda kini telah aktif. Selamat menggunakan semua fitur premium.</p>
                            <div className="inline-flex items-center gap-2 text-sm bg-dagang-green/10 text-dagang-green font-bold px-4 py-2 rounded-full">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mengalihkan ke dashboard dalam {countdown} detik...
                            </div>
                        </div>
                    ) : paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED' ? (
                        /* === Payment Failed/Expired === */
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-28 h-28 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
                                {paymentStatus === 'EXPIRED' ? <Clock className="w-14 h-14" /> : <XCircle className="w-14 h-14" />}
                            </div>
                            <h2 className="font-serif text-[40px] mb-3 text-dagang-dark">
                                {paymentStatus === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' : 'Pembayaran Gagal'}
                            </h2>
                            <p className="text-dagang-gray mb-8">
                                {paymentStatus === 'EXPIRED'
                                    ? 'Waktu pembayaran telah habis. Silakan buat transaksi baru.'
                                    : 'Pembayaran tidak berhasil diproses. Silakan coba lagi.'}
                            </p>
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-2 bg-dagang-green text-white px-8 py-4 rounded-2xl font-bold text-[16px] hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20"
                            >
                                <RefreshCw className="w-5 h-5" /> Coba Lagi
                            </button>
                        </div>
                    ) : (
                        /* === Step 2: Waiting for Payment === */
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-black/5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-dagang-green/5 rounded-bl-full -mr-16 -mt-16" />

                                <div className="flex items-center gap-3 text-dagang-green font-bold mb-4">
                                    <CheckCircle2 className="w-6 h-6" /> Pesanan Berhasil Dibuat
                                </div>

                                {/* Polling indicator */}
                                {isPolling && (
                                    <div className="flex items-center gap-2 text-sm text-dagang-gray bg-dagang-cream/50 border border-dagang-green/20 rounded-xl px-4 py-2 mb-6">
                                        <Loader2 className="w-4 h-4 animate-spin text-dagang-green" />
                                        <span>Menunggu konfirmasi pembayaran otomatis...</span>
                                    </div>
                                )}

                                <h2 className="font-serif text-[28px] mb-8">Selesaikan Pembayaran</h2>

                                {/* QR Code */}
                                {paymentResult.qr_code_url && (
                                    <div className="text-center mb-10">
                                        <div className="bg-white p-6 inline-block rounded-2xl border-2 border-dagang-green/10 shadow-lg text-center">
                                            <img src={paymentResult.qr_code_url} alt="QR Code" className="w-[220px] h-[220px] mx-auto mb-4" />
                                            <p className="text-[12px] font-bold text-dagang-gray tracking-widest">SCAN DENGAN APLIKASI DOMPET DIGITAL ANDA</p>
                                        </div>
                                    </div>
                                )}

                                {/* VA / Pay Code */}
                                {!paymentResult.qr_code_url && paymentResult.pay_code && (
                                    <div className="bg-dagang-cream/50 p-8 rounded-2xl mb-10 border border-dagang-green/10">
                                        <div className="text-[12px] font-bold text-dagang-gray uppercase tracking-widest mb-2">{paymentResult.payment_name} — Nomor Virtual Account</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[32px] font-mono tracking-widest text-dagang-green">{paymentResult.pay_code}</span>
                                            <button
                                                onClick={() => copyToClipboard(paymentResult.pay_code)}
                                                className="p-3 bg-white rounded-xl shadow-sm hover:bg-dagang-green hover:text-white transition-all"
                                            >
                                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-dagang-gray/10 flex items-center justify-between text-sm">
                                            <span className="text-dagang-gray">Transfer tepat sesuai nominal. Kelebihan 1 rupiah pun tidak akan diproses.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Expiry */}
                                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-8 border border-amber-200">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>Batas waktu pembayaran: <strong>{new Date(paymentResult.expired_at).toLocaleString('id-ID')}</strong></span>
                                </div>

                                {/* Instructions */}
                                {paymentResult.instructions && JSON.parse(paymentResult.instructions || '[]').length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Info className="w-5 h-5 text-dagang-accent" /> Cara Pembayaran
                                        </h3>
                                        <div className="space-y-3">
                                            {JSON.parse(paymentResult.instructions || '[]').map((section: any, idx: number) => (
                                                <details key={idx} className="group bg-dagang-cream/40 rounded-xl overflow-hidden" open={idx === 0}>
                                                    <summary className="p-4 font-bold text-sm cursor-pointer list-none flex justify-between items-center hover:bg-dagang-cream transition-all">
                                                        {section.title}
                                                        <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-all text-dagang-gray" />
                                                    </summary>
                                                    <div className="p-4 pt-2 space-y-2.5">
                                                        {section.steps.map((step: string, sIdx: number) => (
                                                            <div key={sIdx} className="flex gap-3 text-[13px] text-dagang-gray leading-relaxed">
                                                                <span className="w-5 h-5 rounded-full bg-dagang-green/10 text-dagang-green flex items-center justify-center flex-shrink-0 text-[10px] font-black">{sIdx + 1}</span>
                                                                <p dangerouslySetInnerHTML={{ __html: step }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Already paid notice */}
                            <div className="bg-dagang-green/5 border border-dagang-green/20 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-2 bg-dagang-green/10 rounded-lg text-dagang-green mt-0.5">
                                    <ExternalLink className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Sudah selesai bayar?</p>
                                    <p className="text-[13px] text-dagang-gray leading-relaxed">
                                        Sistem otomatis memverifikasi pembayaran setiap 5 detik. Anda <strong>tidak perlu refresh</strong> halaman ini.
                                    </p>
                                    {paymentResult.checkout_url && (
                                        <a href={paymentResult.checkout_url} target="_blank" rel="noopener noreferrer" className="text-dagang-green text-sm font-bold inline-block mt-1 underline">
                                            Lihat Halaman TriPay →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5 lg:sticky lg:top-[120px]">
                    <div className="bg-dagang-dark text-white rounded-[32px] p-9 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full" />

                        <h3 className="text-[18px] font-serif mb-8 text-white/60">Ringkasan Pesanan</h3>

                        <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[11px] font-bold text-dagang-accent tracking-[0.1em] mb-1 uppercase">PAKET TERPILIH</div>
                                    <div className="text-[20px] font-serif">{plan?.name}</div>
                                    <div className="text-[12px] text-white/40 mt-0.5">{plan?.duration_days} hari akses penuh</div>
                                </div>
                                <div className="text-xl font-serif">Rp {plan?.price?.toLocaleString()}</div>
                            </div>
                            <ul className="space-y-2.5 mt-4 pt-4 border-t border-white/10">
                                {(plan?.features ? (typeof plan.features === 'string' ? plan.features.split(';') : plan.features) : []).map((f: string, i: number) => (
                                    <li key={i} className="text-[13px] text-white/50 flex items-center gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-dagang-green flex-shrink-0" /> {f.trim()}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {!paymentResult || paymentStatus !== 'PAID' ? (
                            <>
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-[14px]">
                                        <span className="text-white/40">Subtotal</span>
                                        <span>Rp {plan?.price?.toLocaleString()}</span>
                                    </div>
                                    {paymentResult && (
                                        <div className="flex justify-between text-[14px]">
                                            <span className="text-white/40">Biaya Layanan</span>
                                            <span>Rp {paymentResult.fee?.toLocaleString() || '0'}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[18px] font-serif">Total Bayar</span>
                                        <span className="text-[28px] font-serif text-dagang-accent">
                                            Rp {(paymentResult ? paymentResult.total_amount || paymentResult.amount : plan?.price)?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {!paymentResult && (
                                    <button
                                        onClick={handlePayment}
                                        disabled={submitting}
                                        className="w-full py-4 bg-dagang-green text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/20 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
                                    >
                                        {submitting
                                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                                            : <>Bayar Sekarang <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                        }
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-dagang-green font-bold text-lg mb-1">✓ Langganan Aktif</div>
                                <div className="text-white/40 text-sm">{plan?.name}</div>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> Transaksi Aman &amp; Terenkripsi via TriPay
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const Step = ({ num, label, active = false, done = false }: any) => (
    <div className="flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${done ? 'bg-dagang-green text-white' : active ? 'bg-dagang-accent text-white' : 'bg-black/5 text-dagang-gray/60'}`}>
            {done ? '✓' : num}
        </div>
        <span className={`text-[13px] font-bold tracking-tight ${active || done ? 'text-dagang-dark' : 'text-dagang-gray/50'}`}>{label}</span>
        {num < '3' && <div className="h-[2px] w-6 bg-black/5" />}
    </div>
);

const PaymentMethod = ({ id, title, description, icon, active, onClick }: any) => (
    <div
        id={id}
        onClick={onClick}
        className={`p-5 rounded-[20px] border-2 cursor-pointer transition-all flex items-center justify-between group ${active ? 'bg-white border-dagang-green shadow-xl shadow-dagang-green/5' : 'bg-white border-black/5 hover:border-black/10'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20' : 'bg-dagang-cream text-dagang-gray/60 group-hover:bg-dagang-green-pale group-hover:text-dagang-green'}`}>
                {icon}
            </div>
            <div>
                <div className={`text-[15px] font-bold transition-all ${active ? 'text-dagang-dark' : 'text-dagang-gray'}`}>{title}</div>
                <div className="text-[12px] text-dagang-gray/60">{description}</div>
            </div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-dagang-green bg-dagang-green' : 'border-black/10'}`}>
            {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
    </div>
);
