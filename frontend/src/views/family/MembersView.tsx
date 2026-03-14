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
    AlertCircle
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FinanceController } from '../../controllers/FinanceController';
import api, { getStorageUrl } from '../../services/api';

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
        <div className={`p-6 rounded-[32px] ${isTrial ? 'bg-dagang-green/5 border-dagang-green/10' : 'bg-dagang-accent/5 border-dagang-accent/10'} border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-700`}>
             <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 ${isTrial ? 'bg-dagang-green' : 'bg-dagang-accent'} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                    {isTrial ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                    <div className="text-[14px] font-bold text-dagang-dark">
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
                        <div className={`flex flex-col items-center min-w-[60px] p-2 rounded-2xl bg-white/50 border border-black/5`}>
                            <span className={`text-[18px] font-black ${isTrial ? 'text-dagang-green' : 'text-dagang-accent'} tabular-nums`}>
                                {String(t.val).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] font-black text-dagang-gray/60 tracking-widest">{t.unit}</span>
                        </div>
                        {i < 3 && <span className={`text-[18px] font-black ${isTrial ? 'text-dagang-green/20' : 'text-dagang-accent/20'}`}>:</span>}
                    </React.Fragment>
                ))}
            </div>
            
            {/* Background Decoration */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 ${isTrial ? 'bg-dagang-green/5' : 'bg-dagang-accent/5'} rounded-full blur-2xl`} />
        </div>
    );
};

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'head_of_family':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-dagang-dark text-dagang-accent text-[10px] font-black uppercase tracking-widest rounded-full border border-dagang-accent/20 ring-2 ring-dagang-accent/10">
                    <Home className="w-3 h-3" /> Kepala Keluarga
                </span>
            );
        case 'treasurer':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-dagang-green/10 text-dagang-green text-[10px] font-black uppercase tracking-widest rounded-full border border-dagang-green/20">
                    <Shield className="w-3 h-3" /> Bendahara Utama
                </span>
            );
        case 'member':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    <User className="w-3 h-3" /> Anggota
                </span>
            );
        case 'viewer':
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-dagang-gray/10 text-dagang-gray text-[10px] font-black uppercase tracking-widest rounded-full border border-black/5">
                    <Eye className="w-3 h-3" /> Pantau Only
                </span>
            );
        default:
            return null;
    }
};

export const MembersView: React.FC = () => {
    const { user, refreshDashboard, familyRole } = useOutletContext<any>();
    const navigate = useNavigate();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitationId, setInvitationId] = useState<string | null>(null);

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
            await Promise.all([
                fetchMembers(),
                fetchFamilyProfile(),
                fetchPublicSettings()
            ]);
            setLoading(false);
        };
        init();
    }, []);


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
                alert("Gagal memproses gambar");
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
            alert("Profil keluarga berhasil diperbarui!");
            setPhotoFile(null);
            fetchFamilyProfile();
            refreshDashboard();
        } catch (error) {
            alert("Gagal memperbarui profil keluarga");
        } finally {
            setIsSavingFamily(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus foto keluarga?")) return;
        try {
            await api.delete('/finance/families/profile/photo');
            setFamilyPhoto(null);
            setPhotoFile(null);
            alert("Foto keluarga berhasil dihapus!");
            fetchFamilyProfile();
            refreshDashboard();
        } catch (error) {
            alert("Gagal menghapus foto keluarga");
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const effectiveMax = familyStatus === 'trial' ? trialMaxMembers : maxMembers;

        if (memberCount + invitationCount >= effectiveMax) {
            alert("Limit anggota tercapai. Silakan hapus anggota atau upgrade paket.");
            return;
        }
        setIsSubmitting(true);
        try {
            const data = await FinanceController.inviteMember(inviteEmail, inviteRole);
            setInvitationId(data.invitation_id);
            fetchFamilyProfile();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Gagal mengirim undangan.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyInviteLink = () => {
        if (!invitationId) return;
        const link = `${window.location.origin}/register?invitation_id=${invitationId}`;
        navigator.clipboard.writeText(link);
        alert("Link undangan berhasil disalin!");
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
            alert("Gagal memperbarui peran anggota");
        }
    };

    const handleRemoveMember = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus anggota ini dari keluarga?")) return;
        try {
            await FinanceController.removeMember(id);
            fetchMembers();
        } catch (error) {
            alert("Gagal menghapus anggota");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
            <p className="text-sm font-bold text-dagang-dark/40 tracking-widest uppercase">Memuat Ruang Keluarga...</p>
        </div>
    );

    const effectiveMax = familyStatus === 'trial' ? trialMaxMembers : maxMembers;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-h2 font-heading text-dagang-dark">Ruang Keluarga</h1>
                    <p className="text-body-s text-dagang-gray mt-1">Kelola nama, foto, dan akses anggota keluarga Anda.</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        disabled={memberCount + invitationCount >= effectiveMax}
                        className={`bg-dagang-dark text-white px-6 py-3 rounded-[20px] font-bold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-dagang-dark/10 ${(memberCount + invitationCount >= effectiveMax) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                        <UserPlus className="w-4 h-4" /> 
                        Undang Anggota
                    </button>
                    {(memberCount + invitationCount >= effectiveMax) && (
                        <div className="flex flex-col items-end gap-1.5">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2">
                                {familyStatus === 'trial' ? `Trial: Slot Terbatas (Max ${trialMaxMembers})` : 'Slot Penuh: Upgrade paket Anda'}
                            </p>
                            <a href="#pricing-section" className="text-[10px] font-bold text-white bg-dagang-accent px-4 py-1.5 rounded-full hover:bg-amber-600 transition-colors shadow-sm inline-flex items-center gap-1.5">
                                🚀 Upgrade Akun
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Countdown */}
            {familyData && <SubscriptionCountdown family={familyData} />}

            {/* Family Profile Card */}
            <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[32px] bg-dagang-gray/5 border-2 border-dashed border-black/10 flex items-center justify-center overflow-hidden">
                        {familyPhoto ? (
                            <img 
                                src={familyPhoto.startsWith('blob:') ? familyPhoto : getStorageUrl(familyPhoto)} 
                                className="w-full h-full object-cover" 
                                alt="Family Profile"
                            />
                        ) : (
                            <Home className="w-12 h-12 text-dagang-gray/20" />
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                        {familyRole === 'head_of_family' && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 bg-dagang-dark text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-black transition-all"
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
                        <label className="text-[11px] font-black uppercase tracking-widest text-dagang-gray">Nama Keluarga</label>
                        <input 
                            type="text" 
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            disabled={familyRole !== 'head_of_family'}
                            className={`w-full h-14 px-6 rounded-2xl bg-dagang-gray/5 border border-black/5 outline-none focus:ring-2 focus:ring-dagang-green/20 transition-all font-bold text-lg ${familyRole !== 'head_of_family' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="Contoh: Keluarga Stark"
                        />
                    </div>
                    {familyRole === 'head_of_family' && (
                        <button 
                            onClick={handleUpdateFamily}
                            disabled={isSavingFamily}
                            className="flex items-center gap-2 px-8 py-3.5 bg-dagang-green text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-dagang-green-light transition-all shadow-lg shadow-dagang-green/10 disabled:opacity-50"
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
                
                <div className="hidden lg:block w-px h-24 bg-black/5" />
                
                <div className="hidden lg:flex flex-col items-center gap-2 px-8">
                    <div className="text-3xl font-serif text-dagang-dark">
                        {memberCount} / {effectiveMax}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-dagang-gray">Slot Anggota Terisi</div>
                    {invitationCount > 0 && (
                        <div className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                            + {invitationCount} Undangan Pending
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Status & Upgrade CTA */}
            <div className="bg-white p-8 md:p-12 rounded-[48px] border border-black/5 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-dagang-green/5 blur-3xl rounded-full -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[32px] bg-dagang-dark text-dagang-accent flex items-center justify-center">
                            <Star className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-dagang-gray uppercase tracking-[0.2em] mb-2">Paket Langganan</div>
                            <h2 className="text-3xl font-serif text-dagang-dark mb-1">
                                {familyData?.subscription_plan || 'Trial'}
                                <span className="ml-3 inline-block px-3 py-1 bg-dagang-green/10 text-dagang-green text-[10px] font-black uppercase tracking-widest rounded-full">Aktif</span>
                            </h2>
                            <p className="text-dagang-gray text-sm">
                                {familyStatus === 'trial' 
                                    ? `Masa percobaan Anda mendukung hingga ${trialMaxMembers} anggota.` 
                                    : `Paket ${familyData?.subscription_plan} mendukung hingga ${maxMembers} anggota.`}
                            </p>
                        </div>
                    </div>

                    {familyRole === 'head_of_family' && (
                        <button 
                            onClick={handleUpgradePlan}
                            className="bg-dagang-dark text-white px-10 h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.15em] hover:bg-black transition-all shadow-xl shadow-dagang-dark/10 flex items-center gap-3 group"
                        >
                            {familyStatus === 'trial' ? 'Upgrade Sekarang' : 'Perpanjang / Ganti Paket'}
                            <ArrowUpCircle className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Members Section Title */}
            <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-dagang-gray/5 flex items-center justify-center text-dagang-dark">
                        <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-h3 font-heading text-dagang-dark">Daftar Anggota</h2>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                         <div key={member.id} className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-dagang-gray/5 rounded-2xl flex items-center justify-center border border-black/5 overflow-hidden">
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=f8f9fa&color=121212&bold=true&font-size=0.33`} 
                                        className="w-full h-full object-cover"
                                        alt={member.full_name}
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {getRoleBadge(member.role)}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="font-bold text-[18px] text-dagang-dark line-clamp-1">{member.full_name}</h3>
                                <div className="flex items-center gap-2 text-dagang-gray text-[13px]">
                                    <Mail className="w-3.5 h-3.5 opacity-50" />
                                    <span className="line-clamp-1">{member.email}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-dagang-gray text-[11px] font-bold uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5 opacity-40" />
                                    {new Date(member.joined_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                </div>

                                {user?.id !== member.user_id && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {familyRole === 'head_of_family' && (
                                            <select 
                                                className="text-[11px] font-black uppercase tracking-widest bg-dagang-gray/5 border-none rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-dagang-gray/10"
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            >
                                                <option value="head_of_family">Kepala Keluarga</option>
                                                <option value="treasurer">Bendahara</option>
                                                <option value="member">Anggota</option>
                                                <option value="viewer">Pantau</option>
                                            </select>
                                        )}
                                        {familyRole === 'head_of_family' && (
                                            <button 
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-dagang-dark/40 backdrop-blur-sm" onClick={() => {
                        setIsInviteModalOpen(false);
                        setInvitationId(null);
                        setInviteEmail('');
                    }} />
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => {
                                setIsInviteModalOpen(false);
                                setInvitationId(null);
                                setInviteEmail('');
                            }}
                            className="absolute top-8 right-8 p-2 text-dagang-gray hover:text-dagang-dark transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-16 h-16 bg-dagang-green/10 rounded-3xl flex items-center justify-center text-dagang-green mb-8">
                            <UserPlus className="w-8 h-8" />
                        </div>

                        <h2 className="text-2xl font-serif text-dagang-dark mb-2">Undang Anggota</h2>
                        
                        {!invitationId ? (
                            <>
                                <p className="text-dagang-gray text-sm mb-8 leading-relaxed">
                                    Masukkan email anggota keluarga yang ingin kamu ajak kolaborasi.
                                </p>

                                <form onSubmit={handleInvite} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dagang-gray/60 px-4">Alamat Email</label>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="contoh@email.com"
                                            className="w-full h-14 px-6 rounded-full bg-dagang-gray/5 border border-black/5 outline-none focus:border-dagang-green/30 transition-all font-medium text-[15px]"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dagang-gray/60 px-4">Peran (Role)</label>
                                        <select 
                                            className="w-full h-14 px-6 rounded-full bg-dagang-gray/5 border border-black/5 outline-none focus:border-dagang-green/30 transition-all font-medium text-[15px] appearance-none cursor-pointer"
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                        >
                                            <option value="member">Anggota (Input Saja)</option>
                                            <option value="treasurer">Bendahara (Akses Penuh)</option>
                                            <option value="viewer">Pantau Only (Read-Only)</option>
                                        </select>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 bg-dagang-dark text-white rounded-full font-bold shadow-xl shadow-dagang-dark/10 hover:bg-black transition-all disabled:opacity-50 mt-4"
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Undangan'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="p-6 bg-dagang-green/5 border border-dagang-green/20 rounded-[32px] text-center">
                                    <div className="w-12 h-12 bg-dagang-green/10 rounded-full flex items-center justify-center text-dagang-green mx-auto mb-4">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-dagang-dark mb-1">Undangan Berhasil Dibuat!</p>
                                    <p className="text-[13px] text-dagang-gray">Gunakan link di bawah ini jika email tidak terkirim.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dagang-gray/60 px-4">Link Undangan</label>
                                    <div className="relative group">
                                        <input 
                                            readOnly
                                            value={`${window.location.origin}/register?invitation_id=${invitationId}`}
                                            className="w-full h-14 pl-6 pr-14 rounded-full bg-dagang-gray/5 border border-black/5 outline-none font-medium text-[13px] text-dagang-gray truncate"
                                        />
                                        <button 
                                            onClick={copyInviteLink}
                                            className="absolute right-2 top-2 w-10 h-10 bg-white border border-black/5 rounded-full flex items-center justify-center text-dagang-dark hover:bg-dagang-dark hover:text-white transition-all shadow-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={shareWhatsApp}
                                        className="h-14 bg-[#25D366] text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#25D366]/20"
                                    >
                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const link = `${window.location.origin}/register?invitation_id=${invitationId}`;
                                            window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, '_blank');
                                        }}
                                        className="h-14 bg-[#0088cc] text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#0088cc]/20"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Telegram
                                    </button>
                                </div>

                                <button 
                                    onClick={() => {
                                        setIsInviteModalOpen(false);
                                        setInvitationId(null);
                                        setInviteEmail('');
                                    }}
                                    className="w-full h-16 border-2 border-black/5 text-dagang-gray rounded-full font-bold hover:bg-black/5 transition-all mt-4"
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
