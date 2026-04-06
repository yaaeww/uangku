import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Error500: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden text-white">
            {/* Dark Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-red-500/10 blur-[80px] sm:blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[var(--primary)]/10 blur-[60px] sm:blur-[100px] rounded-full" />

            <div className="max-w-lg w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 sm:mb-10"
                >
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-500/20 text-red-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-red-500/30">
                        <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif mb-2 sm:mb-3">Akses Terputus</h1>
                    <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-red-500 to-amber-500 mx-auto rounded-full mb-4 sm:mb-6" />
                </motion.div>

                <motion.p 
                    className="text-slate-400 text-xs sm:text-base mb-6 sm:mb-10 leading-relaxed px-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Server kami sedang mengalami gangguan internal. Kami sedang berusaha memperbaiki timbangan keuangan ini segera mungkin.
                </motion.p>

                <motion.div 
                    className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center px-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-[#0F172A] rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Refresh Halaman
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4 sm:w-5 sm:h-5" /> Ke Beranda
                    </button>
                </motion.div>

                <motion.div 
                    className="mt-10 sm:mt-16 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-[24px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500">
                        <span>Error Code: 500</span>
                        <span className="hidden sm:inline">Internal Server Error</span>
                        <span>UangKu Core</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
