import { StickerPeel } from "@scout-ui/react";

// A non-Navbar interactive import through the broad barrel. M11 inspects the
// emitted bundle to ensure mixed root ergonomics still tree-shake by leaf.
export const PackedPeel = StickerPeel;
