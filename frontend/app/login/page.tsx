'use client'

export default function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-r from-[#f4ead5] to-[#e0c097]">
			<div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
				<h2 className="text-2xl font-serif font-bold text-center mb-6 text-[#5d4037]">
					 Вход в личный кабинет
				</h2>
				<form className="space-y-4">
					<div>
						<label htmlFor="username" className="block text-sm font-medium text-[#5d4037] mb-1">
							Имя пользователя
						</label>
						<input
							type="text"
							id="username"
							name="username"
							className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
						/>
					</div>
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-[#5d4037] mb-1">
							Пароль
						</label>
						<input
							type="password"
							id="password"
							name="password"
							className="w-full px-3 py-2 border border-[#5d4037] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
						/>
					</div>
					<button
						type="submit"
						className="w-full py-2 bg-[#5d4037] text-white font-semibold rounded-md hover:bg-[#8d6e63] focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
					>
						Войти
					</button>
				</form>
				<p className="text-sm text-center text-[#5d4037] mt-4">
					Нет аккаунта? <a href="/register" className="text-[#5d4037] hover:underline">Зарегистрироваться</a>
				</p>
			</div>
		</div>
	);
}