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
					<header className="relative w-full h-16 flex items-center px-8 z-30 bg-[#1a1512] border-b border-[#3e2b1d]/20 shadow-md">
						<Link href="/">
							<h1 className="text-2xl font-serif text-[#d9c5b2] opacity-90 hover:opacity-100 transition-opacity">
								Chesscast
							</h1>
						</Link>
							
						<nav className="hidden md:flex items-center gap-8 ml-10">
							<Link href="/" className="text-[#d9c5b2]/70 hover:text-[#d9c5b2] transition-colors">
								Matches
							</Link>
							<Link href="/new" className="text-[#d9c5b2]/70 hover:text-[#d9c5b2] transition-colors">
								Create
							</Link>
							{username ? (
								<Link href={`/member/${username}`} className="text-[#d9c5b2]/70 hover:text-[#d9c5b2] transition-colors">
									Profile ({username})
								</Link>
							) : (
								<>
									<Link href="/login" className="text-[#d9c5b2]/70 hover:text-[#d9c5b2] transition-colors">
										Login
									</Link>
									<Link href="/register" className="text-[#d9c5b2]/70 hover:text-[#d9c5b2] transition-colors">
										Register
									</Link>
								</>
							)}
						</nav>
						
						<div className="ml-auto flex items-center gap-4">
							<BurgerMenu username={username} token={token} />
							<div className="hidden md:block">
								{token && <ExitButton />}
							</div>
						</div>
					</header>
					{children}
				</Providers>
			</body>
		</html>
	);
}
