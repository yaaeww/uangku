import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

interface ModalContextType {
    showAlert: (title: string, message: string, type?: 'alert' | 'confirm' | 'danger' | 'warning') => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, type?: 'confirm' | 'danger' | 'warning', confirmText?: string, cancelText?: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm' | 'danger' | 'warning';
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
        onConfirm: () => {}
    });

    const showAlert = useCallback((title: string, message: string, type: 'alert' | 'confirm' | 'danger' | 'warning' = 'alert') => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
            confirmText: 'OK'
        });
    }, []);

    const showConfirm = useCallback((
        title: string, 
        message: string, 
        onConfirm: () => void, 
        type: 'confirm' | 'danger' | 'warning' = 'confirm',
        confirmText?: string,
        cancelText?: string
    ) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => {
                onConfirm();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            confirmText,
            cancelText
        });
    }, []);

    const handleClose = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={handleClose}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </ModalContext.Provider>
    );
};
