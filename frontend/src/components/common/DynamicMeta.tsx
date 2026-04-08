import { useEffect } from 'react';
import { useSystemStore } from '../../store/systemStore';

export const DynamicMeta = () => {
    const { settings } = useSystemStore();

    useEffect(() => {
        // 1. Update Document Title
        const websiteName = settings.website_name || 'Uangku';
        // Add a suffix for branding if needed, or just the name
        document.title = `${websiteName} - Master Your Wealth`;

        // 2. Update Favicon
        const faviconUrl = settings.logo_url_light || settings.logo_url_dark;
        
        if (faviconUrl) {
            // Base URL for backend assets
            const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
            const fullUrl = String(faviconUrl).startsWith('http') ? String(faviconUrl) : `${backendUrl}${faviconUrl}`;
            
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            
            link.href = fullUrl;
        }
    }, [settings.website_name, settings.logo_url_light, settings.logo_url_dark]);

    return null; // This component doesn't render anything to the UI
};
