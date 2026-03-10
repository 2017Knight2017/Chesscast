'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export function BackToLiveButton() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isPreviewing = searchParams.has('move');

    const handleBackToLive = () => {
        window.history.replaceState(null, '', pathname);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    if (!isPreviewing) return null;

    return (
        <button
            onClick={handleBackToLive}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-md shadow-lg"
        >
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Back to Live
        </button>
    );
}