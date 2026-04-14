"use client";

import { useState } from "react";
import Link from "next/link";
import { ExitButton } from "./exit_button";

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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				)}
			</button>

			<div
				className={`absolute top-full right-0 w-64 grid transition-[grid-template-rows] duration-400 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
			>
				<div className="overflow-hidden">
					<div className="bg-[#f4ead5] flex flex-col items-start p-6 rounded-b-lg shadow-2xl gap-4 text-xl border border-[#3e2b1d1a]">
						<Link
							href="/about"
							onClick={toggleMenu}
							className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full"
						>
							About
						</Link>
						<Link
							href="/new"
							onClick={toggleMenu}
							className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full"
						>
							Create
						</Link>
						{username ? (
							<Link
								href={`/member/${username}`}
								onClick={toggleMenu}
								className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full whitespace-nowrap"
							>
								Profile ({username})
							</Link>
						) : (
							<>
								<Link
									href="/login"
									onClick={toggleMenu}
									className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full"
								>
									Login
								</Link>
								<Link
									href="/register"
									onClick={toggleMenu}
									className="text-[#3e2b1d] opacity-80 hover:opacity-100 transition-opacity w-full"
								>
									Register
								</Link>
							</>
						)}

						{token && (
							<div className="mt-2 pt-4 border-t border-[#3e2b1d1a] w-full flex justify-end">
								<ExitButton />
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
