import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { ExitButton } from "@/components/exit_button";
import { cookies } from "next/dist/server/request/cookies";


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

export default async function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
	const cookieStore = await cookies();
	const token = cookieStore.get('token');
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<header className="absolute top-0 left-0 w-full h-[6%] flex items-center justify-center z-20">
					<a href="/">
						<h1 className="text-3xl font-serif text-[#3e2b1d] opacity-80">Chesscast</h1>
					</a>
					{token && <ExitButton />}
				</header>
				{children}
			</body>
		</html>
	);
}
