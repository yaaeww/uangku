import React from 'react';
import { useSystemStore } from '../../store/systemStore';
import { useThemeStore } from '../../store/themeStore';

interface LogoProps {
    variant?: 'horizontal' | 'stacked' | 'icon';
    className?: string;
    forceTheme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'horizontal', className = '', forceTheme }) => {
    const { settings } = useSystemStore();
    const { theme: systemTheme } = useThemeStore();
    const theme = forceTheme || systemTheme;
    const logoUrl = theme === 'dark' ? settings.logo_url_dark : settings.logo_url_light;
    const websiteName = settings.website_name || 'Uangku';

    // Base URL for backend assets (strip /api/v1 and trailing slash)
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    const fullLogoUrl = (logoUrl && logoUrl !== '') ? (String(logoUrl).startsWith('http') ? String(logoUrl) : `${backendUrl}${logoUrl}`) : null;
    const textColor = theme === 'dark' ? 'text-white' : 'text-dagang-green';

    if (fullLogoUrl) {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                <img 
                    src={fullLogoUrl} 
                    alt={websiteName} 
                    className={variant === 'icon' ? 'h-8 w-8 object-contain' : 'h-8 object-contain'} 
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                {variant !== 'icon' && (
                    <span className={`font-serif text-2xl tracking-wider ${textColor}`}>
                        {websiteName.split('').map((char, i) => (
                            <span key={i} className={i >= websiteName.length - 2 ? "text-dagang-accent" : ""}>
                                {char}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        );
    }

    // Fallback to text logo if no URL is provided
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-8 h-8 bg-dagang-green text-white rounded-lg flex items-center justify-center font-serif font-black text-xl">
                {websiteName.charAt(0).toUpperCase()}
            </div>
            <span className={`logo font-serif text-2xl tracking-wider ${textColor}`}>
                {websiteName.split('').map((char, i) => {
                    const isAccent = websiteName.toLowerCase().endsWith('ku') && i >= websiteName.length - 2;
                    return (
                        <span key={i} className={isAccent ? "text-dagang-accent" : ""}>
                            {char}
                        </span>
                    );
                })}
            </span>
        </div>
    );
};
