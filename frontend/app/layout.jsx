import './globals.css';

export const metadata = {
  title: 'CAPITALMETRICS | PE Deal Valuation & Cash Flow Simulator',
  description: 'Institutional Private Equity & M&A Valuation Suite built with Next.js & FastAPI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

