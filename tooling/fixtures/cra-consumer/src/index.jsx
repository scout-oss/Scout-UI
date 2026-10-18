import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Sticker, StickerBadge } from "@scout-ui/react";
import { StickerButton } from "@scout-ui/react/sticker-button";
import { StickerPeel } from "@scout-ui/react/sticker-peel";
import { StickerTrail } from "@scout-ui/sticker-trail";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import starAsset from "@scout-ui/stickers/assets/wonky-star.svg";
import "@scout-ui/react/styles.css";
import "@scout-ui/sticker-trail/styles.css";
import "./styles.css";

function App() {
  const [selected, setSelected] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <main className="p-8" data-scout-consumer="packed">
      <h1>Scout-like packed consumer</h1>
      <nav>
        <Link to="/">Home</Link> <Link to="/second">Second route</Link>
      </nav>
      <Routes>
        <Route path="/" element={<p>Home route</p>} />
        <Route path="/second" element={<p>Second route content</p>} />
      </Routes>
      <Sticker source={wonkyStar} alt="Official wonky star" />
      <img src={starAsset} width="80" height="80" alt="Direct asset import" />
      <StickerButton onClick={() => setCount((value) => value + 1)}>
        Count {count}
      </StickerButton>
      <StickerBadge
        mode="select"
        selected={selected}
        onSelectedChange={setSelected}
      >
        Selected badge
      </StickerBadge>
      <StickerPeel
        front={<p>Front content</p>}
        back={<p>Revealed content</p>}
      />
      <StickerTrail stickers={[wonkyStar]} seed="m19-scout-consumer">
        <section style={{ height: 250 }}>Standalone Trail surface</section>
      </StickerTrail>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
