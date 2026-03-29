'use client';

import { AnalysisProvider } from '@/context/analysis_context';
import { SocketProvider } from '@/context/socket_context';

export function Providers({ children }: { children: React.ReactNode }) {
	console.log("[providers.tsx:Providers]");
	return (
		<SocketProvider>
			<AnalysisProvider>
				{children}
			</AnalysisProvider>
		</SocketProvider>
	);
}
