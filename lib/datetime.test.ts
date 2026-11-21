import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isoDateTimeFormat,
  parseIsoDate,
  parseIsoDateTime,
  toEpoch,
  withValidDate,
} from "./datetime.ts";

/** Accettato vuol dire anche: corrisponde a un istante (toEpoch non è mai NaN). */
const accepts = (value: string) => {
  assert.equal(parseIsoDateTime(value, "test"), value, value);
  assert.ok(Number.isFinite(toEpoch(parseIsoDateTime(value, "test"))), value);
};
const rejects = (value: unknown, message: RegExp) =>
  assert.throws(
    () => parseIsoDateTime(value, "test"),
    { message },
    String(value),
  );

test("accetta UTC con Z e l'offset giusto di Europe/Rome", () => {
  for (const value of [
    "2026-11-12T08:00:31Z",
    "2026-11-12T09:00:31+01:00", // ora solare
    "2026-07-12T10:00:31+02:00", // ora legale
    "2026-11-12T08:00Z",
    "2026-11-12T08:00:31.2Z",
    "2026-11-12T08:00:31.250+01:00",
    "0050-01-01T00:00:00Z", // anno a 4 cifre anche sotto il 100
  ]) {
    accepts(value);
  }
});

test("il formato è uno solo: parser e regex esportata dicono la stessa cosa", () => {
  for (const value of [
    "2026-11-12T08:00:31Z",
    "2026-11-12T08:00Z",
    "2026-11-12T08:00:31.250Z",
    "2026-11-12T08:00:31.2500Z", // più di 3 cifre di frazione
    "2026-11-12T08:00.5Z", // frazione senza secondi
    "26-11-12T08:00:31Z", // anno a 2 cifre
    "+002026-11-12T08:00:31Z", // anno esteso
    "2026-11-12t08:00:31z",
    "2026-11-12T08:00:31+0100",
  ]) {
    let parsed = true;
    try {
      parseIsoDateTime(value, "test");
    } catch {
      parsed = false;
    }
    assert.equal(parsed, isoDateTimeFormat.test(value), value);
  }
});

