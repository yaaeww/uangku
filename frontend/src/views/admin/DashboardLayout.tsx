import React from 'react';
import { Link } from 'react-router-dom';
import {
    Logo
} from '../../components/common/Logo';
import { 
    Settings as SettingsIcon,
    Edit3,
    Plus,
    Trash2,
    UserCircle as UserIcon,
    LogOut as LogOutIcon,
    LayoutDashboard as DashboardIcon,
    History as HistoryIcon,
    Users2 as Users2Icon,
    Package as PackageIcon,
    Users as UsersIcon,
    Ban,
    ChevronDown,
    ChevronUp,
    TrendingUp as TrendingUpIcon,
    FileSpreadsheet,
    FileDown,
    Moon as MoonIcon,
    Sun as SunIcon,
    MessageSquare as MessageIcon,
    Reply,
    Percent,
    CreditCard,
    FileText
} from 'lucide-react';
import { Logo as AppLogo } from '../../components/common/Logo';

interface DashboardLayoutProps {
    activeTab: string;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    theme: string;
    toggleTheme: () => void;
    logout: () => void;
    stats: any;
    totalUsers: number;
    plans: any[];
    loading: boolean;
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    activeTab,
    isSidebarOpen,
    setIsSidebarOpen,
    theme,
    toggleTheme,
    logout,
    stats,
    totalUsers,
    plans,
    loading,
    children
}) => {
    return (
        <div className="flex min-h-screen bg-[var(--background)] transition-colors duration-300">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] p-8 flex flex-col 
                shadow-2xl border-r border-[var(--sidebar-border)] transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:fixed h-full
            `}>
                <div className="logo font-heading text-2xl mb-12 flex items-start justify-between">
                    <Link to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <AppLogo variant="horizontal" />
                    </Link>
                    <button 
                        onClick={toggleTheme}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link to="/admin" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <DashboardIcon className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link to="/admin/users" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <UsersIcon className="w-5 h-5" />
                        Daftar Pengguna
                    </Link>
                    <Link to="/admin/families" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'families' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <Users2Icon className="w-5 h-5" />
                        Daftar Keluarga
                    </Link>
                    <Link to="/admin/plans" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'plans' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <PackageIcon className="w-5 h-5" />
                        Paket & Harga
                    </Link>
                    <Link to="/admin/transactions" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <HistoryIcon className="w-5 h-5" />
                        Riwayat Transaksi
                    </Link>
                    <Link to="/admin/reports" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'reports' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <TrendingUpIcon className="w-5 h-5" />
                        Laporan Profit
                    </Link>
                    <Link to="/admin/tax-reports" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'tax-reports' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <FileText className="w-5 h-5" />
                        Laporan Pajak & Biaya
                    </Link>
                    <Link to="/admin/support" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'support' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <MessageIcon className="w-5 h-5" />
                        Support Tiket
                    </Link>
                    <Link to="/admin/settings" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <SettingsIcon className="w-5 h-5" />
                        Konfigurasi
                    </Link>
                    <Link to="/admin/payment-channels" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'payment-channels' ? 'bg-dagang-amber text-dagang-emerald-900 font-bold shadow-lg shadow-dagang-amber/10' : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'}`}>
                        <CreditCard className="w-5 h-5" />
                        Gerbang Pembayaran
                    </Link>
                </nav>

                <div className="mt-12 pt-8 border-t border-[var(--sidebar-border)]">
                    <div className="bg-[var(--sidebar-hover-bg)] p-4 rounded-2xl border border-[var(--sidebar-border)] group hover:bg-red-500/10 transition-all cursor-pointer" onClick={() => logout()}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                <LogOutIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[var(--sidebar-text)] group-hover:text-red-500 transition-colors">Logout Admin</div>
                                <div className="text-[9px] text-[var(--sidebar-text-muted)] uppercase tracking-widest font-black">Sesi Super Admin</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 bg-[var(--surface)] transition-colors duration-300 h-screen overflow-y-auto">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between mb-8 bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-[var(--text-main)]"
                    >
                        <DashboardIcon className="w-6 h-6" />
                    </button>
                    <AppLogo variant="horizontal" className="scale-90" />
                    <button 
                        onClick={toggleTheme}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-[var(--text-main)]"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>

                <header className="flex items-center justify-between mb-8 lg:mb-12">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-[var(--text-main)] mb-1 sm:mb-2 tracking-tight">
                            {activeTab === 'overview' ? 'Dashboard Super Admin' :
                             activeTab === 'reports' ? 'Pusat Laporan Komprehensif' :
                             activeTab === 'families' ? 'Manajemen Keluarga' :
                             activeTab === 'users' ? 'Manajemen Pengguna' :
                             activeTab === 'plans' ? 'Paket & Layanan' :
                             activeTab === 'transactions' ? 'Riwayat Transaksi' :
                             activeTab === 'support' ? 'Pusat Bantuan' :
                             activeTab === 'settings' ? 'Konfigurasi Sistem' :
                             activeTab === 'payment-channels' ? 'Gerbang Pembayaran' : ''}
                        </h1>
                        <p className="text-[12px] sm:text-sm text-[var(--text-muted)] opacity-70">
                            {activeTab === 'overview' ? 'Ringkasan performa sistem dan statistik platform KeuangKu.' :
                             activeTab === 'reports' ? 'Laporan Laba Rugi dan Neraca Platform secara Real-time.' :
                             activeTab === 'families' ? 'Kelola semua entitas keluarga di dalam sistem.' :
                             activeTab === 'users' ? 'Kelola akses dan status seluruh pengguna platform.' :
                             activeTab === 'plans' ? 'Pengaturan harga dan fitur paket langganan.' :
                             activeTab === 'transactions' ? 'Pantau arus pembayaran dan invoice pelanggan.' :
                             activeTab === 'support' ? 'Tanggapi tiket pertanyaan atau keluhan dari pengguna.' :
                             activeTab === 'settings' ? 'Atur variabel dan preferensi utama berjalannya platform.' :
                             activeTab === 'payment-channels' ? 'Atur fee dan aktifasi metode pembayaran Tripay.' : ''}
                        </p>
                    </div>
                </header>

                {loading && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-dagang-amber border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {children}
            </main>
        </div>
    );
};
