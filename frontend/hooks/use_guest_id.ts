"use client";

import { useState } from "react";

export function useGuestId() {
	console.log("[use_guest_id.ts:useGuestId]");
	const [guestId] = useState<string | null>(() => {
		if (typeof window === "undefined") return null;

		let stored = localStorage.getItem("guestId");
		if (!stored) {
			stored = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			localStorage.setItem("guestId", stored);
		}
		return stored;
	});

	return guestId;
}
