import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Info, Trash2 } from 'lucide-react';
import { NotificationController } from '../../controllers/NotificationController';

export const NotificationsView: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            setNotifications((notifications: any[]) => notifications.map((n: any) => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'reminder':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'alert':
                return <Trash2 className="w-5 h-5 text-red-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-dagang-green" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'reminder':
                return 'bg-orange-50';
            case 'alert':
                return 'bg-red-50';
            case 'info':
                return 'bg-blue-50';
            default:
                return 'bg-green-50';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-[32px] font-serif leading-tight text-dagang-dark">Notifikasi</h2>
                    <p className="text-dagang-gray text-sm mt-1">Pantau aktivitas dan pengingat harianmu.</p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
                <div className="divide-y divide-black/5">
                    {loading ? (
                        <div className="p-20 text-center text-dagang-gray animate-pulse">Memuat notifikasi...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center text-dagang-gray italic">Belum ada notifikasi baru.</div>
                    ) : (
                        notifications.map((n: any) => (
                            <div 
                                key={n.id} 
                                className={`p-6 flex items-start gap-5 transition-all hover:bg-dagang-cream/10 ${!n.is_read ? 'bg-dagang-green/5' : ''}`}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-[15px] ${!n.is_read ? 'font-black' : 'font-bold'} text-dagang-dark`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-[10px] font-bold text-dagang-gray opacity-40 uppercase tracking-widest">
                                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-dagang-gray leading-relaxed max-w-2xl">
                                        {n.message}
                                    </p>
                                    {!n.is_read && (
                                        <div className="pt-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(n.id);
                                                }}
                                                className="text-[11px] font-black text-dagang-green uppercase tracking-widest flex items-center gap-1.5 hover:underline"
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
