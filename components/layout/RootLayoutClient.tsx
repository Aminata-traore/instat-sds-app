"use client";

import Footer from "./Footer";

type Props = {
  children: React.ReactNode;
};

export default function RootLayoutClient({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-instat-gray">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
