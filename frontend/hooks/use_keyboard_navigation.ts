'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useKeyboardNavigation(totalMoves: number) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}

			const currentRaw = searchParams.get('move');
			const currentIndex = currentRaw !== null ? parseInt(currentRaw) : totalMoves - 1;

			switch (event.key) {
				case "ArrowLeft":
					if (currentIndex > 0) {
						updateUrl(currentIndex - 1);
						break;
					}
				case "ArrowRight":
					if (currentIndex < totalMoves - 1) {
						updateUrl(currentIndex + 1);
					} else if (currentIndex === totalMoves - 1) {
						updateUrl(null);
					}
					break;
				case "ArrowUp":
					updateUrl(0);
					break;
				case "ArrowDown":
					updateUrl(null);
					break;
			}
		};

		const updateUrl = (index: number | null) => {
			const params = new URLSearchParams(window.location.search);
			if (index === null) {
				params.delete('move');
			} else {
				params.set('move', index.toString());
			}
			
			const newUrl = index === null ? pathname : `${pathname}?${params.toString()}`;
			window.history.replaceState(null, '', newUrl);
			window.dispatchEvent(new PopStateEvent('popstate'));
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [totalMoves, searchParams, pathname]);
}