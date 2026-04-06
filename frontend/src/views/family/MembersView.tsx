import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, 
    UserPlus, 
    Shield, 
    User, 
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    Mail,
    X,
    Copy,
    MessageCircle,
    ExternalLink,
    Camera,
    Save,
    Home,
    ArrowUpCircle,
    Star,
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';
import api, { getStorageUrl } from '../../services/api';
import { useModal } from '../../providers/ModalProvider';

const SubscriptionCountdown: React.FC<{ family: any }> = ({ family }) => {
    if (!family || (family.status !== 'trial' && family.status !== 'active')) return null;

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = family.status === 'trial' ? family.trial_ends_at : family.subscription_ends_at;
            if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            
            const target = new Date(targetDate).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [family.trial_ends_at, family.subscription_ends_at, family.status]);

    const isTrial = family.status === 'trial';

    return (
        <div className={`p-6 rounded-[32px] ${isTrial ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20' : 'bg-[var(--accent)]/10 border-[var(--accent)]/20'} border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-700`}>
             <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 ${isTrial ? 'bg-[var(--primary)]' : 'bg-[var(--accent)]'} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                    {isTrial ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                    <div className="text-[14px] font-bold text-[var(--text-main)]">
                        {isTrial ? 'Trial Gratis Berakhir Dalam:' : 'Sisa Masa Langganan Aktif:'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                {[
                    { val: timeLeft.days, unit: 'HARI' },
                    { val: timeLeft.hours, unit: 'JAM' },
                    { val: timeLeft.minutes, unit: 'MENIT' },
                    { val: timeLeft.seconds, unit: 'DETIK' }
                ].map((t, i) => (
                    <React.Fragment key={t.unit}>
                        <div className={`flex flex-col items-center min-w-[60px] p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)]`}>
                            <span className={`text-[18px] font-black ${isTrial ? 'text-[var(--primary)]' : 'text-[var(--accent)]'} tabular-nums`}>
                                {String(t.val).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] font-black text-[var(--text-muted)] opacity-80 tracking-widest">{t.unit}</span>
                        </div>
                        {i < 3 && <span className={`text-[18px] font-black ${isTrial ? 'text-[var(--primary)]/20' : 'text-[var(--accent)]/20'}`}>:</span>}
                    </React.Fragment>
                ))}
            </div>
            
            {/* Background Decoration */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 ${isTrial ? 'bg-[var(--primary)]/5' : 'bg-[var(--accent)]/5'} rounded-full blur-2xl`} />
        </div>
    );
};

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'head_of_family':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-dagang-dark text-[var(--accent)] text-[10px] font-black uppercase tracking-widest rounded-full border border-[var(--accent)]/20 ring-2 ring-[var(--accent)]/10">
                    <Home className="w-3 h-3" /> Kepala Keluarga
                </span>
            );
        case 'treasurer':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase tracking-widest rounded-full border border-[var(--primary)]/20">
                    <Shield className="w-3 h-3" /> Bendahara Utama
                </span>
            );
        case 'member':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                    <User className="w-3 h-3" /> Anggota
                </span>
            );
        case 'viewer':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest rounded-full border border-[var(--border)]">
                    <Eye className="w-3 h-3" /> Pantau Only
                </span>
            );
        default:
            return null;
    }
};

export const MembersView: React.FC = () => {
    const { user, refreshDashboard, familyRole, familyMembers: contextMembers, summary: contextSummary } = useOutletContext<any>();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();

    const getBudgetStatus = (memberId: string) => {
        const memberBudget = contextSummary?.memberBudgets?.[memberId] || 0;
        if (memberBudget > 0) {
            return (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-emerald-500/10">
                    <CheckCircle2 className="w-3 h-3" /> Budget OK
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-orange-500/10">
                <AlertCircle className="w-3 h-3" /> No Budget
            </span>
        );
    };
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitationId, setInvitationId] = useState<string | null>(null);
    const [invitations, setInvitations] = useState<any[]>([]);

    // Family Profile State
    const [familyName, setFamilyName] = useState('');
    const [familyPhoto, setFamilyPhoto] = useState<string | null>(null);
    const [familyStatus, setFamilyStatus] = useState('trial');
    const [memberCount, setMemberCount] = useState(0);
    const [invitationCount, setInvitationCount] = useState(0);
    const [maxMembers, setMaxMembers] = useState(5);
    const [trialMaxMembers, setTrialMaxMembers] = useState(2);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isSavingFamily, setIsSavingFamily] = useState(false);
    const [familyData, setFamilyData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // Use context data if available, otherwise fetch
            if (contextMembers && contextMembers.length > 0) {
                setMembers(contextMembers);
            } else {
                await fetchMembers();
            }

            if (contextSummary) {
                setFamilyData(contextSummary.family);
                setFamilyName(contextSummary.family.name);
                setFamilyPhoto(contextSummary.family.photo_url);
                setFamilyStatus(contextSummary.family.status);
                setMemberCount(contextSummary.memberCount);
                setInvitationCount(contextSummary.invitationCount);
                setMaxMembers(contextSummary.plan?.max_members || 5);
            } else {
                await fetchFamilyProfile();
            }

            await Promise.all([
                fetchInvitations(),
                fetchPublicSettings()
            ]);
            setLoading(false);
        };
        init();
    }, [contextMembers, contextSummary]);


    const fetchPublicSettings = async () => {
        try {
            const response = await api.get('/public/settings');
            const settings = response.data;
            if (settings.trial_max_members) {
                setTrialMaxMembers(parseInt(settings.trial_max_members));
            }
        } catch (error) {
            console.error("Failed to fetch public settings", error);
        }
    };

    const fetchMembers = async () => {
        try {
            const data = await FinanceController.getMembers();
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch members", error);
        }
    };

    const fetchInvitations = async () => {
        try {
            const data = await FinanceController.getInvitations();
            setInvitations(data);
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        }
    };

    const fetchFamilyProfile = async () => {
        try {
            const response = await api.get('/finance/families/profile');
            const data = response.data;
            setFamilyData(data.family);
            setFamilyName(data.family.name);
            setFamilyPhoto(data.family.photo_url);
            setFamilyStatus(data.family.status);
            setMemberCount(data.member_count);
            setInvitationCount(data.invitation_count);
            setMaxMembers(data.plan?.max_members || 5);
        } catch (error) {
            console.error("Failed to fetch family profile", error);
        }
    };

    const handleUpgradePlan = () => {
        const familyName = user?.familyName || '';
        navigate(`/${encodeURIComponent(familyName)}/dashboard/family/pricing`);
    };

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas toBlob failed'));
                    }, 'image/webp', 0.8);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const webpBlob = await convertToWebP(file);
                const webpFile = new File([webpBlob], "photo.webp", { type: "image/webp" });
                setPhotoFile(webpFile);
                setFamilyPhoto(URL.createObjectURL(webpBlob));
            } catch (err) {
                showAlert('Error', "Gagal memproses gambar", 'danger');
            }
        }
    };

    const handleUpdateFamily = async () => {
        setIsSavingFamily(true);
        try {
            const formData = new FormData();
            formData.append('name', familyName);
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            await api.put('/finance/families/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showAlert('Berhasil', "Profil keluarga berhasil diperbarui!", 'alert');
            setPhotoFile(null);
            fetchFamilyProfile();
            refreshDashboard();
        } catch (error) {
            showAlert('Gagal', "Gagal memperbarui profil keluarga", 'danger');
        } finally {
            setIsSavingFamily(false);
        }
    };

    const handleDeletePhoto = async () => {
        showConfirm('Hapus Foto', "Apakah Anda yakin ingin menghapus foto keluarga?", async () => {
            try {
                await api.delete('/finance/families/profile/photo');
                setFamilyPhoto(null);
                setPhotoFile(null);
                showAlert('Berhasil', "Foto keluarga berhasil dihapus!", 'alert');
                fetchFamilyProfile();
                refreshDashboard();
            } catch (error) {
                showAlert('Gagal', "Gagal menghapus foto keluarga", 'danger');
            }
        }, 'danger');
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const activePlanMax = maxMembers > 0 ? maxMembers : 2;
        const effectiveMax = (familyStatus === 'trial' && (!familyData?.subscription_plan || familyData.subscription_plan === 'Standard')) 
            ? trialMaxMembers 
            : activePlanMax;

        if (memberCount + invitationCount >= effectiveMax) {
            showAlert('Limit Tercapai', "Limit anggota tercapai. Silakan hapus anggota atau upgrade paket.", 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            const data = await FinanceController.inviteMember(inviteEmail, inviteRole);
            setInvitationId(data.invitation_id);
            fetchInvitations();
            fetchFamilyProfile();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Gagal mengirim undangan.";
            showAlert('Gagal', msg, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyInviteLink = () => {
        if (!invitationId) return;
        const link = `${window.location.origin}/register?invitation_id=${invitationId}`;
        navigator.clipboard.writeText(link);
        showAlert('Berhasil', "Link undangan berhasil disalin!", 'alert');
    };

    const shareWhatsApp = () => {
        if (!invitationId) return;
        const link = `${window.location.origin}/register?invitation_id=${invitationId}`;
        const text = `Halo! Saya mengundang kamu untuk bergabung ke keluarga ${familyName || user?.familyName} di Uangku. Klik link berikut untuk mendaftar: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await FinanceController.updateMemberRole(id, newRole);
            fetchMembers();
        } catch (error) {
            showAlert('Gagal', "Gagal memperbarui peran anggota", 'danger');
        }
    };

    const handleRemoveMember = async (id: string) => {
        showConfirm('Hapus Anggota', "Apakah Anda yakin ingin menghapus anggota ini dari keluarga?", async () => {
            try {
                await FinanceController.removeMember(id);
                fetchMembers();
                fetchFamilyProfile();
            } catch (error) {
                showAlert('Gagal', "Gagal menghapus anggota", 'danger');
            }
        }, 'danger');
    };

    const handleCancelInvitation = async (id: string) => {
        showConfirm('Batalkan Undangan', "Apakah Anda yakin ingin membatalkan undangan ini?", async () => {
            try {
                await FinanceController.cancelInvitation(id);
                fetchInvitations();
                fetchFamilyProfile();
            } catch (error) {
                showAlert('Gagal', "Gagal membatalkan undangan", 'danger');
            }
        }, 'danger');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[var(--text-muted)] opacity-60 tracking-widest uppercase">Memuat Ruang Keluarga...</p>
        </div>
    );

    const activePlanMax = maxMembers > 0 ? maxMembers : 2;
    const effectiveMax = (familyStatus === 'trial' && (!familyData?.subscription_plan || familyData.subscription_plan === 'Standard')) 
        ? trialMaxMembers 
        : activePlanMax;
    
    // Filter invitations that don't have a corresponding member yet
    const pendingInvitations = invitations.filter(inv => 
        !members.some(m => m.email.toLowerCase() === inv.email.toLowerCase())
    );
    const activeInvitationCount = pendingInvitations.length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-h2 font-heading text-[var(--text-main)]">Ruang Keluarga</h1>
                    <p className="text-body-s text-[var(--text-muted)] mt-1">Kelola nama, foto, dan akses anggota keluarga Anda.</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        disabled={memberCount + invitationCount >= effectiveMax}
                        className={`bg-[var(--primary)] text-white px-6 py-3 rounded-[20px] font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-black/10 ${(memberCount + invitationCount >= effectiveMax) ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                    >
                        <UserPlus className="w-4 h-4" /> 
                        Undang Anggota
                    </button>
                    {(memberCount + invitationCount >= effectiveMax) && (
                        <div className="flex flex-col items-end gap-1.5">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2">
                                {familyStatus === 'trial' ? `Trial: Slot Terbatas (Max ${trialMaxMembers})` : 'Slot Penuh: Upgrade paket Anda'}
                            </p>
                            <button 
                                onClick={handleUpgradePlan}
                                className="text-[10px] font-bold text-white bg-[var(--accent)] px-4 py-1.5 rounded-full hover:opacity-90 transition-colors shadow-sm inline-flex items-center gap-1.5"
                            >
                                🚀 Upgrade Akun
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Countdown */}
            {familyData && <SubscriptionCountdown family={familyData} />}

            {/* Family Profile Card */}
            <div className="bg-[var(--surface-card)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[32px] bg-black/5 dark:bg-white/5 border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden">
                        {familyPhoto ? (
                            <img 
                                src={familyPhoto.startsWith('blob:') ? familyPhoto : getStorageUrl(familyPhoto)} 
                                className="w-full h-full object-cover" 
                                alt="Family Profile"
                            />
                        ) : (
                            <Home className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                        {familyRole === 'head_of_family' && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center shadow-lg hover:opacity-90 transition-all"
                                title="Ganti Foto"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        )}
                        {familyPhoto && familyRole === 'head_of_family' && (
                            <button 
                                onClick={handleDeletePhoto}
                                className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-all animate-in slide-in-from-right-2"
                                title="Hapus Foto"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Nama Keluarga</label>
                        <input 
                            type="text" 
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            disabled={familyRole !== 'head_of_family'}
                            className={`w-full h-14 px-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-bold text-lg text-[var(--text-main)] ${familyRole !== 'head_of_family' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="Contoh: Keluarga Stark"
                        />
                    </div>
                    {familyRole === 'head_of_family' && (
                        <button 
                            onClick={handleUpdateFamily}
                            disabled={isSavingFamily}
                            className="flex items-center gap-2 px-8 py-3.5 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-black/10 disabled:opacity-70"
                        >
                            {isSavingFamily ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Simpan Perubahan Profil
                        </button>
                    )}
                </div>
                
                <div className="hidden lg:block w-px h-24 bg-[var(--border)]" />
                
                <div className="hidden lg:flex flex-col items-center gap-2 px-8">
                    <div className="text-3xl font-serif text-[var(--text-main)]">
                        {(memberCount || 0) + (activeInvitationCount || 0)} / {effectiveMax}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Slot Anggota Terisi</div>
                    {activeInvitationCount > 0 && (
                        <div className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                            + {activeInvitationCount} Undangan Pending
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Status & Upgrade CTA */}
            <div className="bg-[#064E3B] p-8 md:p-12 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[32px] bg-white/10 text-[var(--accent)] flex items-center justify-center border border-white/20 backdrop-blur-md">
                            <Star className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Paket Langganan</div>
                            <h2 className="text-3xl font-serif text-white mb-1">
                                {familyData?.subscription_plan || 'Trial'}
                                <span className="ml-3 inline-block px-3 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Aktif</span>
                            </h2>
                            <p className="text-white/60 text-sm font-medium">
                                {familyStatus === 'trial' 
                                    ? `Masa percobaan Anda mendukung hingga ${trialMaxMembers} anggota.` 
                                    : `Paket ${familyData?.subscription_plan} mendukung hingga ${maxMembers} anggota.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section Title */}
            <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-main)]">
                        <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-h3 font-heading text-[var(--text-main)]">Daftar Anggota</h2>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                         <div key={member.id} className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-[var(--border)] overflow-hidden">
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=10b981&color=ffffff&bold=true&font-size=0.33`} 
                                        className="w-full h-full object-cover"
                                        alt={member.fullName}
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {getRoleBadge(member.role)}
                                    {getBudgetStatus(member.userId)}
                                    {member.isVerified === false && (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">
                                            Pending Verifikasi
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="font-bold text-[18px] text-[var(--text-main)] line-clamp-1">{member.fullName}</h3>
                                <div className="flex items-center gap-2 text-[var(--text-muted)] text-[13px] opacity-70">
                                    <Mail className="w-3.5 h-3.5 opacity-70" />
                                    <span className="line-clamp-1">{member.email}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--border)] flex flex-col mobile:flex-row items-start mobile:items-center justify-between gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider opacity-80">
                                        <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                        {new Date(member.joinedAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </div>
                                    
                                    {member.isVerified === false && (
                                        <button 
                                            onClick={() => {
                                                const inv = invitations.find(i => i.email.toLowerCase() === member.email.toLowerCase());
                                                if (inv) {
                                                    const link = `${window.location.origin}/register?invitation_id=${inv.id}`;
                                                    navigator.clipboard.writeText(link);
                                                    showAlert('Berhasil', "Link pendaftaran anggota berhasil disalin!", 'alert');
                                                }
                                            }}
                                            className="flex items-center gap-1.5 text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline text-left"
                                        >
                                            <Copy className="w-3 h-3" /> Salin Link Daftar
                                        </button>
                                    )}
                                </div>

                                {user?.id !== member.userId && (
                                    <div className="flex items-center gap-2 w-full mobile:w-auto justify-between mobile:justify-end">
                                        {familyRole === 'head_of_family' && (
                                            <select 
                                                className="text-[10px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 border-none rounded-lg px-2 py-1.5 outline-none cursor-pointer text-[var(--text-main)] w-full mobile:max-w-[160px]"
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            >
                                                <option value="member">Anggota</option>
                                                <option value="treasurer">Bendahara</option>
                                                <option value="viewer">Pantau Only</option>
                                            </select>
                                        )}
                                        {familyRole === 'head_of_family' && (
                                            <button 
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invitations Section */}
            {invitations.length > 0 && (
                <div className="pt-8 border-t border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-h3 font-heading text-[var(--text-main)]">Undangan Pending</h2>
                            <p className="text-body-xs text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-black">Menunggu pendaftaran</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingInvitations.map((inv) => (
                            <div key={inv.id} className="bg-[var(--surface-card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm relative group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] opacity-40">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {getRoleBadge(inv.role)}
                                        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-widest rounded-md">Pending</span>
                                    </div>
                                </div>
                                <div className="space-y-1 mb-4">
                                    <h4 className="font-bold text-sm text-[var(--text-main)] truncate">{inv.email}</h4>
                                    <p className="text-[10px] text-[var(--text-muted)] opacity-50 font-bold uppercase tracking-wider">
                                        Dikirim: {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                {familyRole === 'head_of_family' && (
                                    <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                                        <button 
                                            onClick={() => {
                                                setInvitationId(inv.id);
                                                setIsInviteModalOpen(true);
                                            }}
                                            className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/10 transition-all"
                                        >
                                            Lihat Link
                                        </button>
                                        <button 
                                            onClick={() => handleCancelInvitation(inv.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                            title="Batalkan Undangan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
                        setIsInviteModalOpen(false);
                        setInvitationId(null);
                        setInviteEmail('');
                    }} />
                    <div className="bg-[var(--surface-card)] w-full max-w-md max-h-[calc(100vh-40px)] overflow-y-auto rounded-[32px] md:rounded-[40px] p-6 md:p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-[var(--border)] custom-scrollbar">
                        <button 
                            onClick={() => {
                                setIsInviteModalOpen(false);
                                setInvitationId(null);
                                setInviteEmail('');
                            }}
                            className="absolute top-6 right-6 md:top-8 md:right-8 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-20 bg-[var(--surface-card)] rounded-full"
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--primary)]/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-[var(--primary)] mb-6 md:mb-8">
                            <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
                        </div>

                        <h2 className="text-xl md:text-2xl font-serif text-[var(--text-main)] mb-2">Undang Anggota</h2>
                        
                        {!invitationId ? (
                            <>
                                <p className="text-[var(--text-muted)] text-xs md:text-sm mb-6 md:mb-8 leading-relaxed opacity-70">
                                    Masukkan email anggota keluarga yang ingin kamu ajak kolaborasi.
                                </p>

                                <form onSubmit={handleInvite} className="space-y-4 md:space-y-6">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-80 px-4">Alamat Email</label>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="contoh@email.com"
                                            className="w-full h-12 md:h-14 px-6 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none focus:border-[var(--primary)]/30 transition-all font-medium text-sm md:text-[15px] text-[var(--text-main)]"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-80 px-4">Peran (Role)</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full h-12 md:h-14 px-6 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none focus:border-[var(--primary)]/30 transition-all font-medium text-sm md:text-[15px] appearance-none cursor-pointer text-[var(--text-main)]"
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                            >
                                                <option value="member" className="bg-[var(--surface-card)]">Anggota (Input Saja)</option>
                                                <option value="treasurer" className="bg-[var(--surface-card)]">Bendahara (Akses Penuh)</option>
                                                <option value="viewer" className="bg-[var(--surface-card)]">Pantau Only (Read-Only)</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 md:h-16 bg-[var(--primary)] text-white rounded-full font-bold shadow-xl shadow-black/10 hover:opacity-90 transition-all disabled:opacity-70 mt-2 md:mt-4 text-sm md:text-base"
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Undangan'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="p-4 md:p-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[24px] md:rounded-[32px] text-center">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mx-auto mb-3 md:mb-4 text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-[var(--text-main)] mb-1">Undangan Berhasil Dibuat!</p>
                                    <p className="text-[12px] md:text-[13px] text-[var(--text-muted)] opacity-70">Gunakan link di bawah ini jika email tidak terkirim.</p>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-80 px-4">Link Undangan</label>
                                    <div className="relative group">
                                        <input 
                                            readOnly
                                            value={`${window.location.origin}/register?invitation_id=${invitationId}`}
                                            className="w-full h-12 md:h-14 pl-6 pr-14 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border)] outline-none font-medium text-[12px] md:text-[13px] text-[var(--text-muted)] truncate"
                                        />
                                        <button 
                                            onClick={copyInviteLink}
                                            className="absolute right-1.5 top-1.5 w-9 h-9 md:w-11 md:h-11 bg-[var(--surface-card)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <button 
                                        onClick={shareWhatsApp}
                                        className="h-12 md:h-14 bg-[#25D366] text-white rounded-full font-bold text-[12px] md:text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#25D366]/20"
                                    >
                                        <MessageCircle className="w-4 h-4" /> <span className="hidden xs:inline">WhatsApp</span><span className="xs:hidden">WA</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const link = `${window.location.origin}/register?invitation_id=${invitationId}`;
                                            window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, '_blank');
                                        }}
                                        className="h-12 md:h-14 bg-[#0088cc] text-white rounded-full font-bold text-[12px] md:text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#0088cc]/20"
                                    >
                                        <ExternalLink className="w-4 h-4" /> <span className="hidden xs:inline">Telegram</span><span className="xs:hidden">TG</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={() => {
                                        setIsInviteModalOpen(false);
                                        setInvitationId(null);
                                        setInviteEmail('');
                                    }}
                                    className="w-full h-14 md:h-16 border-2 border-[var(--border)] text-[var(--text-muted)] rounded-full font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all mt-2 md:mt-4 text-sm"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
