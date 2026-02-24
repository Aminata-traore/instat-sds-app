import { AdminFiche1Client } from "./AdminFiche1Client";

export const dynamic = "force-dynamic";

export default function AdminFiche1Page() {
  // Page SERVER: pas de hooks, pas de supabase client ici
  return <AdminFiche1Client />;
}
