import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { MemberSection } from './member_section';

export default async function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
	console.log("[member/[username]/page.tsx:DashboardPage]", { params });
	const resolvedParams = await params;
	const decodedUsername = decodeURIComponent(resolvedParams.username);
	const styles = 'grid grid-cols-1 md:grid-cols-2 gap-6';

	const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

	const headers = { 
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json'
	};

	const [ownedRes, followedRes] = await Promise.all([
		fetch(`${process.env.NEST_API_URL}/matches/my_planned`, { headers }),
		fetch(`${process.env.NEST_API_URL}/matches/my_followed`, { headers }),
	]);

	const [ownedMatches, followedMatches] = await Promise.all([ ownedRes.json(), followedRes.json() ]); 

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-12">
			<h1 className="text-3xl font-serif font-bold text-[#5d4037] border-b-2 border-[#8d6e63] pb-4">
				{decodedUsername}
			</h1>

			{/* РАЗДЕЛ 1: МОИ ПОДПИСКИ (Я - зритель) */}
			<section className="space-y-6">
				<h2 className="text-2xl font-semibold text-[#5d4037]">Мои подписки</h2>
				
				<MemberSection matches={followedMatches} styles={styles} />
			</section>

			{/* РАЗДЕЛ 2: МОИ ТРАНСЛЯЦИИ (Я - автор) */}
			<section className="space-y-6">
				<h2 className="text-2xl font-semibold text-[#5d4037]">Мои трансляции</h2>
				
				<MemberSection matches={ownedMatches} styles={styles}/>
			</section>
		</div>
	);
}