test("rifiuta una data senza fuso orario", () => {
  for (const value of [
    "2026-11-12",
    "2026-11-12T09:00:31",
    "2026-11-12T09:00",
  ]) {
    assert.throws(() => parseIsoDateTime(value, "content/video/x.mdx: date"), {
      message: /^content\/video\/x\.mdx: date: .* non ha il fuso orario/,
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
  ]) {
    rejects(value, /non è una data e ora esistente/);
  }
  for (const value of [
    "2026-11-12T09:00:00+0100",
    "2026-11-12 09:00:00Z",
    "12/11/2026",
    "12 novembre 2026",
    "",
  ]) {
    rejects(value, /non è un datetime ISO 8601/);
  }
  for (const value of [
    undefined,
    null,
    20261112,
    new Date("2026-11-12T08:00:31Z"),
  ]) {
    rejects(value, /non è una stringa/);
  }
});

test("rifiuta -00:00 e gli offset che non sono quelli di Roma in quell'istante", () => {
  rejects("2026-11-12T08:00:31-00:00", /"-00:00".*fuso sconosciuto/);
  rejects(
    "2026-11-12T08:00:31+00:00",
    /ha offset \+00:00, ma a Roma in quell'istante è \+01:00/,
  );
  rejects(
    "2026-11-12T00:00:31-08:00",
    /ha offset -08:00, ma a Roma in quell'istante è \+01:00/,
  );
  rejects(
    "2026-11-12T10:00:31+02:00",
    /ha offset \+02:00, ma a Roma in quell'istante è \+01:00/,
  );
  rejects(
    "2026-07-12T09:00:31+01:00",
    /ha offset \+01:00, ma a Roma in quell'istante è \+02:00/,
  );
  rejects("2026-11-12T09:00:31+15:00", /ha offset \+15:00/);
});

test("rifiuta gli offset malformati, anche se numericamente sarebbero giusti", () => {
  // "+00:60" vale +01:00 e "+01:60" vale +02:00, ma non sono offset ISO 8601: prima passavano e davano NaN.
  rejects(
    "2026-11-12T09:00:31+00:60",
    /offset non valido \(\+00:60\): i minuti vanno da 00 a 59/,
  );
  rejects(
    "2026-07-12T10:00:31+01:60",
    /offset non valido \(\+01:60\): i minuti vanno da 00 a 59/,
  );
  rejects("2026-11-12T09:00:31+01:99", /offset non valido/);
  // Minuti nella scala ma offset diverso da quello di Roma, testualmente.
  rejects(
    "2026-11-12T09:00:31+01:01",
    /ha offset \+01:01, ma a Roma in quell'istante è \+01:00/,
  );
  rejects("2026-11-12T09:00:31+24:00", /ha offset \+24:00/);
  // La forma giusta passa e ha un istante.
  accepts("2026-11-12T10:00:31+01:00");
  accepts("2026-07-12T11:00:31+02:00");
});

test("ogni valore accettato ha un istante valido", () => {
  const samples: string[] = [];
  // Ogni ora di due giorni di cambio d'ora e di due giorni normali, con tutti gli offset plausibili.
  for (const day of ["2026-03-29", "2026-10-25", "2026-01-15", "2026-07-15"]) {
    for (let h = 0; h < 24; h++) {
      for (const zone of [
        "Z",
        "+01:00",
        "+02:00",
        "+00:60",
        "+01:60",
        "-00:00",
      ]) {
        samples.push(`${day}T${String(h).padStart(2, "0")}:30:00${zone}`);
      }
    }
  }
  let accepted = 0;
  for (const value of samples) {
    try {
      const parsed = parseIsoDateTime(value, "test");
      accepted++;
      assert.ok(Number.isFinite(toEpoch(parsed)), value);
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
    }
  }
  // Z: 4 giorni × 24 ore. Offset giusto: 24 ore nei giorni normali, 23 nei due cambi d'ora
  // (le 02:30 del 29/3 non esistono, quelle del 25/10 sono ambigue). Mai +00:60, +01:60, -00:00.
  assert.equal(accepted, 4 * 24 + 24 + 24 + 23 + 23);
});

test("cambio d'ora del 29 marzo 2026: le 02:00–02:59 a Roma non esistono", () => {
  accepts("2026-03-29T01:59:59+01:00");
  accepts("2026-03-29T03:00:00+02:00");
  for (const value of [
    "2026-03-29T02:00:00+01:00",
    "2026-03-29T02:30:00+01:00",
    "2026-03-29T02:59:59+02:00",
  ]) {
    rejects(value, /a Roma non esiste \(cambio d'ora\)/);
  }
  rejects("2026-03-29T03:00:00+01:00", /a Roma in quell'istante è \+02:00/);
  rejects("2026-03-29T01:59:59+02:00", /a Roma in quell'istante è \+01:00/);
  accepts("2026-03-29T01:30:00Z"); // in UTC ogni istante va bene
});

test("cambio d'ora del 25 ottobre 2026: le 02:00–02:59 a Roma sono ambigue", () => {
  accepts("2026-10-25T01:59:59+02:00");
  accepts("2026-10-25T03:00:00+01:00");
  for (const value of [
    "2026-10-25T02:00:00+02:00",
    "2026-10-25T02:30:00+02:00",
    "2026-10-25T02:30:00+01:00",
    "2026-10-25T02:59:59+01:00",
  ]) {
    rejects(value, /a Roma è ambigua \(cambio d'ora\)/);
  }
  rejects("2026-10-25T03:00:00+02:00", /a Roma in quell'istante è \+01:00/);
  accepts("2026-10-25T00:30:00Z"); // le 02:30 della prima volta, scritte in UTC
  accepts("2026-10-25T01:30:00Z"); // le 02:30 della seconda volta
});

test("parseIsoDate accetta solo date di calendario esistenti", () => {
  assert.equal(parseIsoDate("2026-12-31", "test"), "2026-12-31");
  assert.throws(
    () => parseIsoDate("2026-11-31", "test"),
    /non è una data esistente/,
  );
  assert.throws(
    () => parseIsoDate("2026-11-12T00:00Z", "test"),
    /non è una data esistente/,
  );
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
  assert.equal(toEpoch(utc), toEpoch(rome));
});
