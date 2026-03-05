```tsx
"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-instat-gray">

      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

    </div>
  );
}
```
