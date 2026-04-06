import React, { useState } from 'react';
import {
    Plus,
    TrendingUp,
    X,
    Edit3,
    Trash2,
    Award,
    ArrowRightCircle,
    Landmark,
    History,
    Calendar,
    User
} from 'lucide-react';
import { useModal } from '../../providers/ModalProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, parseRupiah } from '../../utils/formatters';

interface GoalsViewProps {
    goals: any[];
    wallets: any[];
    familyRole: string; // Added familyRole
    handleCreateGoal: (goal: any) => void;
    handleUpdateGoal: (goal: any) => void;
    handleDeleteGoal: (id: string) => void;
    handleConvertToAsset: (goalId: string, assetType: string) => void;
    currentUserId: string; // Added currentUserId
    handleFundGoal: (goalId: string, walletId: string, amount: number) => Promise<void>;
    handleGetGoalHistory: (goalId: string) => Promise<any[]>;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
    goals,
    wallets,
    familyRole,
    currentUserId: contextUserId, // Map to contextUserId
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleConvertToAsset,
    handleFundGoal,
    handleGetGoalHistory
}) => {
    const canManageGoals = familyRole !== 'viewer';
    const canFundGoals = familyRole !== 'viewer'; // members can fund
    const { showAlert, showConfirm } = useModal();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any>(null);
    const [editGoalId, setEditGoalId] = useState<string | null>(null);
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [goalHistory, setGoalHistory] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState(0);
    const [category, setCategory] = useState('');
    const [emoji, setEmoji] = useState('🎯');
    const [priority, setPriority] = useState('medium');
    const [assetType, setAssetType] = useState('fixed');

    // Fund States
    const [fundAmount, setFundAmount] = useState(0);
    const [selectedWalletId, setSelectedWalletId] = useState('');

    // Fix: Always filter wallets by current user's ID for goal funding actions
    const filteredWallets = wallets.filter((w: any) => w.userId === contextUserId);

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (goal: any) => {
        setEditGoalId(goal.id);
        setName(goal.name);
        setTargetAmount(goal.targetAmount);
        setCategory(goal.category || '');
        setEmoji(goal.emoji || '🎯');
        setPriority(goal.priority || 'medium');
        setIsModalOpen(true);
    };

    const openConvertModal = (goal: any) => {
        setSelectedGoal(goal);
        setIsConvertModalOpen(true);
    };

    const openFundModal = (goal: any) => {
        setSelectedGoal(goal);
        setFundAmount(0);
        setSelectedWalletId(filteredWallets[0]?.id || '');
        setIsFundModalOpen(true);
    };

    const openHistoryModal = async (goal: any) => {
        setSelectedGoal(goal);
        setIsHistoryModalOpen(true);
        setIsLoadingHistory(true);
        try {
            const history = await handleGetGoalHistory(goal.id);
            setGoalHistory(history);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const resetForm = () => {
        setName('');
        setTargetAmount(0);
        setCategory('');
        setEmoji('🎯');
        setPriority('medium');
        setEditGoalId(null);
        setIsModalOpen(false);
        setIsConvertModalOpen(false);
        setIsFundModalOpen(false);
        setIsHistoryModalOpen(false);
        setSelectedGoal(null);
        setIsSubmitting(false);
        setGoalHistory([]);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || targetAmount <= 0) {
            showAlert('Validasi', 'Nama dan Target Amount harus diisi dengan benar', 'warning');
            return;
        }

        const payload = {
            id: editGoalId,
            name,
            targetAmount,
            category,
            emoji,
            priority
        };

        if (editGoalId) {
            handleUpdateGoal(payload);
        } else {
            handleCreateGoal(payload);
        }
        resetForm();
    };

    const handleConvertAction = () => {
        if (!selectedGoal) return;
        handleConvertToAsset(selectedGoal.id, assetType);
        resetForm();
        showAlert('Sukses', 'Goal berhasil dikonversi menjadi Aset!', 'alert');
    };

    const handleFundAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal || !selectedWalletId || fundAmount <= 0) {
            showAlert('Validasi', 'Pilih dompet dan masukkan jumlah yang valid', 'warning');
            return;
        }

        const wallet = filteredWallets.find(w => w.id === selectedWalletId);
        if (wallet && wallet.balance < fundAmount) {
            showAlert('Saldo Tidak Cukup', `Saldo ${wallet.name} tidak mencukupi`, 'danger');
            return;
        }

        const remainingTarget = selectedGoal.targetAmount - selectedGoal.currentBalance;
        if (fundAmount > remainingTarget) {
            showAlert('Batas Alokasi', `Nominal melebihi sisa target goal (Maks: Rp ${remainingTarget.toLocaleString('id-ID')})`, 'warning');
            return;
        }

        try {
            setIsSubmitting(true);
            await handleFundGoal(selectedGoal.id, selectedWalletId, fundAmount);
            resetForm();
            showAlert('Sukses', 'Dana berhasil dialokasikan!', 'alert');
        } catch (error: any) {
            // Error handled by Parent (FamilyDashboard) via showAlert
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: string) => {
        showConfirm('Hapus Goal', 'Apakah Anda yakin ingin menghapus goal ini? Seluruh progress akan hilang.', () => {
            handleDeleteGoal(id);
        }, 'danger');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-h2 font-heading text-[var(--text-main)]">Gapai Impian Anda</h2>
                    <p className="text-body-s text-[var(--text-muted)] opacity-50 mt-1">Rencanakan masa depan dan pantau progress pencapaian target finansial keluarga.</p>
                </div>
                {canManageGoals && !isModalOpen && !isConvertModalOpen && (
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Tambah Goal
                    </button>
                )}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = Math.min(100, (goal.currentBalance / goal.targetAmount) * 100);
                    const isAchieved = progress >= 100 && goal.status !== 'converted';
                    const isConverted = goal.status === 'converted';

                    return (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-[var(--surface-card)] rounded-[32px] p-8 border border-[var(--border)] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${isConverted ? 'opacity-60' : ''}`}
                        >
                            {isConverted && (
                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
                                    <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-full shadow-lg border border-[var(--border)] flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Telah Menjadi Aset</span>
                                    </div>
                                </div>
                            )}

                            {goal.priority && (
                                <div className={`absolute top-8 left-8 z-20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                    goal.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    goal.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                    {goal.priority}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                                    {goal.emoji || '🎯'}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openHistoryModal(goal)} className="p-2 text-[var(--text-muted)] hover:text-blue-500 bg-black/5 dark:bg-white/5 rounded-lg" title="Riwayat Transaksi">
                                        <History className="w-4 h-4" />
                                    </button>
                                    {!isConverted && (
                                        <>
                                            {(goal.userId === contextUserId && familyRole !== 'viewer') && (
                                                <button 
                                                    onClick={() => openEditModal(goal)} 
                                                    className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] bg-black/5 dark:bg-white/5 rounded-lg transition-all" 
                                                    title="Ubah Goal"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(goal.userId === contextUserId && familyRole !== 'viewer') && (
                                                <button 
                                                    onClick={() => confirmDelete(goal.id)} 
                                                    className="p-2 text-[var(--text-muted)] hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-lg transition-all" 
                                                    title="Hapus Goal"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-8">
                                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{goal.category || 'Financial Goal'}</div>
                                <h3 className="text-xl font-bold text-[var(--text-main)]">{goal.name}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-widest">Terkumpul</div>
                                        <div className="text-xl font-serif text-[var(--primary)] font-bold">Rp {goal.currentBalance.toLocaleString('id-ID')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest">Target</div>
                                        <div className="text-sm font-bold opacity-90">Rp {goal.targetAmount.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>

                                <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full rounded-full ${progress >= 100 ? 'bg-amber-500' : 'bg-[var(--primary)]'} shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]`}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                {canFundGoals && !isConverted && !isAchieved && (
                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={() => openFundModal(goal)}
                                        className="w-full mt-4 py-3 bg-[var(--primary)] text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                                    >
                                        <Plus className="w-4 h-4" /> Isi dari Dompet
                                    </motion.button>
                                )}

                                {(goal.userId === contextUserId && familyRole !== 'viewer') && !isConverted && isAchieved && (
                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={() => openConvertModal(goal)}
                                        className="w-full mt-4 py-3 bg-amber-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        <ArrowRightCircle className="w-4 h-4" /> Konversi ke Aset
                                    </motion.button>
                                )}

                                {(goal.userId !== contextUserId) && !isConverted && isAchieved && (
                                    <div className="w-full mt-4 py-3 bg-dagang-green/10 text-dagang-green rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-dagang-green/20">
                                        <Award className="w-4 h-4" /> Goal Tercapai
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {goals.length === 0 && (
                     <div className="col-span-full py-20 bg-[var(--surface-card)] rounded-[40px] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-3xl">🎯</div>
                        <h3 className="text-xl font-bold mb-2">Mulai Rencanakan Goals Anda</h3>
                        <p className="text-[var(--text-muted)] max-w-sm mb-8">Anda belum memiliki goal aktif. Buat goal pertama untuk memantau progress impian Anda.</p>
                        <button onClick={openCreateModal} className="flex items-center gap-2 px-8 py-4 bg-[var(--primary)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-all">
                            <Plus className="w-5 h-5" /> Buat Goal Sekarang
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--surface-card)] rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative border border-[var(--border)] overflow-y-auto max-h-[90vh]"
                        >
                            <button onClick={resetForm} className="absolute right-8 top-8 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>

                            <h3 className="text-2xl font-serif mb-2 text-[var(--text-main)]">{editGoalId ? 'Edit Goal' : 'Tambah Goal Baru'}</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-10">Tentukan target dan kumpulkan dana untuk impian Anda.</p>

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Apa Goal Anda?</label>
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={emoji}
                                                onChange={(e) => setEmoji(e.target.value)}
                                                className="w-16 px-4 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl text-center text-2xl"
                                                maxLength={2}
                                            />
                                            <div className="text-[8px] absolute -bottom-5 left-0 right-0 text-center opacity-60">EMOJI</div>
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="cth. Tabungan Laptop Baru"
                                            className="flex-1 px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-bold text-[16px] text-[var(--text-main)]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Target Dana (Rp)</label>
                                    <input
                                        type="text"
                                        value={formatRupiah(targetAmount) || ''}
                                        onChange={(e) => setTargetAmount(parseRupiah(e.target.value))}
                                        className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-black text-2xl text-[var(--primary)]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Kategori</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="cth. Elektronik, Liburan, Pendidikan"
                                        className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-bold text-[var(--text-main)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Prioritas</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['low', 'medium', 'high'].map(prio => (
                                            <button
                                                key={prio}
                                                type="button"
                                                onClick={() => setPriority(prio)}
                                                className={`py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    priority === prio 
                                                    ? (prio === 'high' ? 'border-red-500 bg-red-500 text-white' : 
                                                       prio === 'medium' ? 'border-amber-500 bg-amber-500 text-white' : 
                                                       'border-blue-500 bg-blue-500 text-white')
                                                    : 'border-transparent bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:bg-black/10'
                                                }`}
                                            >
                                                {prio}
                                            </button>
                                        )) }
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-[var(--primary)] text-white rounded-[24px] font-black text-[15px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-[var(--primary)]/30 mt-4">
                                    {editGoalId ? 'Simpan Perubahan' : 'Luncurkan Goal'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Convert Modal */}
            <AnimatePresence>
                {isConvertModalOpen && selectedGoal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--surface-card)] rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative border border-[var(--border)]"
                        >
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
                                    <Award className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-serif mb-2 text-[var(--text-main)]">Selamat! Goal Tercapai</h3>
                                <p className="text-sm text-[var(--text-muted)]">"{selectedGoal.name}" telah mencapai target. Konversi sekarang menjadi Aset keluarga Anda.</p>
                            </div>

                            <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl mb-8 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Nilai Aset</div>
                                    <div className="text-xl font-bold font-serif text-amber-600">Rp {selectedGoal.targetAmount.toLocaleString('id-ID')}</div>
                                </div>
                                <div className="text-4xl">{selectedGoal.emoji}</div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2 block">Pilih Tipe Aset</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setAssetType('liquid')}
                                            className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${assetType === 'liquid' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-transparent bg-black/5 dark:bg-white/5'}`}
                                        >
                                            <TrendingUp className={`w-6 h-6 ${assetType === 'liquid' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                                            <span className="text-xs font-bold text-[var(--text-main)]">Aset Likuid</span>
                                        </button>
                                        <button
                                            onClick={() => setAssetType('fixed')}
                                            className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${assetType === 'fixed' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-transparent bg-black/5 dark:bg-white/5'}`}
                                        >
                                            <Landmark className={`w-6 h-6 ${assetType === 'fixed' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                                            <span className="text-xs font-bold text-[var(--text-main)]">Aset Tetap</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={resetForm} className="flex-1 py-5 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] rounded-[24px] font-bold text-[14px]">
                                        Batal
                                    </button>
                                    <button onClick={handleConvertAction} className="flex-[2] py-5 bg-amber-500 text-white rounded-[24px] font-black text-[15px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20">
                                        Konversi Sekarang
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fund Modal */}
            <AnimatePresence>
                {isFundModalOpen && selectedGoal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--surface-card)] rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative border border-[var(--border)] overflow-y-auto max-h-[90vh]"
                        >
                            <button onClick={resetForm} className="absolute right-8 top-8 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>

                            <h3 className="text-2xl font-serif mb-2 text-[var(--text-main)]">Isi Saldo Goal</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-10">Alokasikan dana dari dompet Anda untuk mencapai target "{selectedGoal.name}".</p>

                            <form onSubmit={handleFundAction} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Pilih Dompet Sumber</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {filteredWallets.map(wallet => (
                                            <button
                                                key={wallet.id}
                                                type="button"
                                                onClick={() => setSelectedWalletId(wallet.id)}
                                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedWalletId === wallet.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center font-bold">
                                                        {wallet.name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-xs font-bold text-[var(--text-main)]">{wallet.name}</div>
                                                        <div className="text-[10px] text-[var(--text-muted)] opacity-60 uppercase tracking-widest">{wallet.walletType}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-[var(--text-main)]">Rp {wallet.balance.toLocaleString('id-ID')}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Jumlah Dana (Rp)</label>
                                    <input
                                        type="text"
                                        value={formatRupiah(fundAmount) || ''}
                                        onChange={(e) => setFundAmount(parseRupiah(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-5 py-5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none font-black text-2xl text-[var(--primary)]"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-[var(--primary)] text-white rounded-[24px] font-black text-[15px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-[var(--primary)]/30 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Memproses...' : 'Alokasikan Dana'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && selectedGoal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--surface-card)] rounded-[40px] w-full max-w-2xl p-10 shadow-2xl relative border border-[var(--border)] overflow-y-auto max-h-[90vh]"
                        >
                            <button onClick={resetForm} className="absolute right-8 top-8 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-3xl">
                                    {selectedGoal.emoji}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif text-[var(--text-main)]">Riwayat Transaksi</h3>
                                    <p className="text-sm text-[var(--text-muted)]">{selectedGoal.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {isLoadingHistory ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                                        <p className="text-xs font-black uppercase tracking-widest opacity-50">Memuat Riwayat...</p>
                                    </div>
                                ) : goalHistory.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <p className="text-[var(--text-muted)] italic">Belum ada transaksi untuk goal ini.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {goalHistory.map((tx) => (
                                            <div key={tx.id} className="p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] group hover:bg-[var(--primary)]/5 transition-all">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center">
                                                            <TrendingUp className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[var(--text-main)]">{tx.description || 'Alokasi Dana'}</div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                                                                    <User className="w-3 h-3" />
                                                                    {tx.user?.full_name || 'User'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-[var(--primary)]">+ Rp {tx.amount.toLocaleString('id-ID')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={resetForm} className="w-full mt-10 py-5 bg-black/5 dark:bg-white/5 text-[var(--text-main)] rounded-[24px] font-bold text-[15px] hover:bg-black/10 transition-all">
                                Tutup
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
