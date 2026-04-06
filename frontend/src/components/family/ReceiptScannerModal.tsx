import React, { useState, useRef } from 'react';
import {
    Camera,
    X,
    Check,
    Loader2,
    ShoppingCart,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import api from '../../services/api';

interface ReceiptScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyMembers: any[];
    onConfirm: (data: { merchant: string; total: number; date: string }) => void;
    wallets: any[];
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
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

                    const MAX_WIDTH = 800; // Reduced for faster processing
                    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject('Conversion failed');
                    }, 'image/webp', 0.7); // Slightly lower quality for speed
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null);
            try {
                const webpBlob = await convertToWebP(file);
                const webpFile = new File([webpBlob], "receipt.webp", { type: "image/webp" });
                setPreviewUrl(URL.createObjectURL(webpFile));
                handleStartScan(webpFile);
            } catch (error) {
                console.error("WebP conversion failed:", error);
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
            if (data.is_valid === false) {
                setError(data.error_message || 'Gagal mengenali struk. Pastikan gambar jelas dan merupakan struk belanja.');
                setStep('upload');
                return;
            }

            setParsedData(data);
            setStep('review');
        } catch (error) {
            setError('Terjadi kesalahan teknis. Pastikan internet stabil dan coba lagi.');
            setStep('upload');
        }
    };

    const handleFinalConfirm = () => {
        onConfirm({
            merchant: parsedData.merchant,
            total: parsedData.total,
            date: parsedData.date || new Date().toISOString().split('T')[0]
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dagang-dark/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#F9FAFB] w-full max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-black text-dagang-dark">Scanner Struk</h3>
                        <p className="text-[10px] text-dagang-gray font-black uppercase tracking-widest opacity-40">
                            {step === 'upload' ? 'Upload Struk' : step === 'scanning' ? 'Membaca Struk' : 'Review Nominal'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-dagang-cream/50 rounded-xl hover:bg-dagang-cream transition-all">
                        <X className="w-5 h-5 text-dagang-gray" />
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-black text-red-600 uppercase tracking-wider mb-1">Gagal Membaca Struk</h4>
                                <p className="text-sm text-red-500/80 font-medium leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {step === 'upload' && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-4 border-dashed border-dagang-green/10 rounded-[40px] p-12 text-center hover:border-dagang-green/30 hover:bg-dagang-green/5 transition-all cursor-pointer group"
                        >
                            <div className="w-20 h-20 bg-dagang-green-pale text-dagang-green rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-dagang-green/5">
                                <Camera className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-black text-dagang-dark mb-2">Ambil Foto atau Upload</h4>
                            <p className="text-sm text-dagang-gray max-w-[240px] mx-auto leading-relaxed">System akan otomatis mencari <b>Total Harga</b> dari struk Anda.</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="py-12 text-center space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-dagang-green/20 rounded-full animate-ping" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-dagang-green animate-spin" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-dagang-dark">Menganalisa Struk...</h4>
                                <p className="text-sm text-dagang-gray/60 mt-1">Lagi cari angka totalnya nih bosku.</p>
                            </div>
                            {previewUrl && (
                                <img src={previewUrl} className="w-40 h-52 object-cover mx-auto rounded-3xl shadow-xl grayscale opacity-50 border-4 border-white" alt="Scan Preview" />
                            )}
                        </div>
                    )}

                    {step === 'review' && parsedData && (
                        <div className="space-y-6">
                            <div className="bg-dagang-green text-white p-8 rounded-[40px] shadow-xl shadow-dagang-green/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShoppingCart className="w-24 h-24 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{parsedData.merchant || 'Struk Belanja'}</div>
                                    <div className="text-4xl font-black">Rp {parsedData.total.toLocaleString('id-ID')}</div>
                                    <div className="text-[11px] opacity-70 mt-3 font-bold uppercase tracking-widest">
                                        {parsedData.date ? new Date(parsedData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak kebaca'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('upload')}
                                    className="flex-1 py-4 bg-white border border-black/5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-dagang-gray flex items-center justify-center gap-3 hover:bg-dagang-cream/50 transition-all shadow-sm"
                                >
                                    <RotateCcw className="w-4 h-4" /> Ulangi
                                </button>
                                <button
                                    onClick={handleFinalConfirm}
                                    className="flex-[2] py-4 bg-dagang-green text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-dagang-green-light transition-all shadow-xl shadow-dagang-green/20"
                                >
                                    <Check className="w-5 h-5" /> Masukkan ke Form
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
