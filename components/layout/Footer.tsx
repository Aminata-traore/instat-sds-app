export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-instat-gray">
      <div className="mx-auto max-w-screen-xl px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} INSTAT — Institut National de la Statistique. Tous droits réservés.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">République du Mali</p>
      </div>
    </footer>
  )
}
