import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    label: string;
    value: string | number;
}

interface PremiumPeriodSelectorProps {
    label: string;
    value: string | number;
    options: Option[];
    onChange: (value: any) => void;
    variant?: 'light' | 'dark';
}

export const PremiumPeriodSelector = ({ label, value, options, onChange, variant = 'light' }: PremiumPeriodSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Find selected option, handling string/number comparison safely
    const selectedOption = options.find((o) => String(o.value) === String(value)) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) setSearch('');
        else if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
    }, [isOpen]);

    const filteredOptions = options.filter((o) => 
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const isDark = variant === 'dark';

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl backdrop-blur-md transition-all cursor-pointer font-black text-[12px] uppercase tracking-wider min-w-[140px] justify-between shadow-inner
                    ${isDark 
                        ? 'bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--text-main)] hover:bg-black/10' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xl shadow-black/10'}
                `}
            >
                <div className="flex flex-col items-start gap-0.5">
                    <span className={`text-[9px] opacity-40 leading-none ${isDark ? 'text-[var(--text-muted)]' : 'text-white'}`}>{label}</span>
                    <span>{selectedOption?.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                        style={{ originY: 0 }}
                        className="absolute top-full left-0 mt-4 w-[260px] bg-[var(--surface-card)]/90 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-black/30 border border-[var(--border)] z-[100] overflow-hidden flex flex-col"
                    >
                        <div className="p-4 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dagang-green">PILIH {label}</span>
                                <Search className="w-3 h-3 text-[var(--text-muted)] opacity-50" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={`Cari ${label}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 py-2 text-[12px] font-bold outline-none focus:ring-1 focus:ring-dagang-green transition-all"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <button
                                        key={String(opt.value)}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-all flex items-center justify-between group ${
                                            String(value) === String(opt.value) 
                                            ? 'bg-dagang-green text-white shadow-lg shadow-dagang-green/20 scale-[1.02]' 
                                            : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {String(value) === String(opt.value) && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <Check className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-[11px] font-bold text-[var(--text-muted)] opacity-60 italic">Tidak ditemukan</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
