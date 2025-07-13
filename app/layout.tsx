import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={prompt.className}>{children}</body>
    </html>
  );
}