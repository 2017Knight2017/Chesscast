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
		<div className="md:hidden ml-auto flex items-center relative">
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

			<div className={`absolute top-full right-0 mt-2 min-w-48 bg-[#f4ead5] -z-10 flex flex-col items-start p-6 rounded-lg shadow-xl gap-4 text-xl border border-[#3e2b1d1a] transition-all duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
				<Link href="/" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full">
					Matches
				</Link>
				<Link href="/new" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full">
					Create
				</Link>
				{username ? (
					<Link href={`/member/${username}`} onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full whitespace-nowrap">
						Profile ({username})
					</Link>
				) : (
					<>
						<Link href="/login" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full">
							Login
						</Link>
						<Link href="/register" onClick={toggleMenu} className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full">
							Register
						</Link>
					</>
				)}
				{token && (
					<div className="mt-2 pt-2 border-t border-[#3e2b1d1a] w-full flex justify-end">
						<ExitButton />
					</div>
				)}
			</div>
		</div>
	);
}
