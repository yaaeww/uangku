import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';

interface ManualVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    onSubmit: (id: string, status: string, notes: string) => Promise<void>;
}

export const ManualVerificationModal: React.FC<ManualVerificationModalProps> = ({
    isOpen,
    onClose,
    transaction,
    onSubmit
}) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !transaction) return null;

    const handleAction = async (status: string) => {
        try {
            setLoading(true);
            await onSubmit(transaction.id, status, notes);
            onClose();
        } catch (error) {
            // Error handled by parent toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--surface-card)] w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 relative shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-dagang-amber/10 text-dagang-amber rounded-2xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-heading font-black text-[var(--text-main)]">Verifikasi Pembayaran</h2>
                            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">{transaction.reference}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute right-8 top-8 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-[var(--text-muted)]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {/* Transaction Details */}
                    <div className="grid grid-cols-2 gap-4 bg-[var(--surface-subtle)] p-4 rounded-2xl border border-[var(--border)]">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Keluarga</p>
                            <p className="text-sm font-bold text-[var(--text-main)]">{transaction.family?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Paket</p>
                            <p className="text-sm font-bold text-dagang-amber">{transaction.plan_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Metode</p>
                            <p className="text-sm font-bold text-[var(--text-main)]">{transaction.payment_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Amount</p>
                            <p className="text-sm font-black text-dagang-green">Rp {transaction.total_amount.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Proof Image */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-between">
                            Bukti Transfer
                            {transaction.proof_url && (
                                <a 
                                    href={transaction.proof_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-dagang-amber hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" /> Buka Full
                                </a>
                            )}
                        </label>
                        <div className="aspect-video bg-[var(--surface-subtle)] border-2 border-dashed border-[var(--border)] rounded-3xl overflow-hidden flex items-center justify-center relative group">
                            {transaction.proof_url ? (
                                <img 
                                    src={transaction.proof_url} 
                                    alt="Bukti Transfer" 
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2 opacity-20" />
                                    <p className="text-xs text-[var(--text-muted)] font-bold">BUKTI BELUM DIUPLOAD</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Catatan Admin (Opsional)</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Alasan penolakan atau catatan tambahan..."
                            className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-dagang-amber transition-all font-medium text-sm text-[var(--text-main)]"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-[var(--border)] flex gap-4 bg-[var(--surface-card)] shrink-0">
                    <button 
                        onClick={() => handleAction('REJECTED')}
                        disabled={loading || !transaction.proof_url}
                        className="flex-1 px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black transition-all border border-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <XCircle className="w-5 h-5" />
                        Tolak
                    </button>
                    <button 
                        onClick={() => handleAction('APPROVED')}
                        disabled={loading || !transaction.proof_url}
                        className="flex-1 px-6 py-4 bg-dagang-green hover:bg-dagang-green/90 text-white rounded-2xl font-black transition-all shadow-lg shadow-dagang-green/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Setujui
                    </button>
                </div>
            </div>
        </div>
    );
};
