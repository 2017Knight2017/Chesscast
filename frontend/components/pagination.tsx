"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	category: string;
	basePath: string;
	username?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	category,
	basePath,
	username,
}: PaginationProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	if (totalPages <= 1) return null;

	const buildUrl = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", page.toString());
		params.set("category", category);
		const query = params.toString();
		return username
			? `${basePath}?${query}`
			: `${basePath}?${query}`;
	};

	const goToPage = (page: number) => {
		router.push(buildUrl(page));
	};

	const pages = [];
	const maxVisible = 5;

	let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
	let endPage = Math.min(totalPages, startPage + maxVisible - 1);

	if (endPage - startPage + 1 < maxVisible) {
		startPage = Math.max(1, endPage - maxVisible + 1);
	}

	for (let i = startPage; i <= endPage; i++) {
		pages.push(i);
	}

	return (
		<nav className="flex justify-center items-center gap-2 mt-8">
			<button
				onClick={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				← Previous
			</button>

			{startPage > 1 && (
				<>
					<button
						onClick={() => goToPage(1)}
						className={`px-3 py-2 text-sm rounded-lg transition-colors ${
							currentPage === 1
								? "bg-blue-600 text-white"
								: "bg-slate-800 text-slate-200 hover:bg-slate-700"
						}`}
					>
						1
					</button>
					{startPage > 2 && (
						<span className="px-2 text-slate-400">...</span>
					)}
				</>
			)}

			{pages.map((page) => (
				<button
					key={page}
					onClick={() => goToPage(page)}
					className={`px-3 py-2 text-sm rounded-lg transition-colors ${
						currentPage === page
							? "bg-blue-600 text-white"
							: "bg-slate-800 text-slate-200 hover:bg-slate-700"
					}`}
				>
					{page}
				</button>
			))}

			{endPage < totalPages && (
				<>
					{endPage < totalPages - 1 && (
						<span className="px-2 text-slate-400">...</span>
					)}
					<button
						onClick={() => goToPage(totalPages)}
						className={`px-3 py-2 text-sm rounded-lg transition-colors ${
							currentPage === totalPages
								? "bg-blue-600 text-white"
								: "bg-slate-800 text-slate-200 hover:bg-slate-700"
						}`}
					>
						{totalPages}
					</button>
				</>
			)}

			<button
				onClick={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Next →
			</button>
		</nav>
	);
}
