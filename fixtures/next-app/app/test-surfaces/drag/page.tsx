export default function DragSurfacePage() {
  return (
    <main>
      <h1>Drag isolation surface</h1>
      <div className="test-surface" data-testid="drag-surface">
        <div draggable>Native draggable target</div>
      </div>
    </main>
  );
}
