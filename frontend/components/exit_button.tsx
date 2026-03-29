'use client'

import { useRouter } from 'next/navigation';

export function ExitButton() {
	console.log("[exit_button.tsx:ExitButton]");
    const router = useRouter();

    const handleLogout = () => {
		console.log("[exit_button.tsx:handleLogout]");
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

        router.push('/login');
        
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="absolute top-4 right-4 px-4 py-2 text-sm font-medium text-[#5d4037] border border-[#5d4037] rounded-md hover:bg-[#5d4037] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
        >
            Выйти
        </button>
    );
}