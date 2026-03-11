import { useState } from 'react';
import {
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Image as ImageIcon,
    CheckCircle2,
    ChevronRight,
    HelpCircle,
    Tag,
    Wallet,
    Smartphone
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';

export const CheckoutPage = () => {
    const user = useAuthStore(state => state.user);
    const [method, setMethod] = useState('qris');
    const [success, setSuccess] = useState(false);

    return (
        <div className="min-h-screen bg-dagang-cream/50 text-dagang-dark font-sans selection:bg-dagang-green-pale selection:text-dagang-green relative">
            {/* Header */}
            <header className="px-6 py-6 md:px-[60px] bg-white border-b border-black/5 flex items-center justify-between sticky top-0 z-50">
                <div className="logo font-serif text-2xl text-dagang-green">
                    Dagang<span className="text-dagang-accent">Finance</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <Step num="1" label="Pilih Paket" done />
                    <Step num="2" label="Pembayaran" active />
                    <Step num="3" label="Selesai" />
                </div>
                <div className="text-[13px] text-dagang-gray hidden sm:flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Butuh bantuan?
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto p-6 md:p-12 lg:p-[72px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column: Payment Methods */}
                <div className="lg:col-span-7 space-y-10">
                    <div className="flex items-center gap-3 mb-2">
                        <a href="/pricing" className="p-2 hover:bg-black/5 rounded-full transition-all">
                            <ArrowLeft className="w-5 h-5 text-dagang-gray" />
                        </a>
                        <h1 className="font-serif text-[32px]">Metode Pembayaran</h1>
                    </div>

                    <div className="space-y-4">
                        <PaymentMethod
                            id="qris"
                            title="QRIS (Gopay, OVO, Dana, LinkAja)"
                            description="Bayar cepat dengan scan kode QR"
                            icon={<ImageIcon className="w-5 h-5" />}
                            active={method === 'qris'}
                            onClick={() => setMethod('qris')}
                        />
                        <PaymentMethod
                            id="ewallet"
                            title="E-Wallet (OVO / ShopeePay)"
                            description="Konfirmasi bayar di aplikasi HP Anda"
                            icon={<Smartphone className="w-5 h-5" />}
                            active={method === 'ewallet'}
                            onClick={() => setMethod('ewallet')}
                        />
                        <PaymentMethod
                            id="va"
                            title="Virtual Account"
                            description="Transfer bank otomatis terkonfirmasi"
                            icon={<Wallet className="w-5 h-5" />}
                            active={method === 'va'}
                            onClick={() => setMethod('va')}
                        />
                        <PaymentMethod
                            id="card"
                            title="Kartu Kredit / Debit"
                            description="Mendukung Visa, Mastercard, JCB"
                            icon={<CreditCard className="w-5 h-5" />}
                            active={method === 'card'}
                            onClick={() => setMethod('card')}
                        />
                    </div>

                    <div className="bg-white rounded-[24px] p-8 border border-black/5 shadow-sm space-y-6">
                        <h3 className="font-bold">Detail Pembayaran</h3>
                        {method === 'card' ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-bold text-dagang-gray/60 uppercase tracking-wider">Nomor Kartu</label>
                                    <input type="text" placeholder="xxxx xxxx xxxx xxxx" className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-dagang-green/20 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-dagang-gray/60 uppercase tracking-wider">Masa Berlaku</label>
                                        <input type="text" placeholder="MM / YY" className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-dagang-green/20 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-dagang-gray/60 uppercase tracking-wider">CVV</label>
                                        <input type="text" placeholder="3 Digit" className="w-full px-4 py-3.5 bg-dagang-cream/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-dagang-green/20 outline-none" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-dagang-green/20 rounded-[20px] bg-dagang-green-pale/50">
                                <div className="text-[32px] mb-3">⚡</div>
                                <p className="text-[14px] text-dagang-gray max-w-[300px] mx-auto">
                                    Setelah menekan tombol bayar, Anda akan dialihkan ke gerbang pembayaran aman kami.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5 lg:sticky lg:top-[120px]">
                    <div className="bg-dagang-dark text-white rounded-[32px] p-9 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full" />

                        <h3 className="text-[18px] font-serif mb-8 text-white/60">Ringkasan Pesanan</h3>

                        <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 mb-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[11px] font-bold text-dagang-accent tracking-[0.1em] mb-1">PAKET TERPILIH</div>
                                    <div className="text-[20px] font-serif">Paket Family (Bulanan)</div>
                                </div>
                                <div className="text-xl font-serif">Rp 49.000</div>
                            </div>
                            <ul className="space-y-2.5">
                                {['Akses 6 Anggota Keluarga', 'Target Tabungan Unlimited', 'Laporan Visual Lengkap'].map((f, i) => (
                                    <li key={i} className="text-[13px] text-white/50 flex items-center gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-dagang-green" /> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-[14px]">
                                <span className="text-white/40">Subtotal</span>
                                <span>Rp 49.000</span>
                            </div>
                            <div className="flex justify-between text-[14px]">
                                <span className="text-white/40">Biaya Layanan</span>
                                <span>Rp 2.500</span>
                            </div>
                            <div className="flex items-center gap-3 py-3 px-4 bg-white/5 border border-dashed border-white/20 rounded-xl">
                                <Tag className="w-4 h-4 text-dagang-accent" />
                                <input type="text" placeholder="Kode Promo" className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-white/20" />
                                <button className="text-[12px] font-bold text-white/40 hover:text-white uppercase">Pakai</button>
                            </div>
                            <div className="h-px bg-white/10 my-4" />
                            <div className="flex justify-between items-center">
                                <span className="text-[18px] font-serif">Total Bayar</span>
                                <span className="text-[28px] font-serif text-dagang-accent">Rp 51.500</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSuccess(true)}
                            className="w-full py-4.5 bg-dagang-green text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/20 hover:bg-dagang-green-light hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
                        >
                            Bayar Sekarang <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> Transaksi Aman & Terenkripsi
                        </div>
                    </div>
                </div>
            </main>

            {/* Success Overlay */}
            {success && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-[#faf8f3]/95 backdrop-blur-md" />
                    <div className="bg-white rounded-[32px] max-w-[480px] w-full p-8 md:p-12 text-center relative z-10 shadow-[0_32px_120px_rgba(0,0,0,0.1)] border border-black/5 animate-fade-in">
                        <div className="w-[100px] h-[100px] bg-dagang-green/10 text-dagang-green rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-[64px] h-[64px]" />
                        </div>

                        <h2 className="font-serif text-[42px] mb-3 leading-tight tracking-tight">Pembayaran <br /><em className="italic font-serif not-italic text-dagang-green">Berhasil!</em></h2>
                        <p className="text-dagang-gray text-[16px] leading-relaxed mb-10">
                            Selamat! Akun keluarga Anda kini telah aktif kembali. Silakan kembali ke dashboard untuk melanjutkan pencatatan.
                        </p>

                        <a
                            href={user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")}
                            className="block w-full py-4.5 bg-dagang-dark text-white rounded-2xl text-[16px] font-bold shadow-xl shadow-black/10 hover:bg-[#212822] transition-all"
                        >
                            Ke Dashboard Utama
                        </a>
                    </div>
                </div>
            )}
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

const PaymentMethod = ({ title, description, icon, active, onClick }: any) => (
    <div
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
        <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${active ? 'border-dagang-green bg-dagang-green' : 'border-black/10'}`}>
            {active && <div className="w-2 h-2 rounded-full bg-white transition-all transform scale-100" />}
        </div>
    </div>
);
