export default function KeyboardSurfacePage() {
  return (
    <main>
      <h1>Keyboard isolation surface</h1>
      <div className="test-surface" data-testid="keyboard-surface">
        <button type="button">Previous</button>
        <button type="button">Next</button>
      </div>
    </main>
  );
}
