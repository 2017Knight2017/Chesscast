'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExitButton } from './exit_button';

interface BurgerMenuProps {
	username: string | null;
	token: string | undefined;
}

export function BurgerMenu({ username, token }: BurgerMenuProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleMenu = () => setIsOpen(!isOpen);

	return (
		<div className="md:hidden ml-auto flex items-center">
			<button
				onClick={toggleMenu}
				className="p-2 text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity z-50"
				aria-label="Toggle menu"
			>
				{isOpen ? (
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				)}
			</button>

			{isOpen && (
				<div className="fixed inset-0 bg-[#f4ead5] z-40 flex flex-col items-center justify-center gap-8 text-2xl">
					<Link href="/" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity">
						Matches
					</Link>
					<Link href="/new" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity">
						Create
					</Link>
					{username ? (
						<Link href={`/member/${username}`} onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity">
							Profile ({username})
						</Link>
					) : (
						<>
							<Link href="/login" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity">
								Login
							</Link>
							<Link href="/register" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity">
								Register
							</Link>
						</>
					)}
					{token && (
						<div className="mt-4 scale-150">
							<ExitButton />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
