import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NhostAuthProvider } from "@/components/providers/nhost-provider";
import { ApolloClientProvider } from "@/components/providers/apollo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chat Assistant",
  description: "Real-time chat application with AI assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NhostAuthProvider>
            <ApolloClientProvider>{children}</ApolloClientProvider>
          </NhostAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
