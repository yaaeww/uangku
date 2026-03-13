import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'danger';
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm',
    confirmText = 'Konfirmasi',
    cancelText = 'Batal'
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const iconMap = {
        confirm: <HelpCircle className="w-12 h-12 text-dagang-accent" />,
        alert: <CheckCircle2 className="w-12 h-12 text-dagang-green" />,
        danger: <AlertCircle className="w-12 h-12 text-red-500" />
    };

    const buttonClassMap = {
        confirm: "bg-dagang-green hover:bg-dagang-green-light",
        alert: "bg-dagang-green hover:bg-dagang-green-light",
        danger: "bg-red-500 hover:bg-red-600"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#faf8f3]/60 backdrop-blur-md animate-fade-in" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="bg-white rounded-[32px] max-w-[440px] w-full p-8 text-center relative z-10 shadow-[0_32px_120px_rgba(0,0,0,0.1)] border border-black/5 animate-scale-up">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-dagang-cream rounded-full transition-colors text-dagang-gray/40 hover:text-dagang-dark"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-dagang-cream rounded-full flex items-center justify-center mx-auto mb-6">
                    {iconMap[type]}
                </div>

                <h2 className="font-serif text-[28px] mb-3 leading-tight text-dagang-dark">{title}</h2>
                <p className="text-dagang-gray text-[15px] leading-relaxed mb-8">
                    {message}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    {type !== 'alert' && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-6 bg-dagang-cream text-dagang-dark rounded-2xl text-[14px] font-bold hover:bg-dagang-cream-dark transition-all"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3.5 px-6 text-white rounded-2xl text-[14px] font-bold shadow-xl shadow-black/5 transition-all outline-none ${buttonClassMap[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
