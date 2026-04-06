import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface SupportReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reply: string) => void;
    ticket: any;
}

export const SupportReplyModal: React.FC<SupportReplyModalProps> = ({ isOpen, onClose, onSubmit, ticket }) => {
    const [reply, setReply] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReply(ticket?.admin_reply || '');
        }
    }, [isOpen, ticket]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-[var(--surface-card)] rounded-[32px] shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-[var(--border)] flex items-center justify-between bg-black/5 dark:bg-white/5">
                    <div>
                        <h3 className="text-xl font-heading font-bold text-[var(--text-main)]">Balas Tiket Support</h3>
                        <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest mt-1">Subjek: {ticket?.subject}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-muted)]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-[var(--border)]">
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Pesan User:</div>
                        <div className="text-sm text-[var(--text-main)] leading-relaxed italic opacity-80">"{ticket?.message}"</div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Balasan Admin</label>
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Tulis balasan di sini..."
                            className="w-full h-40 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-6 text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-black/5 dark:bg-white/5 text-[var(--text-main)] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-[var(--border)]"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                onSubmit(reply);
                                onClose();
                            }}
                            className="flex-1 px-8 py-4 bg-dagang-amber text-dagang-emerald-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-dagang-amber/10 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Kirim Balasan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
