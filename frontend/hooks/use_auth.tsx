"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

interface User {
	id: number;
	username: string;
	email: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	logout: () => void;
	refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchProfile = useCallback(async (authToken: string) => {
		try {
			const res = await fetch(`${API_URL}/auth/profile`, {
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			});

			if (!res.ok) {
				return null;
			}

			const data = await res.json();
			return data;
		} catch {
			return null;
		}
	}, []);

	const checkAuth = useCallback(async () => {
		let authToken: string | null = null;

		// 1. Проверяем куки (основной источник)
		const cookies = document.cookie.split("; ");
		const tokenCookie = cookies.find((c) => c.startsWith("token="));
		if (tokenCookie) {
			authToken = tokenCookie.split("=")[1];
		}

		// 2. Fallback: localStorage (обратная совместимость)
		if (!authToken) {
			const storedToken = localStorage.getItem("token");
			if (storedToken) {
				authToken = storedToken;
			}
		}

		if (!authToken) {
			setUser(null);
			setToken(null);
			setIsLoading(false);
			return;
		}

		const profile = await fetchProfile(authToken);

		if (profile) {
			setUser(profile);
			setToken(authToken);
		} else {
			setUser(null);
			setToken(null);
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
		}

		setIsLoading(false);
	}, [fetchProfile]);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const logout = useCallback(() => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
	}, []);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		await checkAuth();
	}, [checkAuth]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				isLoading,
				token,
				logout,
				refetch,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
