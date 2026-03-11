import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    CheckCircle,
    XCircle,
    Search,
    MoreVertical,
    TrendingUp,
    Shield,
    Calendar,
    Mail,
    Home
} from 'lucide-react';
import { AdminController } from '../controllers/AdminController';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [families, setFamilies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'applications' | 'families'>('applications');

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, appsData, familiesData] = await Promise.all([
                AdminController.getStats(),
                AdminController.getApplications(),
                AdminController.getFamilies()
            ]);
            setStats(statsData);
            setApplications(appsData);
            setFamilies(familiesData);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Setujui permintaan bergabung keluarga ini?')) return;
        try {
            await AdminController.approveApplication(id);
            alert('Aplikasi disetujui!');
            fetchData();
        } catch (error) {
            alert('Gagal menyetujui aplikasi');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Tolak permintaan ini?')) return;
        try {
            await AdminController.rejectApplication(id);
            alert('Aplikasi ditolak');
            fetchData();
        } catch (error) {
            alert('Gagal menolak aplikasi');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-72 bg-dagang-dark text-white p-8 flex flex-col fixed h-full z-10 shadow-2xl">
                <div className="logo font-serif text-2xl mb-12 flex items-center gap-3">
                    <div className="w-10 h-10 bg-dagang-accent rounded-xl flex items-center justify-center text-dagang-dark">
                        <Shield className="w-6 h-6" />
                    </div>
                    <span>Super<span className="text-dagang-accent">Admin</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'applications' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <UserPlus className="w-5 h-5" />
                        Aplikasi Join
                        {stats?.pending_applications > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{stats.pending_applications}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('families')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'families' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users className="w-5 h-5" />
                        Daftar Keluarga
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        <TrendingUp className="w-5 h-5" />
                        Laporan Bisnis
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-white/10">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors"
                    >
                        <XCircle className="w-5 h-5" />
                        <span>Logout Admin</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 p-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-serif text-dagang-dark mb-2">Pusat Kendali DagangFinance</h1>
                        <p className="text-dagang-gray">Mengelola ekosistem finansial keluarga Indonesia.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white rounded-xl border border-black/5 shadow-sm text-sm font-medium">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {loading && (
                    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-dagang-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Total Keluarga</div>
                        <div className="text-4xl font-serif text-dagang-dark">{stats?.total_families || 0}</div>
                        <div className="mt-4 flex items-center gap-2 text-green-500 text-sm font-bold">
                            <TrendingUp className="w-4 h-4" /> +12% Bulan ini
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Aplikasi Pending</div>
                        <div className="text-4xl font-serif text-dagang-dark text-dagang-accent">{stats?.pending_applications || 0}</div>
                        <div className="mt-4 text-dagang-gray text-xs">Menunggu verifikasi Anda</div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Total Berlangganan</div>
                        <div className="text-4xl font-serif text-dagang-dark text-dagang-green">{stats?.total_families || 0}</div>
                        <div className="mt-4 text-dagang-gray text-xs">Semua paket aktif</div>
                    </div>
                </div>

                {/* Tables */}
                <div className="bg-white rounded-[40px] shadow-sm border border-black/5 overflow-hidden">
                    <div className="p-8 border-b border-black/5 flex items-center justify-between bg-dagang-cream/10">
                        <h3 className="text-xl font-bold text-dagang-dark">
                            {activeTab === 'applications' ? 'Konfirmasi Permintaan Bergabung' : 'Database Keluarga'}
                        </h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dagang-gray/40" />
                                <input
                                    type="text"
                                    placeholder="Cari keluarga..."
                                    className="pl-12 pr-6 py-3 bg-white border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-dagang-accent/20 outline-none w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FBFCFD]">
                                <tr className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest border-b border-black/5">
                                    <th className="px-8 py-5">Keluarga</th>
                                    <th className="px-8 py-5">Kontak</th>
                                    <th className="px-8 py-5">Paket</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {activeTab === 'applications' ? (
                                    applications.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-dagang-gray italic">Tidak ada aplikasi pending</td></tr>
                                    ) : applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-dagang-cream/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-dagang-green/10 rounded-2xl flex items-center justify-center text-dagang-green font-bold text-lg">
                                                        {app.family_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-dagang-dark">{app.family_name}</div>
                                                        <div className="text-xs text-dagang-gray">Kepala: {app.head_of_family}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm text-dagang-dark/70 mb-1">
                                                    <Mail className="w-3.5 h-3.5" /> {app.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-dagang-gray">
                                                    <Calendar className="w-3.5 h-3.5" /> {new Date(app.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.selected_plan === 'premium' ? 'bg-dagang-dark text-white' :
                                                    app.selected_plan === 'family' ? 'bg-dagang-accent text-dagang-dark' : 'bg-dagang-green text-white'
                                                    }`}>
                                                    {app.selected_plan}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`flex items-center gap-2 text-sm font-bold ${app.status === 'pending' ? 'text-amber-500' : 'text-green-500'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${app.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                                    {app.status === 'pending' ? 'Pending' : 'Approved'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(app.id)}
                                                        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(app.id)}
                                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    families.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-dagang-gray italic">Belum ada keluarga terdaftar</td></tr>
                                    ) : families.map((fam) => (
                                        <tr key={fam.id} className="hover:bg-dagang-cream/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-dagang-dark/5 rounded-2xl flex items-center justify-center text-dagang-dark font-bold text-lg">
                                                        <Home className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-dagang-dark">{fam.name}</div>
                                                        <div className="text-xs text-dagang-gray">ID: {fam.id.substring(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm text-dagang-dark font-medium">Trial Berakhir:</div>
                                                <div className="text-xs text-red-500">{new Date(fam.trial_ends_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${fam.subscription_plan === 'premium' ? 'bg-dagang-dark text-white' :
                                                    fam.subscription_plan === 'family' ? 'bg-dagang-accent text-dagang-dark' : 'bg-dagang-green text-white'
                                                    }`}>
                                                    {fam.subscription_plan}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`flex items-center gap-2 text-sm font-bold ${fam.status === 'trial' ? 'text-dagang-accent' : 'text-green-500'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${fam.status === 'trial' ? 'bg-dagang-accent' : 'bg-green-500'}`} />
                                                    {fam.status === 'trial' ? 'Masa Trial' : 'Berlangganan'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 text-dagang-gray hover:text-dagang-dark">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
