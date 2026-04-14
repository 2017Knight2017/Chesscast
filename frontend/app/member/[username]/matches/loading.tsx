export default function Loading() {
	return (
		<div className="max-w-6xl mx-auto p-6 pt-20 space-y-12">
			<header>
				<div className="h-10 w-64 bg-slate-800 rounded animate-pulse" />
			</header>

			<section className="space-y-6">
				<div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
					{Array.from({ length: 10 }).map((_, i) => (
						<div
							key={i}
							className="h-48 bg-slate-800 rounded animate-pulse"
						/>
					))}
				</div>
			</section>
		</div>
	);
}
