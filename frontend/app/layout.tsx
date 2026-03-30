import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { ExitButton } from "@/components/exit_button";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import Link from "next/link";
import { BurgerMenu } from "@/components/burger_menu";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Chesscast - Платформа для онлайн-трансляций шахматных турниров",
	description: "Chesscast — это платформа для трансляций шахматных партий мастеров прошлого. Думайте над следующим ходом вместе с гроссмейстером!",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1.0,
	maximumScale: 1.0,
	userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	console.log("[layout.tsx:RootLayout]", { children });
	const cookieStore = await cookies();
	const token = cookieStore.get('token')?.value;
	let username: string | null = null;

	if (token) {
		try {
			const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
			username = payload.username;
		} catch (e) {
			console.error("Error decoding token:", e);
		}
	}

	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers>
					<header className="absolute top-0 left-0 w-full h-[6%] flex items-center px-8 z-20">
						<Link href="/">
							<h1 className="text-3xl font-serif text-[#3e2b1d] opacity-80">Chesscast</h1>
						</Link>

						<nav className="hidden md:flex items-center gap-6 ml-10">
							<Link href="/" className="text-[#3e2b1d] opacity-70 hover:opacity-100 transition-opacity">
								Matches
							</Link>
							<Link href="/new" className="text-[#3e2b1d] opacity-70 hover:opacity-100 transition-opacity">
								Create
							</Link>
							{username ? (
								<Link href={`/member/${username}`} className="text-[#3e2b1d] opacity-70 hover:opacity-100 transition-opacity">
									Profile ({username})
								</Link>
							) : (
								<>
									<Link href="/login" className="text-[#3e2b1d] opacity-70 hover:opacity-100 transition-opacity">
										Login
									</Link>
									<Link href="/register" className="text-[#3e2b1d] opacity-70 hover:opacity-100 transition-opacity">
										Register
									</Link>
								</>
							)}
						</nav>
						<BurgerMenu username={username} token={token} />
						<div className="hidden md:block">
							{token && <ExitButton />}
						</div>
					</header>
					{children}
				</Providers>
			</body>
		</html>
	);
}
