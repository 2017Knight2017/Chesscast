import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "use-debounce";

export interface Player {
	id: number;
	name: string;
	archetype: string;
}

export function PlayerInput({
	label,
	onSelect,
}: {
	label: string;
	onSelect: (player: Player) => void;
}) {
	console.log("[new/player_input.tsx:PlayerInput]", { label });
	const [query, setQuery] = useState("");
	const [rawSuggestions, setRawSuggestions] = useState<Player[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const [debouncedQuery] = useDebounce(query, 400);

	const suggestions =
		debouncedQuery.length > 1 && showSuggestions ? rawSuggestions : [];

	useEffect(() => {
		setSelectedIndex(-1);
	}, [rawSuggestions]);

	useEffect(() => {
		if (listRef.current && selectedIndex >= 0) {
			const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
			activeItem?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	useEffect(() => {
		if (debouncedQuery.length <= 1 || !showSuggestions) return;

		const controller = new AbortController();
		fetch(
			`${process.env.NEXT_PUBLIC_SOCKET_URL}/players/search?name=${debouncedQuery}`,
			{
				signal: controller.signal,
			},
		)
			.then((res) => res.json())
			.then((data) => setRawSuggestions(data));

		return () => controller.abort();
	}, [debouncedQuery, showSuggestions]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};

		if (showSuggestions) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showSuggestions]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log("[new/player_input.tsx:handleInputChange]", {
			value: e.target.value,
		});
		setQuery(e.target.value);
		setShowSuggestions(true);
	};

	const handleSelect = useCallback((player: Player) => {
		console.log("[new/player_input.tsx:handleSelect]", { player });
		setQuery(player.name);
		setRawSuggestions([]);
		setShowSuggestions(false);
		setSelectedIndex(-1);
		onSelect(player);
	}, [onSelect]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || suggestions.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				prev < suggestions.length - 1 ? prev + 1 : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				prev > 0 ? prev - 1 : suggestions.length - 1,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
				handleSelect(suggestions[selectedIndex]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			setShowSuggestions(false);
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<label className="text-xs font-bold uppercase tracking-wider text-white mb-2 block">
				{label}
			</label>
			<input
				ref={inputRef}
				type="text"
				value={query}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				onFocus={() => setShowSuggestions(true)}
				role="combobox"
				aria-expanded={showSuggestions}
				aria-activedescendant={
					selectedIndex >= 0 ? `player-option-${selectedIndex}` : undefined
				}
				className="w-full p-3 rounded-sm bg-stone-900 border border-amber-900/30 focus:border-white-500 text-stone-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-stone-600"
			/>

			{showSuggestions && suggestions.length > 0 && (
				<ul
					ref={listRef}
					role="listbox"
					className="absolute z-10 w-full bg-stone-900 border border-amber-900/30 rounded mt-1 shadow-xl max-h-60 overflow-y-auto"
				>
					{suggestions.map((player: Player, index: number) => (
						<li
							key={player.id}
							id={`player-option-${index}`}
							role="option"
							aria-selected={index === selectedIndex}
							onClick={() => handleSelect(player)}
							onMouseDown={(e) => e.preventDefault()}
							className={`p-3 cursor-pointer transition-colors ${
								index === selectedIndex
									? "bg-amber-900/30 text-amber-300"
									: "hover:bg-stone-800 text-stone-100"
							}`}
						>
							{player.name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
