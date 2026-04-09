import React, { useState, useEffect } from 'react';
import { TablePagination } from '../../components/common/TablePagination';
import { Settings, Shield, Globe, Monitor, Plus, Trash2, Trash, Edit3, Link2 } from 'lucide-react';
import { AdminController } from '../../controllers/AdminController';
import toast from 'react-hot-toast';

interface SettingsTabProps {
    settings: any[];
    handleUpdateSetting: (key: string) => void;
    usersPerPage: number;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
    settings,
    handleUpdateSetting,
    usersPerPage
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'superadmin' | 'trial' | 'website' | 'contact'>('superadmin');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Super Admin State
    const [superAdmins, setSuperAdmins] = useState<any[]>([]);
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [newAdmin, setNewAdmin] = useState({ full_name: '', email: '', password: '' });
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    const fetchSuperAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const data = await AdminController.getSuperAdmins();
            setSuperAdmins(data || []);
        } catch (error) {
            console.error('Failed to fetch super admins', error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'superadmin') {
            fetchSuperAdmins();
        }
        setCurrentPage(1); // Reset page on tab change
    }, [activeSubTab]);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAdminId) {
                await AdminController.updateSuperAdmin(editingAdminId, newAdmin);
                toast.success('Data admin berhasil diperbarui!');
            } else {
                await AdminController.createSuperAdmin(newAdmin);
                toast.success('Admin baru berhasil ditambahkan!');
            }
            setIsAddingAdmin(false);
            setEditingAdminId(null);
            setNewAdmin({ full_name: '', email: '', password: '' });
            fetchSuperAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Gagal menyimpan data admin');
        }
    };

    const handleEditAdmin = (admin: any) => {
        setEditingAdminId(admin.id);
        setNewAdmin({ full_name: admin.full_name, email: admin.email, password: '' });
        setIsAddingAdmin(true);
    };

    const handleCancelEdit = () => {
        setIsAddingAdmin(false);
        setEditingAdminId(null);
        setNewAdmin({ full_name: '', email: '', password: '' });
    };

    const handleDeleteAdmin = async (id: string) => {
        if (window.confirm('Yakin ingin menghapus Super Admin ini?')) {
            try {
                await AdminController.deleteSuperAdmin(id);
                fetchSuperAdmins();
            } catch (error: any) {
                alert(error.response?.data?.error || 'Gagal menghapus admin');
            }
        }
    };

    const renderSettingRow = (s: any) => (
        <tr key={s.key} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[var(--border)]">
            <td className="px-8 py-6 font-black text-[var(--text-main)] uppercase tracking-tighter" colSpan={1}>
                {s.key === 'tax_percentage' ? 'PERSENTASE PAJAK PPN (%)' :
                 s.key === 'trial_duration_days' ? 'DURASI MASA TRIAL (HARI)' : 
                 s.key === 'allow_registration' ? 'IZINKAN PENDAFTARAN' :
                 s.key === 'trial_max_members' ? 'LIMIT ANGGOTA TRIAL' :
                 s.key === 'otp_expiry_duration' ? 'DURASI KADALUARSA OTP (MENIT)' :
                 s.key === 'resend_otp_duration' ? 'JEDA KIRIM ULANG OTP (DETIK)' :
                 s.key === 'contact_address' ? 'ALAMAT KANTOR' :
                 s.key === 'contact_building' ? 'NAMA GEDUNG / KANTOR' :
                 s.key === 'contact_email_support' ? 'EMAIL SUPPORT' :
                 s.key === 'contact_email_admin' ? 'EMAIL ADMIN' :
                 s.key === 'contact_phone_primary' ? 'TELEPON UTAMA' :
                 s.key === 'contact_phone_secondary' ? 'TELEPON SEKUNDER' :
                 s.key === 'social_instagram_1' ? 'INSTAGRAM 1' :
                 s.key === 'social_instagram_2' ? 'INSTAGRAM 2' :
                 s.key === 'social_youtube' ? 'YOUTUBE LINK' :
                 s.key === 'social_facebook' ? 'FACEBOOK LINK' :
                 s.key === 'social_tiktok' ? 'TIKTOK LINK' :
                 s.key === 'social_twitter' ? 'TWITTER/X LINK' :
                 s.key === 'whatsapp_number' ? 'NOMOR WHATSAPP' :
                 s.key === 'whatsapp_link' ? 'LINK WHATSAPP CTA' :
                 s.key.replace(/_/g, ' ')}
            </td>
            <td className="px-8 py-6 font-heading font-black text-[var(--accent)]" colSpan={2}>
                {s.key.includes('logo_url') ? (
                    <div className="flex items-center gap-3 justify-center">
                        {s.value ? (
                            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border)] overflow-hidden flex items-center justify-center p-2 group relative">
                                <img 
                                    src={String(s.value || '').startsWith('http') ? s.value : `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}${s.value}`} 
                                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Error';
                                    }}
                                />
                            </div>
                        ) : (
                            <span className="text-[10px] text-[var(--text-muted)] opacity-80 italic">Belum diunggah</span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)] font-mono opacity-70 truncate max-w-[150px]">{s.value || '-'}</span>
                    </div>
                ) : s.value}
            </td>
            <td className="px-8 py-6 text-right">
                <button onClick={() => handleUpdateSetting(s.key)} className="text-[var(--text-main)] opacity-80 hover:opacity-100 text-[12px] font-black hover:underline uppercase tracking-widest">UBAH</button>
            </td>
        </tr>
    );

    const trialKeys = ['trial_duration_days', 'trial_max_members', 'allow_registration'];
    const hiddenKeys = ['platform_expense_allocation_pct'];
    const websiteKeys = ['website_name', 'logo_url_light', 'logo_url_dark', 'tax_percentage'];
    const contactKeys = [
        'contact_address', 'contact_building',
        'contact_email_support', 'contact_email_admin',
        'contact_phone_primary', 'contact_phone_secondary',
        'social_instagram_1', 'social_instagram_2',
        'social_youtube', 'social_facebook', 'social_tiktok', 'social_twitter',
        'whatsapp_number', 'whatsapp_link'
    ];
    
    // Sort and Filter BEFORE paginating
    const allFilteredSettings = (() => {
        if (activeSubTab === 'superadmin') return [];
        
        if (activeSubTab === 'contact') {
            // Ensure all contact keys are shown even if they don't exist in DB yet
            return contactKeys.map(key => {
                const existing = (settings || []).find(s => s.key === key);
                return existing || { key, value: '-' };
            });
        }

        return (settings || []).filter(s => {
            if (hiddenKeys.includes(s.key)) return false;
            if (contactKeys.includes(s.key)) return false; // Don't show in website tab if we have contact tab
            return activeSubTab === 'trial' ? trialKeys.includes(s.key) : !trialKeys.includes(s.key);
        });
    })();

    const paginatedSettings = allFilteredSettings.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    return (
        <div className="space-y-6">
            {/* Sub-Tabs Validation Header */}
            <div className="flex flex-wrap gap-2 lg:gap-4 mb-6">
                <button 
                    onClick={() => setActiveSubTab('superadmin')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-black text-xs lg:text-sm uppercase tracking-widest ${
                        activeSubTab === 'superadmin' ? 'bg-[var(--accent)] text-white shadow-lg scale-105' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                    }`}
                >
                    <Shield className="w-4 h-4" />
                    Akun Super Admin
                </button>
                <button 
                    onClick={() => setActiveSubTab('trial')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-black text-xs lg:text-sm uppercase tracking-widest ${
                        activeSubTab === 'trial' ? 'bg-[var(--accent)] text-white shadow-lg scale-105' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                    }`}
                >
                    <Monitor className="w-4 h-4" />
                    Konfigurasi Masa Trial
                </button>
                <button 
                    onClick={() => setActiveSubTab('website')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-black text-xs lg:text-sm uppercase tracking-widest ${
                        activeSubTab === 'website' ? 'bg-[var(--accent)] text-white shadow-lg scale-105' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    Konfigurasi Website
                </button>
                <button 
                    onClick={() => setActiveSubTab('contact')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-black text-xs lg:text-sm uppercase tracking-widest ${
                        activeSubTab === 'contact' ? 'bg-[var(--accent)] text-white shadow-lg scale-105' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]'
                    }`}
                >
                    <Link2 className="w-4 h-4" />
                    Informasi Kontak
                </button>
            </div>

            {/* Inner Content Block */}
            <div className="bg-[var(--surface-card)] rounded-[40px] shadow-sm border border-[var(--border)]">
                
                {/* SUPER ADMIN LIST */}
                {activeSubTab === 'superadmin' && (
                    <>
                        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-black/5 dark:bg-white/5">
                            <div>
                                <h3 className="text-lg font-heading font-black text-[var(--text-main)]">Daftar Super Admin</h3>
                                <p className="text-xs text-[var(--text-muted)]">Kelola akun-akun yang memiliki akses Super Admin.</p>
                            </div>
                        </div>
                        {editingAdminId && (
                            <form onSubmit={handleCreateAdmin} className="p-6 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-4">
                                <h4 className="font-bold text-[var(--accent)]">Edit Super Admin</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Nama Lengkap" 
                                        className="w-full px-4 py-3 bg-[var(--surface)] text-[var(--text-main)] rounded-xl border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                                        value={newAdmin.full_name} 
                                        onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })} 
                                    />
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="Email Admin" 
                                        className="w-full px-4 py-3 bg-[var(--surface)] text-[var(--text-main)] rounded-xl border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                                        value={newAdmin.email} 
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} 
                                    />
                                    <input 
                                        type="password" 
                                        required={!editingAdminId} 
                                        placeholder={editingAdminId ? "Password Baru (Kosongkan jika tak diubah)" : "Password (Min. 6 Karakter)"} 
                                        className="w-full px-4 py-3 bg-[var(--surface)] text-[var(--text-main)] rounded-xl border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                                        value={newAdmin.password} 
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} 
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl">Batal</button>
                                    <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-xl font-bold shadow-lg">{editingAdminId ? 'Simpan Perubahan' : 'Simpan Admin Baru'}</button>
                                </div>
                            </form>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-black/5 dark:bg-white/5">
                                    <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)]">
                                        <th className="px-8 py-5 text-left font-black">NAMA LENGKAP</th>
                                        <th className="px-8 py-5 text-left font-black">EMAIL ADMIN</th>
                                        <th className="px-8 py-5 text-center font-black">TANGGAL DIBUAT</th>
                                        <th className="px-8 py-5 text-right font-black">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {loadingAdmins ? (
                                        <tr><td colSpan={4} className="p-8 text-center italic text-[var(--text-muted)]">Memuat...</td></tr>
                                    ) : superAdmins.map((admin: any) => (
                                        <tr key={admin.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-6 font-bold text-[var(--text-main)]">{admin.full_name}</td>
                                            <td className="px-8 py-6 font-medium text-[var(--text-muted)]">{admin.email}</td>
                                            <td className="px-8 py-6 text-center text-[var(--text-muted)] text-sm">{new Date(admin.created_at).toLocaleDateString('id-ID')}</td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEditAdmin(admin)} className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors" title="Edit Admin">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Catatan: Tidak bisa menghapus admin terakhir">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loadingAdmins && superAdmins.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center italic text-[var(--text-muted)]">Belum ada data admin</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* SETTINGS OTHERS (TRIAL OR WEBSITE) */}
                {activeSubTab !== 'superadmin' && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-black/5 dark:bg-white/5">
                                    <tr className="text-[11px] font-black text-[var(--text-muted)] opacity-80 uppercase tracking-widest border-b border-[var(--border)] text-center">
                                        <th className="px-8 py-5 text-left font-black">KONFIGURASI</th>
                                        <th className="px-8 py-5 font-black" colSpan={2}>NILAI / VALUE</th>
                                        <th className="px-8 py-5 text-right font-black">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {paginatedSettings?.map(renderSettingRow)}
                                    {paginatedSettings.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-[var(--text-muted)] opacity-50 text-[10px] uppercase font-black tracking-widest italic">Tidak ada pengaturan ditemukan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-[var(--border)]">
                            <TablePagination 
                                currentPage={currentPage}
                                totalItems={allFilteredSettings.length}
                                itemsPerPage={usersPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>
            
        </div>
    );
};
