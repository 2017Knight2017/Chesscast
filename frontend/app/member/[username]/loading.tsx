export default function Loading() {
	console.log("[member/[username]/loading.tsx:Loading]");
	return (
		<div className="animate-pulse p-8">
			<div className="h-40 bg-slate-200 rounded-xl mb-4" />
			<div className="grid grid-cols-3 gap-4">
				<div className="h-20 bg-slate-200 rounded-lg" />
				<div className="h-20 bg-slate-200 rounded-lg" />
				<div className="h-20 bg-slate-200 rounded-lg" />
			</div>
		</div>
	);
}
