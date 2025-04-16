import { Fascinate, Poppins, Inconsolata } from 'next/font/google';
import "./globals.css";

const fascinate = Fascinate({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fascinate',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const menlo = Inconsolata({
  variable: '--font-menlo',
  subsets: ['latin'],
  weight: '400',
});

export const metadata = {
  title: "Mixtape Creator",
  description: "Create your custom mixtapes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fascinate.variable} ${poppins.variable} ${menlo.variable} font-poppins antialiased text-black`}
      >
        <script src="https://www.youtube.com/iframe_api" />
        {children}
      </body>
    </html>
  );
}
