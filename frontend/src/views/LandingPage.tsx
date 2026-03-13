import { useTranslation } from 'react-i18next';
import {
    Globe,
    LayoutDashboard,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const LandingPage = () => {
    const { t, i18n } = useTranslation();
    const token = useAuthStore(state => state.token);
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'id' ? 'en' : 'id';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="bg-dagang-cream text-dagang-dark font-sans selection:bg-dagang-green-pale selection:text-dagang-green">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-5 md:px-[60px] bg-[#faf8f3]/92 backdrop-blur-md border-b border-dagang-green/10">
                <div className="logo font-serif text-2xl text-dagang-green">
                    Dagang<span className="text-dagang-accent">Finance</span>
                </div>

                <ul className="hidden lg:flex gap-9 list-none">
                    <li><a href="#features" className="text-sm font-medium text-dagang-gray hover:text-dagang-green transition-colors">{t('nav.features')}</a></li>
                    <li><a href="#how-it-works" className="text-sm font-medium text-dagang-gray hover:text-dagang-green transition-colors">{t('nav.howItWorks')}</a></li>
                    <li><a href="#pricing" className="text-sm font-medium text-dagang-gray hover:text-dagang-green transition-colors">{t('nav.pricing')}</a></li>
                    <li><a href="#" className="text-sm font-medium text-dagang-gray hover:text-dagang-green transition-colors">{t('nav.blog')}</a></li>
                </ul>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="p-2 rounded-full hover:bg-dagang-green-pale text-dagang-gray hover:text-dagang-green transition-all flex items-center gap-1"
                        title="Toggle Language"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">{i18n.language}</span>
                    </button>
                    {token ? (
                        <div className="flex items-center gap-3">
                            <a
                                href={user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")}
                                className="px-6 py-2.5 bg-dagang-green text-white rounded-full text-sm font-semibold hover:bg-dagang-green-light transition-all flex items-center gap-2 shadow-sm"
                            >
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </a>
                            <button 
                                onClick={() => logout()}
                                className="p-2 hover:bg-red-50 rounded-full text-dagang-gray hover:text-red-500 transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <a href="/login" className="text-[13px] sm:text-sm font-semibold text-dagang-green border border-dagang-green/30 hover:bg-dagang-green-pale px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all whitespace-nowrap">
                                Login
                            </a>
                            <a href="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-dagang-green text-white rounded-full text-[13px] sm:text-sm font-semibold hover:bg-dagang-green-light transition-all shadow-sm whitespace-nowrap">
                                {t('nav.trial')}
                            </a>
                        </>
                    )}
                </div>
            </nav>

            {/* HERO */}
            <section className="min-h-screen flex items-center px-6 md:px-[60px] pt-[120px] pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-[-100px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(26,107,74,0.08)_0%,transparent_70%)] rounded-full -z-10" />

                {/* Decorative Grid */}
                <div className="absolute top-[120px] right-20 grid grid-cols-8 gap-5 opacity-15">
                    {Array.from({ length: 32 }).map((_, i) => (
                        <span key={i} className="w-1 h-1 bg-dagang-green rounded-full block" />
                    ))}
                </div>

                <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="max-w-[620px] z-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-dagang-green-pale text-dagang-green px-4 py-1.5 rounded-full text-sm font-semibold mb-7 border border-dagang-green/15 before:content-['✦'] before:text-[10px]">
                            {t('hero.badge')}
                        </div>
                        <h1 className="font-serif text-[52px] md:text-[68px] leading-[1.05] text-dagang-dark mb-6" dangerouslySetInnerHTML={{ __html: t('hero.title') }} />
                        <p className="text-[17px] text-dagang-gray leading-relaxed mb-11 max-w-[480px] mx-auto lg:mx-0">
                            {t('hero.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-14">
                            <a
                                href={token ? (user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")) : "/register"}
                                className="btn-primary w-full sm:w-auto"
                            >
                                {token ? 'Ke Dashboard' : t('hero.cta_trial')}
                                {!token && <span className="opacity-70 text-xs font-normal">— {t('hero.cta_trial_sub')}</span>}
                            </a>
                            <button className="btn-secondary w-full sm:w-auto">
                                {t('hero.cta_demo')}
                            </button>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-2.5">
                                {['B', 'S', 'R', 'A'].map((char, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-dagang-green to-dagang-green-light flex items-center justify-center text-[12px] font-bold text-white">
                                        {char}
                                    </div>
                                ))}
                            </div>
                            <div className="text-[13px] text-dagang-gray" dangerouslySetInnerHTML={{ __html: t('hero.trust') }} />
                        </div>
                    </div>

                    <div className="lg:w-[480px] relative z-10 w-full animate-float">
                        <div className="bg-white rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] p-7 overflow-hidden">
                            <div className="flex justify-between items-center mb-5">
                                <div className="text-[13px] font-semibold text-dagang-dark">🏠 Keluarga Budi</div>
                                <div className="bg-dagang-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full">Trial: 5 hari</div>
                            </div>

                            <div className="bg-gradient-to-br from-dagang-green to-dagang-green-light rounded-[16px] p-5 mb-4 text-white">
                                <div className="text-[12px] opacity-80 mb-1.5">Saldo Bersih Bulan Ini</div>
                                <div className="font-serif text-[32px]">Rp 8.450.000</div>
                                <div className="text-[12px] opacity-70 mt-1">↑ 12% dari bulan lalu</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 mb-4">
                                <div className="bg-dagang-cream rounded-[12px] p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">💚</div>
                                    <div>
                                        <div className="text-[13px] font-semibold">Rp 12,5 jt</div>
                                        <div className="text-[11px] text-dagang-gray">Pemasukan</div>
                                    </div>
                                </div>
                                <div className="bg-dagang-cream rounded-[12px] p-3 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">❤️</div>
                                    <div>
                                        <div className="text-[13px] font-semibold">Rp 4,05 jt</div>
                                        <div className="text-[11px] text-dagang-gray">Pengeluaran</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between py-2 border-b border-black/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-[28px] h-[28px] rounded-lg bg-dagang-green-pale flex items-center justify-center text-[12px]">🛒</div>
                                        <div>
                                            <div className="text-[12px] font-medium">Belanja Bulanan</div>
                                            <div className="text-[11px] text-dagang-gray">Hari ini</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-semibold text-red-500">- Rp 450k</div>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-black/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-[28px] h-[28px] rounded-lg bg-dagang-green-pale flex items-center justify-center text-[12px]">💰</div>
                                        <div>
                                            <div className="text-[12px] font-medium">Gaji Suami</div>
                                            <div className="text-[11px] text-dagang-gray">1 Mar</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-semibold text-dagang-green">+ Rp 8jt</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card */}
                        <div className="absolute bottom-[-20px] left-[-60px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-3 px-4 flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-amber-100 rounded-[10px] flex items-center justify-center text-base">📊</div>
                            <div className="text-[12px]">
                                <strong className="block font-semibold">Budget Makan</strong>
                                <span className="text-dagang-gray">78% terpakai</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="px-6 md:px-[60px] py-20">
                <div className="max-w-[1280px] mx-auto">
                    <div className="mb-16">
                        <div className="text-xs font-bold text-dagang-green tracking-[0.08em] uppercase mb-3">Fitur Unggulan</div>
                        <h2 className="font-serif text-5xl leading-[1.1] mb-4">Semua yang Keluarga Butuhkan</h2>
                        <p className="text-dagang-gray text-lg max-w-[520px] leading-relaxed">
                            Dari pencatatan harian hingga laporan bulanan — semua tersedia dalam satu platform yang mudah digunakan bersama.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                        {[
                            { icon: '📝', title: 'Catat Transaksi Bersama', desc: 'Semua anggota keluarga bisa mencatat pemasukan dan pengeluaran secara real-time. Tidak ada yang terlewat.' },
                            { icon: '🎯', title: 'Budget Planning', desc: 'Buat anggaran per kategori, pantau pemakaian, dan dapatkan notifikasi saat mendekati batas budget.' },
                            { icon: '🏦', title: 'Tabungan Tujuan', desc: 'Rencanakan tabungan untuk liburan, pendidikan, atau dana darurat. Lacak progres bersama keluarga.' },
                            { icon: '📊', title: 'Laporan Visual', desc: 'Grafik dan laporan keuangan yang mudah dipahami. Pahami pola pengeluaran keluarga setiap bulan.' },
                            { icon: '👨‍👩‍👧‍👦', title: 'Multi Anggota', desc: 'Undang suami, istri, atau anak ke workspace keluarga. Atur peran dan akses setiap anggota.' },
                            { icon: '🔔', title: 'Pengingat Tagihan', desc: 'Jangan sampai lupa bayar tagihan. Atur jadwal pembayaran dan terima notifikasi tepat waktu.' }
                        ].map((f, i) => (
                            <div key={i} className="group bg-white rounded-[20px] p-8 border border-black/5 transition-all hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)] relative overflow-hidden">
                                <div className="w-[52px] h-[52px] rounded-[14px] bg-dagang-green-pale flex items-center justify-center text-[22px] mb-5">{f.icon}</div>
                                <h3 className="text-[18px] font-bold mb-2.5">{f.title}</h3>
                                <p className="text-[14px] text-dagang-gray leading-relaxed">{f.desc}</p>
                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-dagang-green to-dagang-green-light scale-x-0 transition-transform group-hover:scale-x-100 origin-left" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="mx-10 mb-20 px-6 md:px-[60px] py-20 bg-dagang-dark text-white rounded-[32px]">
                <div className="max-w-[1280px] mx-auto text-center">
                    <div className="text-xs font-bold text-dagang-accent tracking-[0.08em] uppercase mb-3">Cara Kerja</div>
                    <h2 className="font-serif text-5xl text-white mb-4">Mulai dalam 3 Menit</h2>
                    <p className="text-white/60 text-lg mb-16 mx-auto max-w-[500px]">Setup cepat, langsung bisa digunakan oleh seluruh anggota keluarga.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                        <div className="hidden lg:block absolute top-7 left-[60px] right-[60px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {[
                            { num: '1', title: 'Daftar Akun', desc: 'Buat akun gratis dengan email dan password. Tidak perlu kartu kredit.' },
                            { num: '2', title: 'Buat Workspace', desc: 'Beri nama workspace keluarga dan undang anggota dengan link atau email.' },
                            { num: '3', title: 'Catat Keuangan', desc: 'Mulai catat pemasukan, pengeluaran, dan buat budget bersama keluarga.' },
                            { num: '4', title: 'Pantau & Evaluasi', desc: 'Lihat laporan, analisis kebiasaan, dan buat keputusan finansial yang lebih baik.' }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-serif text-[22px] text-dagang-accent mb-5 relative z-10">
                                    {s.num}
                                </div>
                                <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                                <p className="text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="px-6 md:px-[60px] py-20">
                <div className="max-w-[1280px] mx-auto">
                    <div className="text-center mb-14">
                        <div className="text-xs font-bold text-dagang-green tracking-[0.08em] uppercase mb-3">Harga Terjangkau</div>
                        <h2 className="font-serif text-5xl mb-4">Pilih Paket Keluarga Anda</h2>
                        <p className="text-dagang-gray text-lg">Mulai gratis 10 hari, lanjutkan dengan paket yang sesuai kebutuhan keluarga.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
                        <div className="bg-white rounded-[24px] p-9 border border-black/5 flex flex-col items-center">
                            <div className="text-xs font-bold opacity-70 mb-4 tracking-wider uppercase">Basic</div>
                            <div className="font-serif text-[40px] mb-1">Rp 29rb</div>
                            <div className="text-[13px] text-dagang-gray mb-7">per bulan</div>
                            <ul className="w-full list-none space-y-3 mb-8">
                                {['Hingga 3 anggota', 'Catat transaksi tak terbatas', 'Budget dasar', 'Laporan bulanan', 'Support email'].map((item, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2 before:content-['✓'] before:font-bold before:text-dagang-green">{item}</li>
                                ))}
                            </ul>
                            <a href="/register" className="w-full py-3.5 rounded-full border-[1.5px] border-black/15 text-sm font-semibold hover:border-dagang-green hover:text-dagang-green transition-all text-center">Pilih Basic</a>
                        </div>

                        <div className="bg-dagang-green rounded-[24px] p-9 text-white relative flex flex-col items-center shadow-xl shadow-dagang-green/20 scale-[1.04]">
                            <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-dagang-accent text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">⭐ Paling Populer</div>
                            <div className="text-xs font-bold text-white/70 mb-4 tracking-wider uppercase">Family</div>
                            <div className="font-serif text-[40px] mb-1 text-white">Rp 49rb</div>
                            <div className="text-[13px] text-white/60 mb-7">per bulan</div>
                            <ul className="w-full list-none space-y-3 mb-8">
                                {['Hingga 6 anggota', 'Semua fitur Basic', 'Tabungan tujuan', 'Pelacak utang & piutang', 'Notifikasi otomatis'].map((item, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2 before:content-['✓'] before:font-bold before:text-dagang-accent">{item}</li>
                                ))}
                            </ul>
                            <a href="/register" className="w-full py-3.5 bg-white text-dagang-green rounded-full text-sm font-bold hover:bg-white/90 transition-all text-center">Pilih Family</a>
                        </div>

                        <div className="bg-white rounded-[24px] p-9 border border-black/5 flex flex-col items-center">
                            <div className="text-xs font-bold opacity-70 mb-4 tracking-wider uppercase">Premium</div>
                            <div className="font-serif text-[40px] mb-1">Rp 79rb</div>
                            <div className="text-[13px] text-dagang-gray mb-7">per bulan</div>
                            <ul className="w-full list-none space-y-3 mb-8">
                                {['Anggota tak terbatas', 'Semua fitur Family', 'Analitik lanjutan', 'Referral & rewards', 'Priority support'].map((item, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2 before:content-['✓'] before:font-bold before:text-dagang-green">{item}</li>
                                ))}
                            </ul>
                            <a href="/register" className="w-full py-3.5 rounded-full border-[1.5px] border-black/15 text-sm font-semibold hover:border-dagang-green hover:text-dagang-green transition-all text-center">Pilih Premium</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-10 mb-20 px-6 md:px-[60px] py-24 bg-gradient-to-br from-dagang-dark to-[#2d4a38] text-white text-center rounded-[32px] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-dagang-green/40 blur-[100px] rounded-full" />
                <div className="relative z-10">
                    <h2 className="font-serif text-[54px] mb-4">Mulai Perjalanan Finansial Keluarga Anda</h2>
                    <p className="text-white/60 text-lg mb-10 max-w-[600px] mx-auto">Gratis 10 hari. Setup 3 menit. Tidak perlu kartu kredit.</p>
                    <a
                        href={token ? (user?.role === 'super_admin' ? "/admin" : (user?.familyName ? `/${encodeURIComponent(user.familyName)}/dashboard` : "/")) : "/register"}
                        className="inline-block bg-dagang-accent text-white px-11 py-4.5 rounded-full text-base font-bold shadow-[0_8px_32px_rgba(245,158,11,0.4)] hover:-translate-y-px hover:shadow-[0_16px_48px_rgba(245,158,11,0.5)] transition-all"
                    >
                        {token ? '🚀 Masuk ke Dashboard' : '🚀 Mulai Trial Gratis Sekarang'}
                    </a>
                    <p className="text-[13px] text-white/40 mt-4">Sudah 2.400+ keluarga bergabung • Batalkan kapan saja</p>
                </div>
            </section>

            <footer className="px-[60px] pb-10 text-center text-[13px] text-dagang-gray">
                © 2026 DagangFinance · Dibuat dengan ❤️ untuk keluarga Indonesia · Privacy · Terms · Contact
            </footer>
        </div>
    );
};
