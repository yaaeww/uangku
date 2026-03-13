import { useState, useEffect, useMemo, Fragment } from 'react';
import {
    Shield,
    Settings,
    Edit3,
    Plus,
    Trash2,
    CreditCard,
    Users,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Ban,
    UserCircle,
    XCircle,
    LayoutDashboard
} from 'lucide-react';
import { AdminController } from '../controllers/AdminController';
import { useAuthStore } from '../store/authStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { PlanFormModal } from '../components/PlanFormModal';
import { UserFormModal } from '../components/UserFormModal';
import { SettingFormModal } from '../components/SettingFormModal';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface AdminDashboardProps {
    activeSection?: 'overview' | 'users' | 'families' | 'settings' | 'plans';
}

export const AdminDashboard = ({ activeSection: propActiveSection }: AdminDashboardProps) => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [families, setFamilies] = useState<any[]>([]);
    const [settings, setSettings] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const usersPerPage = 10;

    // Modal States
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean,
        title: string,
        message: string,
        type: 'confirm' | 'alert' | 'danger',
        onConfirm: () => void,
        confirmText?: string,
        cancelText?: string
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm',
        onConfirm: () => {}
    });

    const [planModal, setPlanModal] = useState<{
        isOpen: boolean,
        title: string,
        initialData: any | null,
        onSubmit: (data: any) => void
    }>({
        isOpen: false,
        title: '',
        initialData: null,
        onSubmit: () => {}
    });

    const [userModal, setUserModal] = useState<{
        isOpen: boolean,
        title: string,
        initialData: any | null,
        onSubmit: (data: any) => void
    }>({
        isOpen: false,
        title: '',
        initialData: null,
        onSubmit: () => {}
    });

    const [settingModal, setSettingModal] = useState<{
        isOpen: boolean,
        title: string,
        settingKey: string,
        initialValue: string,
        onSubmit: (value: string) => void
    }>({
        isOpen: false,
        title: '',
        settingKey: '',
        initialValue: '',
        onSubmit: () => {}
    });

    const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

    const toggleFamily = (id: string) => {
        const next = new Set(expandedFamilies);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedFamilies(next);
    };
    
    const activeTab = useMemo(() => {
        if (propActiveSection) return propActiveSection;
        const path = location.pathname;
        if (path.includes('/admin/overview')) return 'overview';
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/families')) return 'families';
        if (path.includes('/admin/settings')) return 'settings';
        if (path.includes('/admin/plans')) return 'plans';
        return 'overview'; // Default to overview
    }, [location.pathname, propActiveSection]);

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, familiesData, settingsData, plansData] = await Promise.all([
                AdminController.getStats(),
                AdminController.getFamilies(),
                AdminController.getSettings(),
                AdminController.getPlans()
            ]);
            setStats(statsData);
            setFamilies(familiesData || []);
            setSettings(settingsData || []);
            setPlans(plansData || []);
            setLoading(false);
            // Fetch users separately for the current page
            await fetchUsers(currentPage);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (page: number) => {
        try {
            const usersData = await AdminController.getUsers(page, usersPerPage, searchQuery, statusFilter);
            setUsers(usersData?.data || []);
            setTotalUsers(usersData?.total || 0);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setUsers([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(() => {
                fetchUsers(currentPage);
            }, 300); // Simple debounce
            return () => clearTimeout(timer);
        }
    }, [currentPage, activeTab, searchQuery, statusFilter]);

    const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
        setConfirmModal({
            isOpen: true,
            title: currentlyBlocked ? 'Unblock User?' : 'Blokir User?',
            message: currentlyBlocked 
                ? 'User ini akan dapat kembali mengakses akun mereka.' 
                : 'Akses user ini ke platform akan segera dihentikan.',
            type: currentlyBlocked ? 'confirm' : 'danger',
            confirmText: currentlyBlocked ? 'Unblock' : 'Blokir',
            onConfirm: async () => {
                try {
                    await AdminController.toggleUserBlock(id);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchUsers(currentPage);
                } catch (error) {
                    console.error('Failed to toggle block status', error);
                }
            }
        });
    };

    const handleEditUser = (u: any) => {
        setUserModal({
            isOpen: true,
            title: 'Edit Informasi User',
            initialData: u,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.updateUser({ 
                        ...u, 
                        ...data
                    });
                    setUserModal(prev => ({ ...prev, isOpen: false }));
                    fetchUsers(currentPage);
                } catch (error) {
                    console.error('Failed to update user', error);
                }
            }
        });
    };

    const handleUpdateSetting = async (key: string) => {
        const setting = settings?.find(s => s.key === key);
        setSettingModal({
            isOpen: true,
            title: `Update ${key.replace(/_/g, ' ')}`,
            settingKey: key,
            initialValue: setting?.value || '',
            onSubmit: async (newValue: string) => {
                try {
                    await AdminController.updateSetting(key, newValue);
                    setSettingModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    console.error('Failed to update setting', error);
                }
            }
        });
    };

    const handleCreatePlan = () => {
        setPlanModal({
            isOpen: true,
            title: 'Tambah Paket Baru',
            initialData: null,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.createPlan(data);
                    setPlanModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    console.error('Failed to create plan', error);
                }
            }
        });
    };

    const handleUpdatePlan = (plan: any) => {
        setPlanModal({
            isOpen: true,
            title: 'Edit Paket',
            initialData: plan,
            onSubmit: async (data: any) => {
                try {
                    await AdminController.updatePlan({ ...plan, ...data });
                    setPlanModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    console.error('Failed to update plan', error);
                }
            }
        });
    };

    const handleDeletePlan = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Paket?',
            message: 'Paket ini tidak akan tersedia lagi untuk pelanggan baru.',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: async () => {
                try {
                    await AdminController.deletePlan(id);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    console.error('Failed to delete plan', error);
                }
            }
        } as any);
    };

    const handleDeleteFamily = async (id: string) => {
        console.log("Attempting to delete family:", id);
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Keluarga?',
            message: 'Semua data transaksi dan wallet keluarga ini akan dihapus permanen.',
            type: 'danger',
            confirmText: 'Hapus',
            onConfirm: async () => {
                try {
                    await AdminController.deleteFamily(id);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    console.error('Failed to delete family', error);
                }
            }
        } as any);
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <aside className="w-72 bg-dagang-dark text-white p-8 flex flex-col fixed h-full z-10 shadow-2xl">
                <div className="logo font-serif text-2xl mb-12 flex items-center gap-3">
                    <div className="w-10 h-10 bg-dagang-accent rounded-xl flex items-center justify-center text-dagang-dark">
                        <Shield className="w-6 h-6" />
                    </div>
                    <span>Super<span className="text-dagang-accent">Admin</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link to="/admin/overview" className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        Ringkasan Sistem
                    </Link>
                    <Link to="/admin/users" className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <Users className="w-5 h-5" />
                        Daftar User
                    </Link>
                    <Link to="/admin/families" className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'families' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <Shield className="w-5 h-5" />
                        Daftar Keluarga
                    </Link>
                    <Link to="/admin/plans" className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'plans' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <CreditCard className="w-5 h-5" />
                        Paket & Harga
                    </Link>
                    <Link to="/admin/settings" className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-dagang-accent text-dagang-dark font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <Settings className="w-5 h-5" />
                        Konfigurasi
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-white/10">
                    <button onClick={() => logout()} className="flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors">
                        <XCircle className="w-5 h-5" />
                        <span>Logout Admin</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-72 p-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-serif text-dagang-dark mb-2">Pusat Kendali DagangFinance</h1>
                        <p className="text-dagang-gray">Mengelola ekosistem finansial keluarga Indonesia.</p>
                    </div>
                </header>

                {loading && (
                    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-dagang-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Total Keluarga</div>
                        <div className="text-4xl font-serif text-dagang-dark">{stats?.total_families || 0}</div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Total Pengguna</div>
                        <div className="text-4xl font-serif text-dagang-dark text-dagang-accent">{totalUsers || 0}</div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                        <div className="text-dagang-gray text-sm font-bold uppercase tracking-wider mb-2">Paket Aktif</div>
                        <div className="text-4xl font-serif text-dagang-dark text-green-600">{plans?.length || 0}</div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-black/5 overflow-hidden">
                    <div className="p-8 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between bg-dagang-cream/10 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-dagang-dark">
                                {activeTab === 'overview' ? 'Ringkasan Ekosistem DagangFinance' :
                                 activeTab === 'users' ? 'Database Pengguna Sistem' : 
                                 activeTab === 'families' ? 'Database Keluarga' : 
                                 activeTab === 'plans' ? 'Manajemen Paket Berlangganan' :
                                 'Pengaturan Parameter Sistem'}
                            </h3>
                        </div>
                        
                        {activeTab === 'users' && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dagang-gray/40" />
                                    <input 
                                        type="text"
                                        placeholder="Cari Nama/Email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-dagang-accent outline-none transition-all w-64"
                                    />
                                </div>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-dagang-accent outline-none transition-all cursor-pointer"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="trial">Masa Trial</option>
                                    <option value="subscribed">Berlangganan</option>
                                    <option value="blocked">Terblokir</option>
                                    <option value="active">Aktif (Tidak Blokir)</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <button onClick={handleCreatePlan} className="flex items-center gap-2 px-6 py-3 bg-dagang-dark text-white rounded-2xl hover:bg-dagang-accent hover:text-dagang-dark transition-all shadow-lg font-bold">
                                <Plus className="w-5 h-5" />
                                Tambah Paket
                            </button>
                        )}
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="p-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-[#FBFCFD] p-6 rounded-3xl border border-black/5">
                                    <div className="text-dagang-gray text-[10px] font-bold uppercase tracking-widest mb-4">Distribusi Pengguna</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm text-dagang-gray">Aktif</span>
                                            <span className="text-xl font-bold text-dagang-dark">{(stats?.total_users || 0) - (stats?.blocked_users || 0)}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${((stats?.total_users - stats?.blocked_users) / stats?.total_users) * 100}%` }} />
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm text-dagang-gray">Terblokir</span>
                                            <span className="text-xl font-bold text-red-500">{stats?.blocked_users || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#FBFCFD] p-6 rounded-3xl border border-black/5">
                                    <div className="text-dagang-gray text-[10px] font-bold uppercase tracking-widest mb-4">Status Keluarga</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-dagang-gray">Masa Trial</span>
                                            <span className="font-bold text-amber-500">{stats?.trial_families || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-dagang-gray">Berlangganan</span>
                                            <span className="font-bold text-dagang-orange">{stats?.active_families || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-black/5">
                                            <span className="text-dagang-gray font-bold">Total</span>
                                            <span className="font-bold text-dagang-dark">{stats?.total_families || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#FBFCFD] p-6 rounded-3xl border border-black/5">
                                    <div className="text-dagang-gray text-[10px] font-bold uppercase tracking-widest mb-4">Administrasi</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-dagang-gray">Aplikasi Pending</span>
                                            <span className="bg-dagang-accent/20 text-dagang-dark px-2 py-1 rounded-lg font-bold">{stats?.pending_applications || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-dagang-gray">Paket Tersedia</span>
                                            <span className="font-bold text-dagang-dark">{plans?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-dagang-dark p-6 rounded-3xl text-white">
                                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">Kesehatan Sistem</div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                        <span className="font-bold">Backend Online</span>
                                    </div>
                                    <div className="text-xs text-white/60">
                                        Database Terhubung (GORM/Postgres)
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FBFCFD]">
                                <tr className="text-[11px] font-bold text-dagang-gray/60 uppercase tracking-widest border-b border-black/5 text-center">
                                    {activeTab === 'plans' ? (
                                        <>
                                            <th className="px-8 py-5">Nama Paket</th>
                                            <th className="px-8 py-5">Harga</th>
                                            <th className="px-8 py-5">Slot Member</th>
                                            <th className="px-8 py-5">Durasi</th>
                                            <th className="px-8 py-5 text-right">Aksi</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-8 py-5">Informasi Pengguna</th>
                                            <th className="px-8 py-5">Keluarga & Paket</th>
                                            <th className="px-8 py-5">Status Akun</th>
                                            <th className="px-8 py-5 text-right font-black">AKSI</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {activeTab === 'users' && users?.map((u) => (
                                    <tr key={u.id} className="hover:bg-dagang-cream/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-dagang-dark/5 rounded-full flex items-center justify-center text-dagang-dark/40">
                                                    <UserCircle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-dagang-dark">{u.full_name}</div>
                                                    <div className="text-xs text-dagang-gray">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-medium text-dagang-dark">{u.family_name || 'Tanpa Keluarga'}</div>
                                            <div className="flex gap-2 mt-1">
                                                 <span className="bg-dagang-accent/20 text-dagang-dark px-2 py-0.5 rounded text-[9px] font-bold">{u.plan || 'Free'}</span>
                                                {u.status === 'trial' && (
                                                    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{u.days_remaining} Hari Trial</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {u.is_blocked ? (
                                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ring-red-200">Terblokir</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ring-green-200">Aktif</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleBlock(u.id, u.is_blocked)} 
                                                    className={`p-2 rounded-lg transition-all ${u.is_blocked ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                                                    title={u.is_blocked ? "Unblock" : "Block"}
                                                >
                                                    <Ban className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditUser(u)} 
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'families' && families?.map((fam) => (
                                    <Fragment key={fam.id}>
                                        <tr className="hover:bg-dagang-cream/5 transition-colors border-b border-black/5">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => toggleFamily(fam.id)}
                                                        className="p-1 hover:bg-dagang-cream rounded-lg transition-colors"
                                                    >
                                                        {expandedFamilies.has(fam.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                    <div>
                                                        <div className="font-bold text-dagang-dark text-lg leading-tight">{fam.name}</div>
                                                        <div className="text-[10px] text-dagang-gray font-mono opacity-50">{fam.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    {fam.status === 'trial' ? (
                                                        <span className="w-fit bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-amber-500/20 animate-pulse">
                                                            Masa Trial ({settings.find(s => s.key === 'trial_duration_days')?.value || '10'} Hari)
                                                        </span>
                                                    ) : (
                                                        <span className="w-fit bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 green-500/20">
                                                            Pencatatan Aktif
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="bg-dagang-dark text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                    {fam.subscription_plan}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => handleDeleteFamily(fam.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedFamilies.has(fam.id) && (
                                            <tr className="bg-dagang-cream/10 border-b border-black/5 shadow-inner">
                                                <td colSpan={4} className="px-12 py-8">
                                                    <div className="bg-white rounded-[24px] border border-black/5 overflow-hidden shadow-2xl">
                                                        <div className="px-6 py-4 bg-dagang-dark/5 border-b border-black/5 flex items-center justify-between">
                                                            <div className="text-xs font-black text-dagang-dark uppercase tracking-widest flex items-center gap-2">
                                                                <Users className="w-4 h-4" />
                                                                Daftar Anggota Keluarga ({fam.members?.length || 0})
                                                            </div>
                                                        </div>
                                                        <table className="w-full text-left">
                                                            <thead className="bg-dagang-cream/5 border-b border-black/5">
                                                                <tr className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">
                                                                    <th className="px-6 py-3">Nama Lengkap</th>
                                                                    <th className="px-6 py-3">Email Rekening</th>
                                                                    <th className="px-6 py-3">Wewenang</th>
                                                                    <th className="px-6 py-3 text-right">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-black/5">
                                                                {fam.members && fam.members.length > 0 ? fam.members.map((m: any) => (
                                                                    <tr key={m.id} className="hover:bg-dagang-cream/5 transition-colors">
                                                                        <td className="px-6 py-4">
                                                                            <div className="font-bold text-dagang-dark text-sm">{m.user?.full_name || 'Tanpa Nama'}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-xs font-medium text-dagang-gray italic">
                                                                            {m.user?.email}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                                m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                                                m.role === 'treasurer' ? 'bg-emerald-100 text-emerald-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                                            }`}>
                                                                                {m.role}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <span className="flex items-center justify-end gap-1.5 text-[10px] font-black text-green-600 uppercase">
                                                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                                                                Online
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )) : (
                                                                    <tr>
                                                                        <td colSpan={4} className="px-6 py-10 text-center text-dagang-gray italic text-sm">
                                                                            Belum ada anggota keluarga terdaftar.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                                {activeTab === 'settings' && settings?.map((s) => (
                                    <tr key={s.key} className="hover:bg-dagang-cream/5 transition-colors">
                                        <td className="px-8 py-6 font-black text-dagang-dark uppercase tracking-tighter" colSpan={2}>
                                            {s.key === 'trial_duration_days' ? 'DURASI MASA TRIAL (HARI)' : 
                                             s.key === 'allow_registration' ? 'IZINKAN PENDAFTARAN' :
                                             s.key.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-8 py-6 font-bold text-dagang-accent" colSpan={2}>{s.value}</td>
                                        <td className="px-8 py-6 text-right">
                                            <button onClick={() => handleUpdateSetting(s.key)} className="text-dagang-green text-[12px] font-bold hover:underline">UBAH</button>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'plans' && plans?.map((p) => (
                                    <tr key={p.id} className="hover:bg-dagang-cream/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-dagang-dark">{p.name}</div>
                                            <div className="text-xs text-dagang-gray truncate max-w-[200px]">{p.description}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-dagang-dark">Rp {p.price.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">{p.max_members} Member</span>
                                        </td>
                                        <td className="px-8 py-6 text-center font-medium text-dagang-gray">{p.duration_days} Hari</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdatePlan(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeletePlan(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>

                {activeTab === 'users' && totalUsers > usersPerPage && (
                    <div className="mt-8 flex items-center justify-between bg-white px-8 py-5 rounded-[24px] border border-black/5 shadow-sm">
                        <div className="text-xs font-bold text-dagang-gray uppercase tracking-widest">
                            Menampilkan <span className="text-dagang-dark">{(currentPage - 1) * usersPerPage + 1} - {Math.min(currentPage * usersPerPage, totalUsers)}</span> Dari <span className="text-dagang-dark">{totalUsers}</span> User
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-dagang-dark/5 text-dagang-dark rounded-xl hover:bg-dagang-accent disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {[...Array(Math.ceil(totalUsers / usersPerPage))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-dagang-dark text-white shadow-lg' : 'bg-dagang-dark/5 text-dagang-dark hover:bg-dagang-accent/20'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalUsers / usersPerPage), p + 1))}
                                disabled={currentPage === Math.ceil(totalUsers / usersPerPage)}
                                className="p-2 bg-dagang-dark/5 text-dagang-dark rounded-xl hover:bg-dagang-accent disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={(confirmModal as any).confirmText}
                cancelText={(confirmModal as any).cancelText}
            />

            <PlanFormModal
                isOpen={planModal.isOpen}
                onClose={() => setPlanModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={planModal.onSubmit}
                initialData={planModal.initialData}
                title={planModal.title}
            />
            <UserFormModal
                isOpen={userModal.isOpen}
                onClose={() => setUserModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={userModal.onSubmit}
                initialData={userModal.initialData}
                title={userModal.title}
            />
            <SettingFormModal
                isOpen={settingModal.isOpen}
                onClose={() => setSettingModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={settingModal.onSubmit}
                initialValue={settingModal.initialValue}
                settingKey={settingModal.settingKey}
                title={settingModal.title}
            />
        </div>
    );
};
