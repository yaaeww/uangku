import React from 'react';
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';
import { motion } from 'framer-motion';

export const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-dagang-cream flex flex-col">
            <PublicHeader />
            
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--surface-card)] p-10 md:p-16 rounded-[40px] shadow-2xl shadow-black/5 space-y-12 border border-[var(--border)]"
                    >
                        <header className="space-y-4 border-b border-[var(--border)] pb-8 text-right">
                            <h1 className="text-4xl font-serif text-dagang-dark italic">Syarat & Ketentuan</h1>
                            <p className="text-sm text-dagang-gray font-serif italic">Efektif sejak: 20 Maret 2026</p>
                        </header>

                        <div className="prose prose-slate max-w-none text-dagang-gray leading-relaxed space-y-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">1. Penerimaan Ketentuan</h2>
                                <p>
                                    Dengan mengakses dan menggunakan aplikasi UangKu, Anda dianggap telah membaca, memahami, dan menyetujui untuk terikat oleh Ketentuan Penggunaan ini. Jika Anda tidak menyetujui bagian mana pun, silakan berhenti menggunakan layanan kami.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">2. Kelayakan dan Pendaftaran</h2>
                                <p>
                                    Anda harus berusia minimal 17 tahun atau memiliki izin orang tua untuk menggunakan layanan ini. Anda bertanggung jawab penuh untuk menjaga kerahasiaan informasi akun dan kata sandi Anda.
                                </p>
                            </section>

                            <section className="space-y-4 text-dagang-green bg-[var(--primary)]/5 p-6 rounded-2xl border border-[var(--primary)]/10">
                                <h2 className="text-2xl font-serif">3. Masa Uji Coba (Trial)</h2>
                                <p>
                                    UangKu menyediakan masa uji coba gratis untuk pengguna baru. Durasi masa uji coba ditentukan oleh admin dan dapat berubah sewaktu-waktu. Setelah masa uji coba berakhir, akses ke fitur pencatatan dan laporan akan dibatasi kecuali jika Anda melakukan aktivasi paket berlangganan.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">4. Berlangganan dan Pembayaran</h2>
                                <p>
                                    Layanan berbayar kami ditagihkan secara periodik (bulanan/tahunan). Pembayaran dilakukan melalui mitra payment gateway resmi kami. Semua biaya yang telah dibayarkan bersifat non-refundable (tidak dapat dikembalikan).
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">5. Batasan Tanggung Jawab</h2>
                                <p>
                                    UangKu adalah alat bantu manajemen keuangan. Kami tidak menyediakan nasihat keuangan profesional, investasi, atau hukum. Pengambilan keputusan ekonomi sepenuhnya merupakan tanggung jawab pengguna.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">6. Perubahan Ketentuan</h2>
                                <p>
                                    Kami berhak mengubah ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui aplikasi atau email. Penggunaan berkelanjutan setelah perubahan tersebut dianggap sebagai persetujuan Anda.
                                </p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};
