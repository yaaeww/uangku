import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Info, Trash2 } from 'lucide-react';
import { NotificationController } from '../../controllers/NotificationController';

export const NotificationsView: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchNotifications = async () => {
        try {
            const data = await NotificationController.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationController.markAsRead(id);
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await NotificationController.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus notifikasi ini?')) return;
        try {
            await NotificationController.deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setSelectedIds((prev) => prev.filter((sId) => sId !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Hapus SEMUA notifikasi? Tindakan ini tidak bisa dibatalkan.')) return;
        try {
            await NotificationController.deleteAllNotifications();
            setNotifications([]);
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Hapus ${selectedIds.length} notifikasi terpilih?`)) return;
        try {
            await NotificationController.deleteBulkNotifications(selectedIds);
            setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to delete selected notifications:', error);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) 
            ? prev.filter(i => i !== id) 
            : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n.id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'reminder':
                return <Clock className="w-5 h-5 text-amber-500" />;
            case 'alert':
                return <Bell className="w-5 h-5 text-red-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-emerald-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'reminder':
                return 'bg-amber-500/10';
            case 'alert':
                return 'bg-red-500/10';
            case 'info':
                return 'bg-blue-500/10';
            default:
                return 'bg-emerald-500/10';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-[28px] md:text-[32px] font-serif leading-tight text-[var(--text-main)]">Notifikasi</h2>
                    <p className="text-[var(--text-muted)] opacity-80 text-sm mt-1">Pantau aktivitas dan pengingat harianmu.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {notifications.some(n => !n.is_read) && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 text-[10px] font-black uppercase tracking-wider text-[var(--text-main)] bg-[var(--surface-card)] border border-[var(--border)] rounded-xl hover:bg-black/5 flex items-center justify-center gap-2 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Baca Semua
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button 
                            onClick={handleDeleteAll}
                            className="flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Hapus Semua
                        </button>
                    )}
                </div>
            </div>

            {/* Selection Toolbar (Floating if items selected) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 bg-white dark:bg-[#0A0A0A] border border-[var(--border)] rounded-2xl shadow-2xl p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center gap-4 md:gap-8 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:border-r md:border-[var(--border)] md:pr-8">
                        <span className="text-sm font-bold text-[var(--text-main)]">{selectedIds.length} <span className="md:hidden">Item </span>Terpilih</span>
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        >
                            Batal
                        </button>
                    </div>
                    <button 
                        onClick={handleDeleteSelected}
                        className="w-full md:w-auto py-2.5 md:p-2 bg-red-500 md:bg-transparent text-white md:text-red-500 hover:bg-red-600 md:hover:bg-red-500/10 rounded-xl md:rounded-lg transition-colors flex items-center justify-center gap-2 text-[11px] font-black uppercase shadow-lg shadow-red-500/20 md:shadow-none"
                    >
                        <Trash2 className="w-4 h-4" /> Hapus terpilih
                    </button>
                </div>
            )}

            <div className="bg-[var(--surface-card)] rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden">
                {/* Header row with Select All */}
                {notifications.length > 0 && (
                    <div className="px-6 py-4 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center gap-4">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-md border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/30 cursor-pointer"
                            checked={selectedIds.length === notifications.length && notifications.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Pilih Semua</span>
                    </div>
                )}

                <div className="divide-y divide-[var(--border)]">
                    {loading ? (
                        <div className="p-20 text-center text-[var(--text-muted)] opacity-80 animate-pulse">Memuat notifikasi...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center text-[var(--text-muted)] opacity-80 italic">Belum ada notifikasi baru.</div>
                    ) : (
                        notifications.map((n: any) => (
                            <div 
                                key={n.id} 
                                className={`p-6 flex items-start gap-4 transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${!n.is_read ? 'bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]' : 'border-l-4 border-l-transparent'}`}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                            >
                                <div className="pt-3 pr-2" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded-md border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/30 cursor-pointer"
                                        checked={selectedIds.includes(n.id)}
                                        onChange={() => toggleSelect(n.id)}
                                    />
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--border)] ${getBgColor(n.type)}`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1 overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-3">
                                        <h4 className={`text-[15px] ${!n.is_read ? 'font-black' : 'font-bold'} text-[var(--text-main)] truncate`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest whitespace-nowrap">
                                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-main)] opacity-70 leading-relaxed max-w-2xl font-medium">
                                        {n.message}
                                    </p>
                                    {!n.is_read && (
                                        <div className="pt-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(n.id);
                                                }}
                                                className="text-[11px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                                            >
                                                <CheckCircle2 className="w-3 h-3" /> Tandai Terbaca
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
