export default function ThemeSurfacePage() {
  return (
    <main>
      <h1>Theme isolation surface</h1>
      <div className="theme-grid" data-testid="theme-surface">
        <section data-theme="paper">Paper</section>
        <section data-theme="night">Night</section>
      </div>
      <div className="screenshot-probe" data-testid="screenshot-probe" />
    </main>
  );
}
