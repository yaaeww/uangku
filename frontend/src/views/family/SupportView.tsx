import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Send, 
    Clock, 
    CheckCircle2, 
    User, 
    Shield, 
    ArrowRight,
    Plus,
    X,
    ChevronRight,
    MessageCircle
} from 'lucide-react';

import api from '../../services/api';
import { useModal } from '../../providers/ModalProvider';

interface Ticket {
    id: string;
    subject: string;
    message: string;
    status: 'OPEN' | 'RESOLVED';
    admin_reply: string | null;
    replied_at: string | null;
    created_at: string;
}

export const SupportView: React.FC = () => {
    const { showAlert } = useModal();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewingTicket, setIsViewingTicket] = useState<Ticket | null>(null);

    const [newTicket, setNewTicket] = useState({
        subject: '',
        message: ''
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await api.get('/finance/support/tickets');
            setTickets(response.data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/finance/support/tickets', newTicket);
            showAlert('Berhasil', 'Laporan Anda telah berhasil terkirim. Admin akan segera membalasnya.', 'alert');
            setNewTicket({ subject: '', message: '' });
            setIsModalOpen(false);
            fetchTickets();
        } catch (error) {
            showAlert('Gagal', 'Maaf, terjadi kesalahan saat mengirim laporan.', 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Menunggu Balasan
                    </span>
                );
            case 'RESOLVED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Sudah Dibalas
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">Memuat Pusat Bantuan...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-h2 font-heading text-[var(--text-main)]">Pusat Bantuan</h1>
                    <p className="text-body-s text-[var(--text-muted)] mt-1">Gunakan fitur ini untuk bertanya atau melaporkan masalah ke Admin.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[var(--primary)] text-white px-8 py-3.5 rounded-[24px] font-bold text-sm flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10 group active:scale-95"
                >
                    <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                    Buat Laporan Baru
                </button>
            </div>

            {/* Support Hero Section */}
            <div className="bg-[#064E3B] p-12 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 blur-3xl rounded-full -mr-32 -mt-32" />
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-[36px] bg-white/5 text-[var(--accent)] flex items-center justify-center border border-white/10 shadow-inner">
                            <Shield className="w-12 h-12" />
                        </div>
                        <div className="max-w-md text-left">
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3 leading-none">Customer Satisfaction</div>
                            <h2 className="text-3xl font-serif text-white mb-2 italic">Kami Siap Membantu.</h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Keamanan dan kenyamanan Anda adalah prioritas kami. Ceritakan kendala Anda, tim kami akan merespon dalam waktu maksimal 24 jam.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                        <div 
                            key={ticket.id} 
                            onClick={() => setIsViewingTicket(ticket)}
                            className="bg-[var(--surface-card)] p-6 md:px-10 md:py-8 rounded-[32px] border border-[var(--border)] shadow-sm hover:shadow-xl hover:border-[var(--primary)]/30 transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative"
                        >
                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                                    {ticket.status === 'RESOLVED' ? <CheckCircle2 className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{ticket.subject}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="text-[11px] font-black text-[var(--text-muted)] opacity-60 flex items-center gap-2 uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" /> {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative z-10 self-end md:self-auto">
                                {getStatusBadge(ticket.status)}
                                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all transform group-hover:translate-x-1">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                            
                            {/* Decorative background circle */}
                            <div className="absolute -right-12 -top-12 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-2xl transition-all group-hover:scale-150" />
                        </div>
                    ))
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center bg-black/5 dark:bg-white/5 rounded-[48px] border-2 border-dashed border-[var(--border)]">
                        <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-[var(--text-muted)] opacity-30 mb-6">
                            <MessageCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-heading text-[var(--text-main)] mb-1">Anda belum memiliki laporan</h3>
                        <p className="text-sm text-[var(--text-muted)] max-w-xs opacity-60">
                            Jika memiliki kendala atau pertanyaan, jangan ragu untuk menghubungi tim admin kami.
                        </p>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-[var(--surface-card)] w-full max-w-lg rounded-[48px] p-12 relative z-10 shadow-2xl animate-in zoom-in-95 duration-500 border border-[var(--border)]">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-10 right-10 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            <X className="w-7 h-7" />
                        </button>

                        <div className="flex flex-col gap-2 mb-10">
                            <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-2">
                                <Plus className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-serif text-[var(--text-main)] italic">Sampaikan Kendala Anda</h2>
                            <p className="text-[var(--text-muted)] text-sm opacity-70">Ceritakan sedetail mungkin agar kami dapat membantu lebih cepat.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-80 px-4">Subjek Masalah</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Contoh: Bug di dashboard atau Kendala pembayaran"
                                    className="w-full h-16 px-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-[15px] text-[var(--text-main)] placeholder:opacity-40"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-80 px-4">Pesan Detail</label>
                                <textarea 
                                    required
                                    rows={5}
                                    placeholder="Tuliskan pesan Anda di sini secara lengkap..."
                                    className="w-full p-8 rounded-[32px] bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-[15px] text-[var(--text-main)] resize-none placeholder:opacity-40 h-40"
                                    value={newTicket.message}
                                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-20 bg-[var(--primary)] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:opacity-90 transition-all disabled:opacity-70 mt-4 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Mengirim Laporan...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> 
                                        Kirim Sekarang
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View Ticket Detail Modal */}
            {isViewingTicket && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewingTicket(null)} />
                    <div className="bg-[var(--surface-card)] w-full max-w-2xl rounded-[48px] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-[var(--border)]">
                        <button 
                            onClick={() => setIsViewingTicket(null)}
                            className="absolute top-8 right-8 p-3 text-[var(--text-muted)] hover:text-white hover:bg-red-500 rounded-2xl transition-all z-20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-10 md:p-14 space-y-12">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                     {getStatusBadge(isViewingTicket.status)}
                                     <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(isViewingTicket.created_at).toLocaleString('id-ID')}</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-main)] leading-tight italic">{isViewingTicket.subject}</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--border)]">
                                        <User className="w-6 h-6 text-[var(--text-muted)]" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Pesan Anda</div>
                                        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl rounded-tl-none border border-[var(--border)] text-sm leading-relaxed text-[var(--text-main)] font-medium">
                                            {isViewingTicket.message}
                                        </div>
                                    </div>
                                </div>

                                {isViewingTicket.admin_reply && (
                                    <div className="flex gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center shrink-0 border border-[var(--primary)]/20 shadow-inner">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-2">
                                               Balasan Admin <ArrowRight className="w-3 h-3" /> {new Date(isViewingTicket.replied_at!).toLocaleString('id-ID')}
                                            </div>
                                            <div className="p-8 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[32px] rounded-tl-none text-sm leading-relaxed text-[var(--text-main)] font-bold shadow-sm relative">
                                                {isViewingTicket.admin_reply}
                                                <div className="absolute -left-2 top-0 w-4 h-4 bg-[var(--surface-card)] rotate-45 border-l border-t border-[var(--primary)]/20" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
