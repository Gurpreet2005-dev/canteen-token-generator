/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                // Zero-latency system font stack — no CDN needed
                // Inter ships with Windows 11, macOS, iOS, Android
                sans: [
                    'Inter', 'Segoe UI', 'Roboto', 'system-ui',
                    '-apple-system', 'BlinkMacSystemFont', 'sans-serif'
                ],
            },
            colors: {
                brand: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-in': 'bounceIn 0.5s ease-out',
            },
        },
    },
    plugins: [],
};
