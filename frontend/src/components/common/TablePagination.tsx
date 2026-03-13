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
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between bg-white px-8 py-5 rounded-[24px] border border-black/5 shadow-sm gap-4">
            <div className="text-xs font-bold text-dagang-gray uppercase tracking-widest text-center md:text-left">
                Menampilkan <span className="text-dagang-dark">{startItem} - {endItem}</span> Dari <span className="text-dagang-dark">{totalItems}</span> Data
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-dagang-dark/5 text-dagang-dark rounded-xl hover:bg-dagang-accent disabled:opacity-30 disabled:hover:bg-dagang-dark/5 transition-all shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] md:max-w-none py-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        
                        // Limit visible pages if there are too many
                        if (totalPages > 7) {
                            if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                    return <span key={pageNum} className="px-1 text-dagang-gray/30 font-bold">...</span>;
                                }
                                return null;
                            }
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all flex-shrink-0 ${
                                    currentPage === pageNum 
                                    ? 'bg-dagang-dark text-white shadow-lg' 
                                    : 'bg-dagang-dark/5 text-dagang-dark hover:bg-dagang-accent/20'
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
                    className="p-2 bg-dagang-dark/5 text-dagang-dark rounded-xl hover:bg-dagang-accent disabled:opacity-30 disabled:hover:bg-dagang-dark/5 transition-all shadow-sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
