"use client";

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ isRegister }: { isRegister: boolean }) {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();

	const handleSubmit = async (e: SubmitEvent) => {
		console.log("[login_form.tsx:handleSubmit]", { isRegister, username });
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		if (confirmPassword && password !== confirmPassword) {
			setError("Пароли не совпадают");
			setIsLoading(false);
			return;
		}

		const endpoint = isRegister ? "/auth/register" : "/auth/login";
		const apiUrl =
			process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

		try {
			const url = `${apiUrl}${endpoint}`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(
					isRegister
						? { email, username, password }
						: { username, password },
				),
			});

			const data = await response.json();
			if (!response.ok) {
				setError(data.message);
				return;
			}

			if (data.access_token) {
				localStorage.setItem("token", data.access_token);
				document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;

				if (data.user) {
					localStorage.setItem("user", JSON.stringify(data.user));
				}

				router.push(
					"/member/" + encodeURIComponent(data.user.username),
				);
				router.refresh();
			}
		} catch (err) {
			// @ts-expect-error Type error is impossible here
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
			<h2 className="text-2xl font-serif font-bold text-center mb-6 text-[#5d4037]">
				{isRegister ? "Регистрация" : "Вход"}
			</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="username"
						className="block text-sm font-medium text-[#5d4037] mb-1"
					>
						Имя пользователя
					</label>
					<input
						type="text"
						id="username"
						name="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
					/>
				</div>
				{isRegister && (
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-[#5d4037] mb-1"
						>
							Электронная почта
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
						/>
					</div>
				)}
				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-[#5d4037] mb-1"
					>
						Пароль
					</label>
					<input
						type="password"
						id="password"
						name="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
					/>
				</div>
				{isRegister && (
					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-[#5d4037] mb-1"
						>
							Подтверждение пароля
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
						/>
					</div>
				)}
				<button
					type="submit"
					disabled={isLoading}
					className="w-full py-2 bg-[#5d4037] text-white font-semibold rounded-md hover:bg-[#8d6e63] focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
				>
					{isRegister ? "Зарегистрироваться" : "Войти"}
				</button>
				{error && (
					<div className="text-red-500 text-sm mt-2">{error}</div>
				)}
				{isLoading && (
					<div className="text-gray-500 text-sm mt-2">
						Загрузка...
					</div>
				)}
			</form>
			{!isRegister && (
				<p className="text-sm text-center text-[#5d4037] mt-4">
					Нет аккаунта?{" "}
					<a
						href="/register"
						className="text-[#5d4037] hover:underline"
					>
						Зарегистрироваться
					</a>
				</p>
			)}
		</div>
	);
}
