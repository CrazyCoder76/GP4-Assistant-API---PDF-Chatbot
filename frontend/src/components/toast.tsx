import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Variants = 'info' | 'error' | 'success';

type Toast = {
    id: number;
    message: string;
    variant: Variants;
};


type ToastContextType = {
    addToast: (message: string, variant: Variants) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = useCallback((message: string, variant: Variants) => {
        const id = new Date().getTime(); // Simple ID generation
        setToasts((prevToasts) => [...prevToasts, { id, message, variant }]);
        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, 3000); // Remove toast after 3 seconds
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-4 space-y-2" style={{ zIndex: 1000 }}>
                <div className="toast toast-end">
                    {toasts.map((toast) => (
                        <div key={toast.id} className={`alert alert-${toast.variant}`}>
                            <div>{toast.message}</div>
                        </div>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};
