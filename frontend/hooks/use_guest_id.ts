'use client';

import { useEffect, useState } from 'react';

export function useGuestId() {
	console.log("[use_guest_id.ts:useGuestId]");
    const [guestId, setGuestId] = useState<string | null>(null);

    useEffect(() => {
        let stored = localStorage.getItem('guestId');
        if (!stored) {
            stored = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('guestId', stored);
        }
        setGuestId(stored);
    }, []);

    return guestId;
}
