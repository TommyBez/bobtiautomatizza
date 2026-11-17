import assert from "node:assert/strict";
import { test } from "node:test";
import { showsYoutubeTitle } from "./video-titles.ts";

test("nasconde il sottotitolo quando ripete il titolo", () => {
  const title = "Cos'è una skill: il manuale che l'agente apre da solo";
  assert.equal(showsYoutubeTitle({ title, youtubeTitle: title }), false);
  // Stesso titolo con maiuscole, spazi e apostrofi tipografici diversi.
  assert.equal(
    showsYoutubeTitle({
      title,
      youtubeTitle: "  cos’è una SKILL:  il manuale che l’agente apre da solo ",
    }),
    false,
  );
});

test("mostra il sottotitolo quando il titolo YouTube è diverso", () => {
  assert.equal(
    showsYoutubeTitle({
      title:
        "Come usare i Progetti di Claude per non rispiegargli ogni volta chi sei",
      youtubeTitle: "Progetti di Claude: glielo spieghi una volta e basta",
    }),
    true,
  );
});
