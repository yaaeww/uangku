import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'danger' | 'warning';
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
        confirm: <HelpCircle className="w-12 h-12 text-[var(--accent)]" />,
        alert: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
        danger: <AlertCircle className="w-12 h-12 text-red-500" />,
        warning: <AlertCircle className="w-12 h-12 text-amber-500" />
    };

    const buttonClassMap = {
        confirm: "bg-[var(--primary)] hover:opacity-90",
        alert: "bg-[var(--primary)] hover:opacity-90",
        danger: "bg-red-500 hover:bg-red-600",
        warning: "bg-amber-500 hover:bg-amber-600"
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-0">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="bg-[var(--surface-card)] rounded-[32px] max-w-[440px] w-full p-8 text-center relative z-10 shadow-[var(--card-shadow)] border border-[var(--border)] animate-scale-up">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-6">
                    {iconMap[type]}
                </div>

                <h2 className="font-serif text-[28px] mb-3 leading-tight text-[var(--text-main)]">{title}</h2>
                <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-8">
                    {message}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    {type !== 'alert' && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-6 bg-[var(--surface)] text-[var(--text-main)] rounded-2xl text-[14px] font-bold hover:opacity-80 transition-all border border-[var(--border)]"
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
