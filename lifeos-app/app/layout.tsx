import "./globals.css";

export const metadata = {
  title: "Life OS",
  description: "Personal command deck",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
