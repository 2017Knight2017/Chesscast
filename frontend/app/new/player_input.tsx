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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [debouncedQuery] = useDebounce(query, 400);

    useEffect(() => {
        if (debouncedQuery.length > 1 && showSuggestions) {
            fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/players/search?name=${debouncedQuery}`)
                .then(res => res.json())
                .then(data => setSuggestions(data));
        } else {
            setSuggestions([]);
        }
    }, [debouncedQuery, showSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setShowSuggestions(true);
    };

    const handleSelect = (player: Player) => {
        setQuery(player.name);
        setSuggestions([]);
        setShowSuggestions(false);
        onSelect(player);
    };

    return (
        <div className="relative">
            <label>{label}</label>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                className="w-full p-2 bg-slate-800 border..."
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