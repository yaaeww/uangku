import React, { useState, useEffect } from 'react';
import { X, Delete, Divide, Minus, Plus, X as Multiply } from 'lucide-react';

interface CalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (value: number) => void;
    initialValue?: number;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose, onApply, initialValue }) => {
    const [expression, setExpression] = useState<string>('');
    const [result, setResult] = useState<number>(0);

    useEffect(() => {
        if (isOpen && initialValue) {
            setExpression(initialValue.toString());
            setResult(initialValue);
        } else if (isOpen) {
            setExpression('');
            setResult(0);
        }
    }, [isOpen, initialValue]);

    useEffect(() => {
        try {
            // Basic sanitized eval for math
            // Replace visual operators with math operators
            const mathExp = expression.replace(/×/g, '*').replace(/÷/g, '/');
            if (mathExp && !/[^0-9\+\-\*\/\.\s]/.test(mathExp)) {
                // Check if ends with operator
                if (/[\+\-\*\/]$/.test(mathExp.trim())) {
                    return;
                }
                const res = eval(mathExp);
                if (typeof res === 'number' && isFinite(res)) {
                    setResult(res);
                }
            } else if (!expression) {
                setResult(0);
            }
        } catch (e) {
            // Ignore calc errors during typing
        }
    }, [expression]);

    if (!isOpen) return null;

    const handleKey = (key: string) => {
        if (key === 'C') {
            setExpression('');
            setResult(0);
        } else if (key === 'delete') {
            setExpression((prev: string) => prev.slice(0, -1));
        } else {
            // Don't allow multiple operators in a row
            const lastChar = expression.slice(-1);
            const isOperator = ['+', '-', '×', '÷'].includes(key);
            const lastIsOperator = ['+', '-', '×', '÷'].includes(lastChar);
            
            if (isOperator && lastIsOperator) {
                setExpression((prev: string) => prev.slice(0, -1) + key);
            } else {
                setExpression((prev: string) => prev + key);
            }
        }
    };

    const buttons = [
        { label: 'C', color: 'bg-red-500/20 text-red-500', action: () => handleKey('C') },
        { label: <Delete className="w-5 h-5" />, color: 'bg-orange-500/20 text-orange-500', action: () => handleKey('delete') },
        { label: <Divide className="w-5 h-5" />, color: 'bg-dagang-green/20 text-dagang-green', action: () => handleKey('÷') },
        { label: <Multiply className="w-5 h-5" />, color: 'bg-dagang-green/20 text-dagang-green', action: () => handleKey('×') },
        { label: '7', action: () => handleKey('7') },
        { label: '8', action: () => handleKey('8') },
        { label: '9', action: () => handleKey('9') },
        { label: <Minus className="w-5 h-5" />, color: 'bg-dagang-green/20 text-dagang-green', action: () => handleKey('-') },
        { label: '4', action: () => handleKey('4') },
        { label: '5', action: () => handleKey('5') },
        { label: '6', action: () => handleKey('6') },
        { label: <Plus className="w-5 h-5" />, color: 'bg-dagang-green/20 text-dagang-green', action: () => handleKey('+') },
        { label: '1', action: () => handleKey('1') },
        { label: '2', action: () => handleKey('2') },
        { label: '3', action: () => handleKey('3') },
        { label: '=', color: 'bg-dagang-green text-white', action: () => setExpression(result.toString()) },
        { label: '0', action: () => handleKey('0'), colSpan: 1 },
        { label: '.', action: () => handleKey('.'), colSpan: 1 },
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dagang-dark/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#1C1C1E] w-full max-w-[360px] rounded-[40px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between text-white/50">
                        <span className="text-sm font-bold tracking-widest uppercase">Kalkulator</span>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-black/20 rounded-3xl p-6 text-right space-y-2 min-h-[120px] flex flex-col justify-end">
                        <div className="text-white/40 text-lg font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                            {expression || '0'}
                        </div>
                        <div className="text-white text-4xl font-black">
                            = {result.toLocaleString('id-ID')}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {buttons.map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                className={`
                                    h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-90
                                    ${btn.color || 'bg-white/5 text-white hover:bg-white/10'}
                                    ${btn.colSpan === 2 ? 'col-span-2' : ''}
                                `}
                            >
                                {btn.label}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => onApply(result)}
                            className="col-span-4 mt-2 h-16 bg-dagang-green text-white rounded-2xl flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-dagang-green/20 hover:bg-dagang-green-light transition-all active:scale-[0.98]"
                        >
                            Rp {result.toLocaleString('id-ID')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
