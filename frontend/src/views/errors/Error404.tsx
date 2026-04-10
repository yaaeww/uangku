import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Ghost } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Error404: React.FC = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-5%] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[var(--primary)]/10 blur-[80px] sm:blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[150px] sm:w-[300px] h-[150px] sm:h-[300px] bg-[var(--accent)]/10 blur-[60px] sm:blur-[80px] rounded-full" />

            <div className="max-w-md w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="mb-6 sm:mb-8"
                >
                    <div className="relative inline-block">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Ghost className="w-20 h-20 sm:w-32 sm:h-32 text-[var(--primary)] mx-auto" />
                        </motion.div>
                        <motion.div 
                            className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-12 sm:h-12 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center text-lg sm:text-2xl"
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            ❓
                        </motion.div>
                    </div>
                </motion.div>

                <motion.h1 
                    className="text-[80px] sm:text-[120px] font-black leading-none text-[var(--text-main)] opacity-10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.05 }}
                    transition={{ delay: 0.2, duration: 1 }}
                >
                    404
                </motion.h1>
                
                <div className="relative">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-6xl sm:text-8xl font-black text-[var(--text-main)] mb-2 tracking-tighter">404</h1>
                        <h2 
                            className="text-xl sm:text-2xl font-serif text-[var(--text-main)] mb-4 sm:mb-6"
                        >
                            Halaman Tidak Ditemukan
                        </h2>
                    </motion.div>
                </div>

                <motion.p 
                    className="text-sm sm:text-base text-[var(--text-muted)] mb-8 sm:mb-10 leading-relaxed px-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Sepertinya Anda tersesat di labirin keuangan ini. Jangan khawatir, mari kita kembali ke jalur yang benar.
                </motion.p>

                <motion.div 
                    className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center px-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <button 
                        onClick={handleGoBack}
                        className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-3 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl font-bold text-sm hover:bg-[var(--surface)] transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--primary)]" /> Kembali
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-3 bg-[var(--primary)] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[var(--primary)]/20 hover:opacity-90 transition-all active:scale-95"
                    >
                        <Home className="w-5 h-5" /> Ke Beranda
                    </button>
                </motion.div>

                {/* Decorative Elements */}
                <div className="mt-12 sm:mt-16 pt-8 sm:pt-16 border-t border-[var(--border)] opacity-40">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-faint)]">UangKu Financial Assistant</p>
                </div>
            </div>
        </div>
    );
};
