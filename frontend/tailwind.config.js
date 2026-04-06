/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        screens: {
            'ms': '360px',
            'mobile': '480px',
            'tablet': '768px',
            'desktop': '1280px',
            'large': '1440px',
            // Maintain compatibility with existing md/lg if used
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                dagang: {
                    green: 'var(--primary)',
                    'green-light': '#2d9668',
                    'green-pale': '#e8f5ee',
                    cream: '#faf8f3',
                    dark: 'var(--foreground)',
                    gray: 'var(--text-muted)',
                    accent: 'var(--accent)',
                    // Emerald Harmony Tokens
                    emerald: {
                        950: 'var(--background)',
                        900: 'var(--surface)', // Surface
                        800: 'var(--surface-card)', // Card Surface
                        700: 'var(--primary)', // Primary
                        600: 'var(--primary)', // Primary
                        50: '#E8F5EE',  // Soft Mint
                    },
                    amber: 'var(--accent)',    // Accent Gold
                },
            },
            fontFamily: {
                heading: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                serif: ['Instrument Serif', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            fontSize: {
                // Typography Tokens from Guide
                'display-xl': ['64px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
                'display-l': ['56px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
                'display-m': ['48px', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '700' }],
                'h1': ['40px', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '700' }],
                'h2': ['32px', { lineHeight: '1.25', letterSpacing: '-0.003em', fontWeight: '600' }],
                'h3': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
                'h4': ['24px', { lineHeight: '1.35', fontWeight: '600' }],
                'h5': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
                'h6': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
                'body-xl': ['20px', { lineHeight: '1.6', fontWeight: '400' }],
                'body-l': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
                'body-m': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
                'body-s': ['14px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0.002em' }],
                'caption': ['13px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.003em' }],
                'label': ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.004em' }],
                'btn-text': ['16px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.003em' }],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'float': 'float 4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
