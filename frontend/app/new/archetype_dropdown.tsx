"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export function ArchetypeDropdown({
	label,
	value,
	onChange,
	options,
	titleLabelClasses,
	inputClasses,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[][];
	titleLabelClasses: string;
	inputClasses: string;
}) {
	console.log("[new/archetype_dropdown.tsx:ArchetypeDropdown]", { label });
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (isOpen) {
			const idx = options.findIndex((opt) => opt[0] === value);
			setSelectedIndex(idx >= 0 ? idx : 0);
		}
	}, [isOpen]);

	useEffect(() => {
		if (listRef.current && selectedIndex >= 0) {
			const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
			activeItem?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSelectedIndex(-1);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleSelect = useCallback(
		(name: string) => {
			onChange(name);
			setIsOpen(false);
			setSelectedIndex(-1);
			buttonRef.current?.focus();
		},
		[onChange],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				return;
			}
			setSelectedIndex((prev) =>
				prev < options.length - 1 ? prev + 1 : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				return;
			}
			setSelectedIndex((prev) =>
				prev > 0 ? prev - 1 : options.length - 1,
			);
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isOpen && selectedIndex >= 0 && selectedIndex < options.length) {
				handleSelect(options[selectedIndex][0]);
			} else {
				setIsOpen(true);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			setIsOpen(false);
			setSelectedIndex(-1);
			buttonRef.current?.focus();
		} else if (e.key === "Tab") {
			setIsOpen(false);
			setSelectedIndex(-1);
		}
	};

	const selectedOption = options.find((opt) => opt[0] === value);

	return (
		<div className="relative" ref={dropdownRef}>
			<label className={titleLabelClasses}>
				{label}
			</label>
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded={isOpen}
				aria-activedescendant={
					isOpen && selectedIndex >= 0
						? `archetype-option-${selectedIndex}`
						: undefined
				}
				className={`${inputClasses} hover:border-amber-400/70 text-left flex justify-between items-center`}
			>
				<span
					className={selectedOption?.[0] ? "" : "text-stone-400"}
					title={selectedOption?.[1]}
				>
					{selectedOption?.[0] || "Select archetype"}
				</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<ul
					ref={listRef}
					role="listbox"
					className="absolute z-10 w-full bg-white border border-amber-300/50 rounded mt-1 shadow-lg max-h-60 overflow-y-auto"
				>
					{options.map(([name, description], index) => (
						<li
							key={name}
							id={`archetype-option-${index}`}
							role="option"
							aria-selected={index === selectedIndex}
							onClick={() => handleSelect(name)}
							onMouseDown={(e) => e.preventDefault()}
							className={`p-3 cursor-pointer transition-colors ${
								index === selectedIndex
									? "bg-amber-100 text-amber-800"
									: "hover:bg-orange-50 text-stone-700"
							}`}
							title={description}
						>
							{name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
