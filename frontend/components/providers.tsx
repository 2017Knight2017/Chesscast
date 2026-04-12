"use client";

import { AuthProvider } from "@/hooks/use_auth";
import { AnalysisProvider } from "@/context/analysis_context";
import { SocketProvider } from "@/context/socket_context";

export function Providers({ children }: { children: React.ReactNode }) {
	console.log("[providers.tsx:Providers]");
	return (
		<AuthProvider>
			<SocketProvider>
				<AnalysisProvider>{children}</AnalysisProvider>
			</SocketProvider>
		</AuthProvider>
	);
}
