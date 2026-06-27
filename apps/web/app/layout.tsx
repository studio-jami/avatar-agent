import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Avatar Agent",
  description: "Jami Studio real-time avatar interaction surface.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
