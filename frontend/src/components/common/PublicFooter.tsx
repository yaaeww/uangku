import { Link } from 'react-router-dom';

export const PublicFooter = () => {
    return (
        <footer className="bg-dagang-dark text-white pt-20 pb-10 px-6 md:px-[60px]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="logo font-serif text-3xl text-dagang-green">
                            Uang<span className="text-dagang-accent">ku</span>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs font-serif">
                            Membantu keluarga Indonesia mengelola keuangan dengan lebih bijak, transparan, dan terencana.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">Fitur</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><a href="/#features" className="hover:text-white transition-colors">Catat Transaksi</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">Budgeting</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">Laporan Keuangan</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">Multi Anggota</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">Sumber Daya</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog & Tips</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Panduan Pengguna</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Kalkulator Keuangan</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">Perusahaan</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privasi</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 text-center text-[11px] text-white/20 font-serif tracking-widest uppercase">
                    © 2026 Uangku · Dibuat dengan ❤️ untuk keluarga Indonesia
                </div>
            </div>
        </footer>
    );
};
