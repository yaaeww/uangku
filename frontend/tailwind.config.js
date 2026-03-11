/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dagang: {
                    green: '#1a6b4a',
                    'green-light': '#2d9668',
                    'green-pale': '#e8f5ee',
                    cream: '#faf8f3',
                    dark: '#1a1f16',
                    gray: '#6b7280',
                    accent: '#f59e0b',
                },
            },
            fontFamily: {
                serif: ['Instrument Serif', 'serif'],
                sans: ['DM Sans', 'sans-serif'],
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
    plugins: [],
}
