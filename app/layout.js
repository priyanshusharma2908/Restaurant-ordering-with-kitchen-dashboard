import { Inter, Poppins } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins' });
export const metadata = { title: 'TableTalk — good food, happy tables', description: 'Scan, order, relax. A smarter restaurant experience powered by TableTalk.' };
export default function RootLayout({ children }) { return <html lang="en"><body className={`${inter.variable} ${poppins.variable}`}>{children}</body></html>; }
