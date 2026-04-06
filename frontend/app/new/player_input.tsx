import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export interface Player {
	id: number;
	name: string;
	archetype: string;
}

export function PlayerInput({ label, onSelect }: { label: string, onSelect: (player: Player) => void }) {
    console.log("[new/player_input.tsx:PlayerInput]", { label });
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [debouncedQuery] = useDebounce(query, 400);

    useEffect(() => {
        console.log("[new/player_input.tsx:useEffect]", { debouncedQuery, showSuggestions });
        if (debouncedQuery.length > 1 && showSuggestions) {
            fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/players/search?name=${debouncedQuery}`)
                .then(res => res.json())
                .then(data => setSuggestions(data));
        } else {
            setSuggestions([]);
        }
    }, [debouncedQuery, showSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("[new/player_input.tsx:handleInputChange]", { value: e.target.value });
        setQuery(e.target.value);
        setShowSuggestions(true);
    };

    const handleSelect = (player: Player) => {
        console.log("[new/player_input.tsx:handleSelect]", { player });
        setQuery(player.name);
        setSuggestions([]);
        setShowSuggestions(false);
        onSelect(player);
    };

    return (
        <div className="relative">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-200/60 mb-2 block">{label}</label>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                className="w-full p-3 rounded-sm bg-stone-900 border border-amber-900/30 focus:border-white-500 text-stone-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-stone-600"
            />
            
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded mt-1 shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((player: Player) => (
                        <li 
                            key={player.id}
                            onClick={() => handleSelect(player)}
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