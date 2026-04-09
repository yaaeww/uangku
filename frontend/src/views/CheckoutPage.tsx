import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import { useModal } from '../providers/ModalProvider';
import { Logo } from '../components/common/Logo';

interface PaymentChannel {
    code: string;
    name: string;
    group: string;
    fee_flat: number;
    fee_percent: number;
    fee_borne_by: string;
    custom_fee_merchant: number;
    icon_url: string;
    is_manual?: boolean;
    account_name?: string;
    account_number?: string;
    description?: string;
}

type PaymentStatus = 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED';

export const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showAlert } = useModal();
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
    const [channels, setChannels] = useState<PaymentChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(null);
    
    const intervalRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);
    const user = useAuthStore(state => state.user);

    // Load plan on mount and check for existing pending payment
    useEffect(() => {
        if (!planId) {
            navigate('/pricing');
            return;
        }
        
        // Parallel load plan, active channels and check for pending status
        const init = async () => {
            try {
                const [planData, activeChannels] = await Promise.all([
                    AdminController.getPlanByID(planId),
                    PaymentController.getActiveChannels()
                ]);

                setPlan(planData);
                setChannels(activeChannels);
                
                // Set default method to first available channel
                if (activeChannels.length > 0) {
                    setMethod(activeChannels[0].code);
                    setSelectedChannel(activeChannels[0]);
                }
                
                // Try to resume pending payment
                try {
                    const pending = await PaymentController.getLatestPending(planId);
                    if (pending && pending.status === 'UNPAID') {
                        const expiry = new Date(pending.expired_at).getTime();
                        if (Date.now() < expiry) {
                            setPaymentResult(pending);
                            setPaymentStatus('UNPAID');
                        }
                    }
                } catch (e) {
                    // No pending found
                }
            } catch (err) {
                navigate('/pricing');
            } finally {
                setLoading(false);
            }
        };
        
        init();
    }, [planId, navigate]);

    // Poll for payment status every 5 seconds
    useEffect(() => {
        if (!paymentResult || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED') {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        intervalRef.current = setInterval(async () => {
            // 1. Local time check (immediate)
            const expiryTime = new Date(paymentResult.expired_at).getTime();
            if (Date.now() > expiryTime) {
                setPaymentStatus('EXPIRED');
                clearInterval(intervalRef.current);
                setIsPolling(false);
                return;
            }

            // 2. Server check (polling)
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
        }, 3000); // Increased polling speed to 3s for better UX

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
                    navigate(familyName ? `/${encodeURIComponent(familyName)}/dashboard/family/invoice/${paymentResult.reference}` : '/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, [paymentStatus, navigate, user]);

    const handleCancelPayment = async () => {
        if (!paymentResult) return;
        
        try {
            setLoading(true);
            await PaymentController.deletePayment(paymentResult.id);
            setPaymentResult(null);
            setPaymentStatus('UNPAID');
            localStorage.removeItem(`tripay_ref_${planId}`);
            toast.success('Pesanan dibatalkan. Silakan pilih metode pembayaran baru.');
        } catch (error) {
            console.error('Failed to cancel payment:', error);
            toast.error('Gagal membatalkan pesanan');
        } finally {
            setLoading(true); // Trigger re-fetch of plan/channels
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handlePayment = async () => {
        if (!planId || !method) return;
        setSubmitting(true);
        try {
            const result = await PaymentController.createPayment(planId, method);
            setPaymentResult(result);
            setPaymentStatus('UNPAID');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
            showAlert('Pembayaran Gagal', error.response?.data?.error || 'Gagal membuat pembayaran. Coba lagi.', 'danger');
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
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-dagang-green animate-spin mb-4" />
                <p className="font-bold text-[var(--text-main)]">Menyiapkan pembayaran aman...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-dagang-green-pale selection:text-dagang-green relative">
            {/* Header */}
            <header className="px-6 py-6 md:px-[60px] bg-[var(--surface-card)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-50">

                <div className="logo">
                    <Logo />
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <Step num="1" label="Pilih Paket" done />
                    <Step num="2" label="Pembayaran" active={!paymentResult || paymentStatus === 'UNPAID'} done={paymentStatus === 'PAID'} />
                    <Step num="3" label="Selesai" active={paymentStatus === 'PAID'} />
                </div>
                <div className="text-[13px] text-[var(--text-muted)] hidden sm:flex items-center gap-2">
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
                                <a href="/pricing" className="p-2 hover:bg-[var(--border)]/20 rounded-full transition-all">
                                    <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
                                </a>
                                <h1 className="font-serif text-[32px] text-[var(--text-main)]">Metode Pembayaran</h1>
                            </div>


                            {channels.length === 0 ? (
                                <div className="p-8 text-center bg-[var(--surface-card)] rounded-[24px] border border-[var(--border)]">
                                    <p className="text-[var(--text-muted)]">Tidak ada metode pembayaran yang tersedia saat ini.</p>
                                </div>

                            ) : (
                                <div className="space-y-4">
                                    {channels.map((chan) => (
                                        <PaymentMethod
                                            key={chan.code}
                                            id={chan.code}
                                            title={chan.name}
                                            description={chan.group}
                                            imgUrl={chan.icon_url}
                                            active={method === chan.code}
                                            onClick={() => {
                                                setMethod(chan.code);
                                                setSelectedChannel(chan);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="bg-[var(--surface-card)] rounded-[24px] p-8 border border-[var(--border)] shadow-sm space-y-6">
                                <h3 className="font-bold text-[var(--text-main)]">Cara Pembayaran</h3>
                                <div className="text-center py-6 border-2 border-dashed border-dagang-green/20 rounded-[20px] bg-dagang-green/5">
                                    <div className="text-[32px] mb-3">⚡</div>
                                    <p className="text-[14px] text-[var(--text-muted)] max-w-[300px] mx-auto">
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
                            <h2 className="font-serif text-[40px] mb-3 text-[var(--text-main)]">Pembayaran Berhasil!</h2>
                            <p className="text-[var(--text-muted)] mb-6">Langganan Anda kini telah aktif. Selamat menggunakan semua fitur premium.</p>

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
                            <h2 className="font-serif text-[40px] mb-3 text-[var(--text-main)]">
                                {paymentStatus === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' : 'Pembayaran Gagal'}
                            </h2>
                            <p className="text-[var(--text-muted)] mb-8">
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
                            <div className="bg-[var(--surface-card)] rounded-[32px] p-8 md:p-10 border border-[var(--border)] shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-dagang-green/5 rounded-bl-full -mr-16 -mt-16" />

                                <div className="flex items-center gap-3 text-dagang-green font-bold mb-4">
                                    <CheckCircle2 className="w-6 h-6" /> Pesanan Berhasil Dibuat
                                </div>

                                {/* Polling indicator */}
                                {isPolling && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 mb-6">
                                        <Loader2 className="w-4 h-4 animate-spin text-dagang-green" />
                                        <span>Menunggu konfirmasi pembayaran otomatis...</span>
                                    </div>
                                )}

                                <h2 className="font-serif text-[28px] mb-6 text-[var(--text-main)]">Selesaikan Pembayaran</h2>

                                {/* Reference Details */}
                                <div className="grid grid-cols-2 gap-4 mb-8 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)]">
                                    <div>
                                        <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest mb-1">ID PESANAN</div>
                                        <div className="text-sm font-bold text-[var(--text-main)] break-all">{paymentResult.merchant_ref}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest mb-1">NOMOR REFERENSI</div>
                                        <div className="text-sm font-bold text-[var(--text-main)] break-all">{paymentResult.reference}</div>
                                    </div>
                                </div>

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
                                    <div className="bg-[var(--surface)] p-8 rounded-2xl mb-10 border border-[var(--border)]">
                                        <div className="text-[12px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest mb-2">{paymentResult.payment_name} — Nomor Virtual Account</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[32px] font-mono tracking-widest text-dagang-green">{paymentResult.pay_code}</span>
                                            <button
                                                onClick={() => copyToClipboard(paymentResult.pay_code)}
                                                className="p-3 bg-[var(--surface-card)] text-[var(--text-main)] border border-[var(--border)] rounded-xl shadow-sm hover:bg-dagang-green hover:text-white transition-all"
                                            >
                                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm">
                                            <span className="text-[var(--text-muted)] opacity-60">Transfer tepat sesuai nominal. Kelebihan 1 rupiah pun tidak akan diproses.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Expiry */}
                                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-xl px-4 py-3 mb-8 border border-amber-500/20">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>Batas waktu pembayaran: <strong>{new Date(paymentResult.expired_at).toLocaleString('id-ID')}</strong></span>
                                </div>

                                {paymentResult.instructions && JSON.parse(paymentResult.instructions || '[]').length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2 text-[var(--text-main)]">
                                            <Info className="w-5 h-5 text-dagang-accent" /> Cara Pembayaran
                                        </h3>
                                        <div className="space-y-3">
                                            {JSON.parse(paymentResult.instructions || '[]').map((section: any, idx: number) => (
                                                <details key={idx} className="group bg-[var(--surface)] rounded-xl overflow-hidden" open={idx === 0}>
                                                    <summary className="p-4 font-bold text-sm cursor-pointer list-none flex justify-between items-center hover:bg-[var(--surface)]/80 transition-all text-[var(--text-main)]">
                                                        {section.title}
                                                        <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-all text-[var(--text-muted)]" />
                                                    </summary>
                                                    <div className="p-4 pt-2 space-y-2.5 border-t border-[var(--border)]/5">
                                                        {section.steps.map((step: string, sIdx: number) => (
                                                            <div key={sIdx} className="flex gap-3 text-[13px] text-[var(--text-muted)] leading-relaxed">
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

                                {/* Manual Bank Details */}
                                {paymentResult.pay_code === 'MANUAL' && (
                                    <div className="space-y-6">
                                        <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-xl">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-2">
                                                    {paymentResult.instructions_manual?.logo_url ? (
                                                        <img src={paymentResult.instructions_manual.logo_url} alt="Bank" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Wallet className="w-6 h-6 text-dagang-dark" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest">TRANSFER KE</div>
                                                    <div className="text-lg font-bold text-[var(--text-main)]">{paymentResult.payment_name}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest mb-1">NOMOR REKENING</div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-2xl font-mono tracking-wider font-bold text-[#F59E0B]">{paymentResult.account_number}</span>
                                                        <button 
                                                            onClick={() => copyToClipboard(paymentResult.account_number)}
                                                            className="p-2.5 bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded-xl hover:bg-[var(--border)]/30 transition-all"
                                                        >
                                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border)]">
                                                    <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest mb-1">ATAS NAMA</div>
                                                    <div className="text-lg font-bold text-[var(--text-main)]">{paymentResult.account_name || paymentResult.payment_name}</div>
                                                </div>

                                                {/* Manual QR Code */}
                                                {paymentResult.qr_code_url && (
                                                    <div className="bg-white p-4 rounded-2xl border border-black/5 flex flex-col items-center">
                                                        <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest mb-3">SCAN UNTUK BAYAR</div>
                                                        <img src={paymentResult.qr_code_url} alt="QR Code" className="w-[180px] h-[180px] object-contain rounded-xl" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
                                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-amber-800 dark:text-amber-500">Bukti Transfer Diperlukan</p>
                                                <p className="text-sm text-amber-700 dark:text-amber-600/80 leading-relaxed">Setelah melakukan transfer, silakan upload bukti pembayaran di halaman invoice untuk mempercepat verifikasi oleh Admin.</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                const familyName = user?.familyName;
                                                navigate(familyName ? `/${encodeURIComponent(familyName)}/dashboard/family/invoice/${paymentResult.reference}` : '/dashboard');
                                            }}
                                            className="w-full py-5 bg-dagang-green text-white rounded-[24px] font-black tracking-widest uppercase text-xs shadow-xl shadow-dagang-green/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                                        >
                                            Mulai Upload Bukti & Lihat Invoice
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5 lg:sticky lg:top-[120px]">
                    <div className="bg-[var(--surface-card)] text-[var(--text-main)] rounded-[32px] p-9 shadow-2xl relative overflow-hidden border border-[var(--border)]">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-dagang-green/5 blur-[80px] rounded-full" />

                        <h3 className="text-[18px] font-serif mb-8 text-[var(--text-muted)] opacity-60">Ringkasan Pesanan</h3>

                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[11px] font-bold text-[#F59E0B] tracking-[0.1em] mb-1 uppercase">PAKET TERPILIH</div>
                                    <div className="text-[20px] font-serif">{plan?.name}</div>
                                    <div className="text-[12px] text-[var(--text-muted)] opacity-60 mt-0.5">{plan?.duration_days} hari akses penuh</div>
                                </div>
                                <div className="text-xl font-serif">Rp {plan?.price?.toLocaleString('id-ID')}</div>
                            </div>
                            <ul className="space-y-2.5 mt-4 pt-4 border-t border-[var(--border)]">
                                {(plan?.features ? (typeof plan.features === 'string' ? plan.features.split(';') : plan.features) : []).map((f: string, i: number) => (
                                    <li key={i} className="text-[13px] text-[var(--text-muted)] flex items-center gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-dagang-green flex-shrink-0" /> {f.trim()}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {!paymentResult || paymentStatus !== 'PAID' ? (
                            <>
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-[14px]">
                                        <span className="text-[var(--text-muted)] opacity-60">Subtotal</span>
                                        <span className="font-medium">Rp {plan?.price?.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    {/* Show dynamic fee calculation */}
                                    {(!paymentResult && selectedChannel && selectedChannel.fee_borne_by === 'customer') && (
                                        <div className="flex justify-between text-[14px] animate-in slide-in-from-right-2">
                                            <span className="text-[var(--text-muted)] opacity-60">Biaya Layanan & Pajak</span>
                                            <span className="font-medium">
                                                Rp {Math.ceil(
                                                    ((plan.price + selectedChannel.fee_flat) / (1 - (selectedChannel.fee_percent / 100))) - plan.price
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}

                                    {paymentResult && ((paymentResult.total_amount || paymentResult.amount) - plan?.price) > 0 && (
                                        <div className="flex justify-between text-[14px]">
                                            <span className="text-[var(--text-muted)] opacity-60">Biaya Layanan & Pajak</span>
                                            <span className="font-medium">Rp {((paymentResult.total_amount || paymentResult.amount) - plan?.price)?.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    {paymentResult && (
                                        <button 
                                            onClick={handleCancelPayment}
                                            className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-red-400 transition-all py-2.5 rounded-xl border border-[var(--border)] hover:border-red-400/40 bg-[var(--surface)] hover:bg-red-400/5 shadow-sm"
                                        >
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            Batalkan & Ganti Metode
                                        </button>
                                    )}

                                    <div className="h-px bg-[var(--border)]/30 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[18px] font-serif">Total Bayar</span>
                                        <span className="text-[28px] font-serif text-[#F59E0B]">
                                            Rp {(paymentResult 
                                                ? (paymentResult.total_amount || (paymentResult.amount + paymentResult.fee)) 
                                                : selectedChannel?.fee_borne_by === 'customer' 
                                                    ? Math.ceil((plan.price + selectedChannel.fee_flat) / (1 - (selectedChannel.fee_percent / 100)))
                                                    : plan?.price)?.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>

                                {!paymentResult && (
                                    <button
                                        onClick={handlePayment}
                                        disabled={submitting}
                                        className="w-full py-4 bg-dagang-green text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/20 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
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
                                <div className="text-[var(--text-muted)] opacity-50 text-sm">{plan?.name}</div>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)] opacity-40 uppercase tracking-widest font-black">
                            <ShieldCheck className="w-3.5 h-3.5" /> Transaksi Aman &amp; Terenkripsi
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

const Step = ({ num, label, active = false, done = false }: any) => (
    <div className="flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${done ? 'bg-dagang-green text-white' : active ? 'bg-[#F59E0B] text-white' : 'bg-[var(--border)]/30 text-[var(--text-muted)]'}`}>
            {done ? '✓' : num}
        </div>
        <span className={`text-[13px] font-bold tracking-tight ${active || done ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] opacity-50'}`}>{label}</span>
        {num < '3' && <div className="h-[2px] w-6 bg-[var(--border)]/30" />}
    </div>
);


const PaymentMethod = ({ id, title, description, imgUrl, icon, active, onClick }: any) => (
    <div
        id={id}
        onClick={onClick}
        className={`p-5 rounded-[20px] border-2 cursor-pointer transition-all flex items-center justify-between group ${active ? 'bg-[var(--surface-card)] border-dagang-green shadow-xl shadow-dagang-green/5' : 'bg-[var(--surface-card)] border-[var(--border)] hover:border-dagang-green/30'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden transition-all ${active ? 'bg-white border border-black/10 shadow-sm' : 'bg-[var(--surface)] text-[var(--text-muted)] group-hover:bg-dagang-green/10 group-hover:text-dagang-green'}`}>
                {imgUrl ? <img src={imgUrl} alt={title} className="w-full h-full object-contain p-1" /> : icon}
            </div>
            <div>
                <div className={`text-[15px] font-bold transition-all ${active ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{title}</div>
                <div className="text-[12px] text-[var(--text-muted)]/60 italic">{description}</div>
            </div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-dagang-green bg-dagang-green' : 'border-[var(--border)]'}`}>
            {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
    </div>
);

