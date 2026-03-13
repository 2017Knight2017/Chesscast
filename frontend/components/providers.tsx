'use client';

import { AnalysisProvider } from '@/context/analysis_context';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AnalysisProvider>
			{children}
		</AnalysisProvider>
	);
}
