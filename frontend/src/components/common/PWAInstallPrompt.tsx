import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const hasBeenPrompted = localStorage.getItem('pwa-prompt-dismissed');
    
    // Check if app is actually running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already in standalone mode
    }

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Only show if not previously dismissed
      if (!hasBeenPrompted) {
        // Delay showing a bit for better UX
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsVisible(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-prompt-dismissed', 'true');
      
      // Auto hide success message after 5 seconds
      setTimeout(() => setIsVisible(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    } else {
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible) return null;

  if (isInstalled) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-500 text-white rounded-2xl shadow-2xl px-8 py-4 flex items-center gap-4 border border-white/20">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest leading-none mb-1">Berhasil!</h4>
            <p className="text-[10px] opacity-90 font-bold leading-tight">UangKu telah ditambahkan ke desktop/layar HP anda.</p>
          </div>
          <button onClick={() => setIsVisible(false)} className="ml-4 hover:opacity-50 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-xl">
      <div className="bg-white dark:bg-dagang-emerald-900 rounded-[2rem] shadow-2xl border border-dagang-amber/20 md:p-5 p-4 flex items-center md:gap-5 gap-3 group hover:scale-[1.01] transition-all ring-1 ring-black/5">
        <div className="md:w-12 md:h-12 w-10 h-10 bg-dagang-amber/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-dagang-amber group-hover:bg-dagang-amber group-hover:text-white transition-all shadow-inner">
          <Download className="md:w-6 md:h-6 w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="md:text-sm text-[13px] font-black text-dagang-dark dark:text-white uppercase tracking-tight leading-tight mb-1 truncate">
            Instal UangKu
          </h4>
          <p className="md:text-[11px] text-[10px] text-dagang-gray dark:text-white/80 font-bold md:leading-snug leading-tight line-clamp-2">
            Pasang di layar utama untuk akses lebih cepat dan mudah!
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={handleInstallClick}
            className="md:px-5 md:py-2.5 px-4 py-2 bg-dagang-amber text-white md:text-[11px] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-dagang-amber/80 transition-all shadow-lg shadow-dagang-amber/30 active:scale-95"
          >
            Instal
          </button>
          
          <button 
            onClick={handleDismiss}
            className="md:p-2 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-dagang-emerald-900/40 dark:text-white/40 hover:text-red-500 transition-all"
            title="Sembunyikan"
          >
            <X className="md:w-5 md:h-5 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
