import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export interface Player {
	id: number;
	name: string;
	archetype: string;
}

export function PlayerInput({ label, onSelect }: { label: string, onSelect: (player: Player) => void }) {
	const [query, setQuery] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	const [debouncedQuery] = useDebounce(query, 400);

	useEffect(() => {
		if (debouncedQuery.length > 1) {
			fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/players/search?name=${debouncedQuery}`)
				.then(res => res.json())
				.then(data => setSuggestions(data));
		} else {
			setSuggestions([]);
		}
	}, [debouncedQuery]);

	return (
		<div className="relative">
			<label>{label}</label>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="w-full p-2 bg-slate-800 border..."
			/>
			
			{suggestions.length > 0 && (
				<ul className="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded mt-1 shadow-xl">
					{suggestions.map((player: Player) => (
						<li 
							key={player.id}
							onClick={() => {
								setQuery(player.name);
								setSuggestions([]);
								onSelect(player);
							}}
							className="p-2 hover:bg-blue-600 cursor-pointer"
						>
							{player.name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}