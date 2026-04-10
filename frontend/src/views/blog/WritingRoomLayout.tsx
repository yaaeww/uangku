import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { 
    Type, 
    FileText, 
    Globe, 
    Activity,
    Layout,
    LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WritingRoomLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname === '/writing-room' ? 'dashboard' : 
                     location.pathname === '/writing-room/audit' ? 'audit' :
                     location.pathname === '/writing-room/articles' ? 'articles' :
                     location.pathname === '/writing-room/sitemap' ? 'sitemap' : 'dashboard';

    const tabs = [
        { id: 'dashboard', icon: Layout, label: 'Dashboard', path: '/writing-room' },
        { id: 'articles', icon: FileText, label: 'Articles', path: '/writing-room/articles' },
        { id: 'audit', icon: Activity, label: 'SEO Audit', path: '/writing-room/audit' },
        { id: 'sitemap', icon: Globe, label: 'Sitemap', path: '/writing-room/sitemap' }
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] transition-colors duration-300">
            {/* Header */}
            <header className="bg-[var(--surface-card)] border-b border-[var(--border)] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/writing-room" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20">
                            <Type className="w-6 h-6" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-serif text-[var(--text-main)]">Writing Room</h1>
                            <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Strategy Dashboard</p>
                        </div>
                    </Link>
                    
                    <div className="flex items-center gap-8">
                        <nav className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(tab.path)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-[var(--surface-card)] text-[var(--primary)] shadow-sm' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden md:block">{tab.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3 border-l border-[var(--border)] pl-8">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-[var(--text-main)]">{user?.fullName || 'SEO Specialist'}</div>
                                <div className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest">Strategist</div>
                            </div>
                            <div className="relative group">
                                <div className="w-10 h-10 bg-[var(--text-main)] text-[var(--background)] rounded-full flex items-center justify-center font-bold border-2 border-[var(--surface-card)] shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                    {user?.fullName?.charAt(0) || 'S'}
                                </div>
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-[60]">
                                    <button 
                                        onClick={() => {
                                            logout();
                                            navigate('/login');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <motion.main 
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto px-6 py-10"
            >
                <Outlet />
            </motion.main>
        </div>
    );
};
