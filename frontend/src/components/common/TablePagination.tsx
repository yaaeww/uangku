import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between bg-[var(--surface-card)] px-8 py-5 rounded-[24px] border border-[var(--border)] shadow-sm gap-4 transition-colors duration-300">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center md:text-left">
                Menampilkan <span className="text-[var(--text-main)]">{startItem} - {endItem}</span> Dari <span className="text-[var(--text-main)]">{totalItems}</span> Data
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--text-main)]/5 text-[var(--text-main)] rounded-xl hover:bg-[var(--accent)] hover:text-white disabled:opacity-30 disabled:hover:bg-[var(--text-main)]/5 disabled:hover:text-[var(--text-main)] transition-all shadow-sm group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Sebelumnya</span>
                </button>
                
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[150px] md:max-w-none py-1 scrollbar-hide">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        
                        if (totalPages > 5) {
                            if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                    return <span key={pageNum} className="px-1 text-[var(--text-muted)]/30 font-black">...</span>;
                                }
                                return null;
                            }
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-xl font-black text-xs transition-all flex-shrink-0 ${
                                    currentPage === pageNum 
                                    ? 'bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/20 scale-110 z-10' 
                                    : 'bg-[var(--text-main)]/5 text-[var(--text-main)] hover:bg-[var(--accent)]/10 shadow-sm'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--text-main)]/5 text-[var(--text-main)] rounded-xl hover:bg-[var(--accent)] hover:text-white disabled:opacity-30 disabled:hover:bg-[var(--text-main)]/5 disabled:hover:text-[var(--text-main)] transition-all shadow-sm group"
                >
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Berikutnya</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};
