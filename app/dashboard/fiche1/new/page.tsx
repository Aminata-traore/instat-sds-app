import Fiche1DynamicForm from "@/app/dashboard/fiche1/components/Fiche1DynamicForm";

export default function NewFiche1Page() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fiche 1 — Nouvelle saisie</h1>
      <Fiche1DynamicForm />
    </div>
  );
}
