"use client";

export default function AboutPage() {
	console.log("[new/page.tsx:BroadcastPage]");
	const videoLink = "https://www.youtube.com/watch?v=VNu9SsHh8dk";

	return (
		<div className="flex flex-col items-center p-4 md:p-8 pt-12 mt-16 mb-6 bg-stone-950 text-white">
			<div className="w-full max-w-3xl flex justify-center items-center mb-6">
				<div className="text-xl font-bold flex items-center">
					<h1>About Chesscast</h1>
				</div>
			</div>
			<main className="bg-orange-50/10 backdrop-blur-sm p-4 size-full max-w-3xl border border-oak-dark/20 shadow-lg">
				<div className="h-410 sm:h-380 md:h-370 bg-orange-50 border-l-4 border-oak-dark shadow-xl text-stone-900 text-base font-sans">
					<p className="px-6 pt-6">
						Hello!<br /><br />

						I'm Iaroslav Sutulov, creator of Chesscast. Although I could code complex applications earlier,
						I have never worked on something this huge. Long before this all began, I thought about a 
						mathematical formula to simulate a player's thought duration per move (TDM). The
						formula contained the "archetype" profiles, which defined the ratio of objective complexity, 
						sharpness and number of tactics impact on the TDM. Then, I quickly coded the algorithm in Python,
						which I was the most familiar with.<br /><br /> 

						The idea of using it in a broadcasting website came to me while I was watching a video 
						called <a className="hover:underline text-stone-600" href={videoLink}>"how we made our own Onlyfans"</a> (this video is family-friendly, 
						i swear). In this video, the author explained the architecture of contemporary web-applications 
						and various useful utilities, including Redis, Docker, asynchronous worker-processes, etc. 
						"Why can't I make something alike?" — I thought then.<br /><br />

						I started to ask Google Gemini about the most progressive and powerful frameworks 
						for Frontend, Backend, and Database at the moment. It responded with Next.js, Nest.js, 
						(both for Typescript with Bun) and Postgres. Lack of experience in Typescript didn't
						scare me at all, because avoiding familiar techs was one of my goals: I wanted
						to learn something radically new.<br /><br />
					</p>
						<div className="flex flex-rows justify-center">
							<img className="px-12" src="/InitialDesign.png" alt="First BroadcastPage design" />
						</div>
						<span className="block text-center mt-1">The initial design of /watch page</span>
					<p className="p-6">
						From the end of January to mid-April I worked intensely on the broadcasting platform.
						For better experience I went to the regional library daily, which is the cheapest place
						with a working atmosphere. In fact, I became the most frequent guest there, lol. During these 
						two months my day schedule looked like this:
					</p>
					<ul className="px-6">
						<li>7:00 Waking up</li>
						<li>9:00 Entering the library when it opens</li>
						<li>17:00 Going home when the library closes</li>
						<li>22:00 Falling asleep</li>
					</ul>
					<p className="px-6 pt-6">
						I have faced countless challenges in the process. For example, Prisma ORM proved to be more headache  
						than it was worth, so I replaced it with Drizzle ORM, which is way simpler. Or that the previous
						png-background looked awful on small devices, so I removed it completely. User analysis system
						is a whole other story. These and many other problems I had been painfully solving with
						Gemini.<br /><br />

						Overall, Chesscast is the greatest creation I have ever made. The UI may not be perfect, but I
						think it's fine for the first website in a career. I wish you a good time using my broadcasting
						platform!
					</p>
					<span className="block px-6 pt-6 text-right">Iaroslav Sutulov</span>
					<span className="block px-6 pt-0 text-right">April 14, 2026</span>
				</div>
			</main>
		</div>
	);
}