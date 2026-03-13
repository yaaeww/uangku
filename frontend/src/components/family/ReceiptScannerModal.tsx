import React, { useState, useRef } from 'react';
import {
    Camera,
    X,
    Sparkles,
    Check,
    Loader2,
    Users,
    MessageCircle,
    ArrowLeft,
    ShoppingCart,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';

interface ReceiptScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyMembers: any[];
    onConfirm: (transactions: any[]) => void;
    wallets: any[];
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
    isOpen,
    onClose,
    familyMembers,
    onConfirm,
    wallets
}) => {
    const [step, setStep] = useState<'upload' | 'scanning' | 'review' | 'split'>('upload');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [selections, setSelections] = useState<{ [key: number]: string[] }>({}); // Item index -> User IDs
    const fileInputRef = useRef<HTMLInputElement>(null);

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('Canvas context not found');

                    // Resize if too large (optional but good for performance)
                    const MAX_WIDTH = 1200;
                    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject('Conversion failed');
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
                const webpFile = new File([webpBlob], "receipt.webp", { type: "image/webp" });
                setPreviewUrl(URL.createObjectURL(webpFile));
                handleStartScan(webpFile);
            } catch (error) {
                console.error("WebP conversion failed:", error);
                // Fallback to original file
                setPreviewUrl(URL.createObjectURL(file));
                handleStartScan(file);
            }
        }
    };

    const handleStartScan = async (file: File) => {
        setStep('scanning');
        
        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const response = await api.post('/finance/transactions/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data;
            setParsedData(data);
            
            // Initialize selections (default: empty)
            const initialSelections: any = {};
            data.items.forEach((_: any, idx: number) => {
                initialSelections[idx] = [];
            });
            setSelections(initialSelections);
            
            setStep('review');
        } catch (error) {
            alert('Gagal memproses struk. Coba lagi.');
            setStep('upload');
        }
    };

    const toggleMemberSelection = (itemIdx: number, memberId: string) => {
        setSelections(prev => {
            const current = prev[itemIdx] || [];
            if (current.includes(memberId)) {
                return { ...prev, [itemIdx]: current.filter(id => id !== memberId) };
            } else {
                return { ...prev, [itemIdx]: [...current, memberId] };
            }
        });
    };

    const handleSendWhatsApp = () => {
        // Generate bill summary for each member
        const bills: { [key: string]: { name: string, phone: string, items: any[], total: number } } = {};
        
        Object.entries(selections).forEach(([itemIdx, memberIds]) => {
            const idx = parseInt(itemIdx);
            const item = parsedData.items[idx];
            const amountPerPerson = item.total / memberIds.length;

            memberIds.forEach(mId => {
                const member = familyMembers.find(m => m.user.id === mId);
                if (!member) return;

                if (!bills[mId]) {
                    bills[mId] = { 
                        name: member.user.full_name, 
                        phone: member.user.phone || '', 
                        items: [], 
                        total: 0 
                    };
                }
                bills[mId].items.push({ name: item.name, amount: amountPerPerson });
                bills[mId].total += amountPerPerson;
            });
        });

        // For demo, we'll just open the first one or alert the summary
        const billList = Object.values(bills);
        if (billList.length === 0) {
            alert("Belum ada item yang ditandai untuk anggota keluarga.");
            return;
        }

        const firstBill = billList[0];
        if (!firstBill) {
            alert("Belum ada tagihan yang bisa dibuat.");
            return;
        }

        let message = `Halo ${firstBill.name}, ini rincian belanja di ${parsedData.merchant}:\n\n`;
        firstBill.items.forEach(item => {
            message += `- ${item.name}: Rp ${item.amount.toLocaleString()}\n`;
        });
        message += `\n*TOTAL: Rp ${firstBill.total.toLocaleString()}*\n\nSilakan transfer ke Bendahara ya!`;

        const encodedMsg = encodeURIComponent(message);
        // If phone exists, use it, otherwise just show message
        window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    };

    const handleFinalConfirm = () => {
        // Convert to transactions
        const transactions = parsedData.items.map((item: any) => ({
            description: `${parsedData.merchant}: ${item.name}`,
            amount: item.total,
            category: item.category || 'Lainnya',
            date: parsedData.date || new Date().toISOString(),
            type: 'expense',
            walletId: wallets[0]?.id || ''
        }));
        onConfirm(transactions);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dagang-dark/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#F9FAFB] w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[32px] mobile:rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                
                {/* Header */}
                <div className="px-6 mobile:px-8 py-5 mobile:py-6 border-b border-black/5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        {step !== 'upload' && step !== 'scanning' && (
                            <button onClick={() => setStep(step === 'split' ? 'review' : 'upload')} className="p-2 hover:bg-dagang-cream rounded-xl transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h3 className="text-h4 mobile:text-h3 font-heading text-dagang-dark">Scanner Struk AI</h3>
                            <p className="text-label text-dagang-gray font-bold uppercase tracking-widest opacity-40">
                                {step === 'upload' ? 'Upload Struk' : step === 'scanning' ? 'Memproses AI' : step === 'review' ? 'Review Item' : 'Split Bill Cerdas'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-dagang-cream/50 rounded-2xl hover:bg-dagang-cream transition-all">
                        <X className="w-5 h-5 text-dagang-gray" />
                    </button>
                </div>

                <div className="p-6 mobile:p-8">
                    {step === 'upload' && (
                        <div className="space-y-8">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-4 border-dashed border-dagang-green/10 rounded-[40px] p-16 text-center hover:border-dagang-green/30 hover:bg-dagang-green/5 transition-all cursor-pointer group"
                            >
                                <div className="w-24 h-24 bg-dagang-green-pale text-dagang-green rounded-[32px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-dagang-green/5">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <h4 className="text-h3 mobile:text-h2 font-heading text-dagang-dark mb-2">Ambil Foto atau Upload</h4>
                                <p className="text-body-m text-dagang-gray max-w-[300px] mx-auto leading-relaxed">AI akan mengenali Alfamart, Indomaret, SPBU, dan struk lainnya secara otomatis.</p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white border border-black/5 rounded-3xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="text-[13px] font-bold">Auto-Kategori<br/><span className="text-[11px] text-dagang-gray font-normal">Belanjaan langsung dikelompokkan.</span></div>
                                </div>
                                <div className="p-6 bg-white border border-black/5 rounded-3xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-[13px] font-bold">Split Bill Cerdas<br/><span className="text-[11px] text-dagang-gray font-normal">Patungan jadi lebih mudah.</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 border-4 border-dagang-green/20 rounded-full animate-ping" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-16 h-16 text-dagang-green animate-spin" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-dagang-dark">Menganalisa Struk...</h4>
                                <p className="text-dagang-gray mt-2">AI sedang membaca item dan harga belanjaan Anda.</p>
                            </div>
                            {previewUrl && (
                                <img src={previewUrl} className="w-48 h-64 object-cover mx-auto rounded-2xl shadow-xl grayscale opacity-50 border-4 border-white" alt="Scan Preview" />
                            )}
                        </div>
                    )}

                    {step === 'review' && parsedData && (
                        <div className="space-y-6">
                            <div className="bg-dagang-green text-white p-8 rounded-[32px] shadow-xl shadow-dagang-green/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShoppingCart className="w-32 h-32 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-label font-bold uppercase tracking-[0.2em] opacity-60 mb-1">{parsedData.merchant}</div>
                                    <div className="text-h1 mobile:text-display-m font-heading">Rp {parsedData.total.toLocaleString()}</div>
                                    <div className="text-label opacity-70 mt-2 font-bold">{new Date(parsedData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-dagang-gray opacity-40 px-2">Item Terdeteksi ({parsedData.items.length})</h5>
                                {parsedData.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-5 rounded-3xl border border-black/5 flex items-center justify-between group hover:border-dagang-green/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-dagang-cream/50 rounded-xl flex items-center justify-center text-dagang-green font-bold text-sm">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-bold text-dagang-dark">{item.name}</div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.1em] text-dagang-green opacity-60 mt-0.5">{item.category || 'Belanja'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[15px] font-black text-dagang-dark">Rp {item.total.toLocaleString()}</div>
                                            <div className="text-[10px] text-dagang-gray opacity-40">@Rp {item.price.toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'split' && parsedData && (
                        <div className="space-y-6">
                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 font-medium leading-relaxed">Satu struk makan rame-rame? Tandai siapa yang beli apa, nanti kita hitungin patungannya otomatis!</p>
                            </div>

                            <div className="space-y-4">
                                {parsedData.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-black/5 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-bold">{item.name}</div>
                                                <div className="text-[12px] font-black text-dagang-green">Rp {item.total.toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-dagang-cream flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-dagang-gray" />
                                                </div>
                                                <span className="text-[13px] font-bold text-dagang-dark/40">{selections[idx]?.length || 0} orang</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {familyMembers.map((member: any) => {
                                                const isSelected = selections[idx]?.includes(member.user.id);
                                                return (
                                                    <button
                                                        key={member.user.id}
                                                        onClick={() => toggleMemberSelection(idx, member.user.id)}
                                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all border ${
                                                            isSelected 
                                                            ? 'bg-dagang-green text-white border-dagang-green shadow-lg shadow-dagang-green/20' 
                                                            : 'bg-white text-dagang-gray border-black/5 hover:border-dagang-green/30'
                                                        }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${isSelected ? 'bg-white/20' : 'bg-dagang-cream text-dagang-dark'}`}>
                                                            {member.user.full_name?.charAt(0)}
                                                        </div>
                                                        {member.user.full_name?.split(' ')[0]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white border-t border-black/5 flex items-center gap-4">
                    {step === 'review' && (
                        <>
                            <button
                                onClick={() => setStep('split')}
                                className="flex-1 py-4.5 bg-white border border-black/5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-3 hover:bg-dagang-cream/50 transition-all"
                            >
                                <Users className="w-5 h-5 text-amber-500" /> Split Bill Rame-rame
                            </button>
                            <button
                                onClick={handleFinalConfirm}
                                className="flex-1 py-4.5 bg-dagang-green text-white rounded-2xl text-[14px] font-bold flex items-center justify-center gap-3 hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20"
                            >
                                <Check className="w-5 h-5" /> Catat Semua Transaksi
                            </button>
                        </>
                    )}

                    {step === 'split' && (
                        <>
                            <button
                                onClick={handleSendWhatsApp}
                                className="flex-1 py-4.5 bg-[#25D366] text-white rounded-2xl text-[14px] font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-green-500/20"
                            >
                                <MessageCircle className="w-5 h-5" /> Kirim Tagihan WhatsApp
                            </button>
                            <button
                                onClick={handleFinalConfirm}
                                className="flex-1 py-4.5 bg-dagang-dark text-white rounded-2xl text-[14px] font-bold flex items-center justify-center gap-3 hover:bg-[#202821] transition-all shadow-xl shadow-black/20"
                            >
                                <Check className="w-5 h-5 text-dagang-accent" /> Simpan & Selesai
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
