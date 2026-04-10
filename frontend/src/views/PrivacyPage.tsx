import React from 'react';
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';
import { motion } from 'framer-motion';

export const PrivacyPage: React.FC = () => {
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
                        <header className="space-y-4 border-b border-[var(--border)] pb-8">
                            <h1 className="text-4xl font-serif text-dagang-dark italic">Kebijakan Privasi</h1>
                            <p className="text-sm text-dagang-gray font-serif italic">Terakhir diperbarui: 20 Maret 2026</p>
                        </header>

                        <div className="prose prose-slate max-w-none text-dagang-gray leading-relaxed space-y-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">1. Pendahuluan</h2>
                                <p>
                                    UangKu ("kami", "aplikasi") berkomitmen untuk melindungi dan menghormati privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan layanan kami.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">2. Informasi yang Kami Kumpulkan</h2>
                                <p>Kami mengumpulkan informasi yang Anda berikan langsung kepada kami, termasuk:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Data Akun: Nama lengkap, alamat email, dan kata sandi yang dienkripsi.</li>
                                    <li>Data Keuangan: Catatan transaksi, saldo dompet, dan rencana anggaran yang Anda input secara manual.</li>
                                    <li>Data Keluarga: Informasi anggota keluarga yang Anda undang ke dalam lingkaran keuangan Anda.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">3. Penggunaan Informasi</h2>
                                <p>Informasi Anda digunakan untuk:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Menyediakan layanan analisis keuangan dan laporan bagi keluarga Anda.</li>
                                    <li>Mengirimkan notifikasi penting terkait akun atau transaksi.</li>
                                    <li>Meningkatkan fungsionalitas aplikasi melalui AI UangKu Coach.</li>
                                </ul>
                                <p className="font-bold text-dagang-green">Kami tidak pernah menjual data pribadi Anda kepada pihak ketiga manapun.</p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">4. Keamanan Data</h2>
                                <p>
                                    Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang ketat, termasuk enkripsi SSL/TLS untuk semua transmisi data, guna memastikan informasi finansial keluarga Anda tetap aman dari akses yang tidak sah.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-serif text-dagang-dark">5. Hak Anda</h2>
                                <p>
                                    Anda memiliki hak penuh untuk mengakses, memperbaiki, atau menghapus data Anda kapan saja melalui pengaturan akun dalam aplikasi.
                                </p>
                            </section>

                            <section className="space-y-4 pt-8 border-t border-[var(--border)]">
                                <p className="text-sm">
                                    Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui tim dukungan WhatsApp UangKu.
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
