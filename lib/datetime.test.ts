import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIsoDateTime, toEpoch, withValidDate } from "./datetime.ts";

test("accetta data e ora ISO 8601 con fuso", () => {
  for (const value of [
    "2026-11-12T08:00:31Z",
    "2026-11-12T09:00:31+01:00", // ora solare di Roma
    "2026-07-12T10:00:31+02:00", // ora legale di Roma
    "2026-11-12T00:00:31-08:00",
    "2026-11-12T08:00Z",
    "2026-11-12T08:00:31.250Z",
  ]) {
    assert.equal(parseIsoDateTime(value, "test"), value);
  }
});

test("rifiuta una data senza fuso orario", () => {
  for (const value of [
    "2026-11-12",
    "2026-11-12T09:00:31",
    "2026-11-12T09:00",
  ]) {
    assert.throws(() => parseIsoDateTime(value, "content/video/x.mdx: date"), {
      message: /content\/video\/x\.mdx: date: .* non ha il fuso orario/,
    });
  }
});

test("rifiuta una data non valida", () => {
  for (const value of [
    "2026-11-31T09:00:00+01:00", // il 31 novembre non esiste
    "2026-02-29T09:00:00Z", // il 2026 non è bisestile
    "2026-13-01T09:00:00Z",
    "2026-11-12T24:00:00Z",
    "2026-11-12T09:60:00Z",
    "2026-11-12T09:00:60Z",
    "2026-11-12T09:00:00+15:00",
    "2026-11-12T09:00:00+01:60",
    "2026-11-12T09:00:00+0100",
    "2026-11-12 09:00:00Z",
    "12/11/2026",
    "12 novembre 2026",
    "",
  ]) {
    assert.throws(() => parseIsoDateTime(value, "test"), Error, value);
  }
  for (const value of [
    undefined,
    null,
    20261112,
    new Date("2026-11-12T08:00:31Z"),
  ]) {
    assert.throws(() => parseIsoDateTime(value, "test"), {
      message: /non è una stringa/,
    });
  }
});

test("withValidDate ferma il caricamento e indica il file", () => {
  assert.throws(
    () =>
      withValidDate(
        { title: "x", date: "2026-11-12" },
        "content/video/nuovo.mdx",
      ),
    {
      message:
        /^content\/video\/nuovo\.mdx: date: "2026-11-12" non ha il fuso orario/,
    },
  );
  const ok = withValidDate(
    { title: "x", date: "2026-11-12T08:00:31Z" },
    "f.mdx",
  );
  assert.deepEqual(ok, { title: "x", date: "2026-11-12T08:00:31Z" });
});

test("toEpoch confronta istanti anche con fusi diversi", () => {
  const utc = parseIsoDateTime("2026-11-12T08:00:31Z", "test");
  const rome = parseIsoDateTime("2026-11-12T09:00:31+01:00", "test");
  const pacific = parseIsoDateTime("2026-11-12T00:00:31-08:00", "test");
  assert.equal(toEpoch(utc), toEpoch(rome));
  assert.equal(toEpoch(utc), toEpoch(pacific));
});
