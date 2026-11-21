import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDateTime } from "./datetime.ts";
import {
  assertJsonLdDateTimes,
  serializeJsonLd,
  videoObjectJsonLd,
} from "./json-ld.ts";

const uploadDate = "2026-11-12T08:00:31Z" as IsoDateTime;
const video = (extra: Record<string, unknown> = {}) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "x",
  uploadDate,
  ...extra,
});
const rejects = (data: object, message: RegExp) =>
  assert.throws(() => assertJsonLdDateTimes(data), { message });

test("serializeJsonLd scrive lo stesso JSON di prima, con < sostituito", () => {
  const data = videoObjectJsonLd(
    { title: "a < b", description: "d", youtubeId: "x", date: uploadDate },
    ["https://example.com/c.webp"],
  );
  assert.equal(
    serializeJsonLd(data),
    JSON.stringify(data).replace(/</g, "\\u003c"),
  );
  assert.ok(!serializeJsonLd(data).includes("<"));
});

test("il JSON-LD rifiuta un uploadDate senza fuso (anche al typecheck)", () => {
  rejects(
    videoObjectJsonLd({
      title: "",
      description: "",
      youtubeId: "x",
      // @ts-expect-error: una stringa qualsiasi non è un IsoDateTime, quindi non passa il typecheck.
      date: "2026-11-12",
    }),
    /JSON-LD\.uploadDate: "2026-11-12" non ha il fuso orario/,
  );
});

test("controlla tutti i datetime del VideoObject", () => {
  rejects(
    video({ expires: "2026-12-31" }),
    /JSON-LD\.expires: "2026-12-31" non ha il fuso/,
  );
  rejects(
    video({ contentReferenceTime: "2026-11-12T09:00" }),
    /JSON-LD\.contentReferenceTime: .* non ha il fuso/,
  );
  rejects(
    video({ contentReferenceTime: "2026-11-12T00:00:00-08:00" }),
    /contentReferenceTime: .* ma a Roma in quell'istante è \+01:00/,
  );
  rejects(
    video({ datePublished: "2026-11-12T09:00:00" }),
    /JSON-LD\.datePublished/,
  );
  rejects(
    video({ uploadDate: null }),
    /JSON-LD\.uploadDate: null non è una stringa/,
  );
  rejects(
    video({ uploadDate: 1763020831000 }),
    /JSON-LD\.uploadDate: .* non è una stringa/,
  );
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes(
      video({
        expires: "2027-11-12T09:00:00+01:00",
        contentReferenceTime: "2026-07-12T10:00:00+02:00",
        datePublished: "2026-11-12", // per schema.org e per Google qui una data va bene
      }),
    ),
  );
});

test("controlla anche le chiavi in forma estesa https://schema.org/…", () => {
  rejects(
    {
      "@type": "https://schema.org/VideoObject",
      "https://schema.org/uploadDate": "2026-11-12",
    },
    /JSON-LD\.https:\/\/schema\.org\/uploadDate: "2026-11-12" non ha il fuso/,
  );
  rejects(
    { "http://schema.org/contentReferenceTime": "2026-11-12T09:00" },
    /non ha il fuso/,
  );
  rejects(
    { "@type": ["schema:VideoObject"], "schema:expires": "2026-12-31" },
    /non ha il fuso/,
  );
});

test("controlla il valore serializzato, cioè dopo toJSON()", () => {
  rejects(
    video({ uploadDate: { toJSON: () => "2026-11-12" } }),
    /uploadDate: "2026-11-12"/,
  );
  rejects(
    { "@graph": [{ toJSON: () => video({ expires: "2026-12-31" }) }] },
    /JSON-LD\.@graph\[0\]\.expires: "2026-12-31"/,
  );
  // Date.toJSON() dà un datetime UTC completo: va bene, ed è quello che finisce nella pagina.
  const data = video({ uploadDate: new Date("2026-11-12T08:00:31Z") });
  assert.equal(
    JSON.parse(serializeJsonLd(data)).uploadDate,
    "2026-11-12T08:00:31.000Z",
  );
  // Un valore che sembra giusto ma serializza male viene rifiutato.
  rejects(
    video({ uploadDate: new Date("non è una data") }),
    /uploadDate: null non è una stringa/,
  );
});

test("controlla array, oggetti valore e livelli annidati", () => {
  rejects(
    video({ uploadDate: [uploadDate, "2026-11-12"] }),
    /JSON-LD\.uploadDate\[1\]/,
  );
  rejects(
    video({ uploadDate: { "@value": "2026-11-12", "@type": "DateTime" } }),
    /JSON-LD\.uploadDate\.@value: "2026-11-12"/,
  );
  rejects(
    video({
      publication: [
        {
          "@type": "BroadcastEvent",
          isLiveBroadcast: true,
          startDate: "2026-11-12",
        },
      ],
    }),
    /JSON-LD\.publication\[0\]\.startDate: "2026-11-12" non ha il fuso/,
  );
  rejects(
    video({ hasPart: [{ "@type": "Clip", contentReferenceTime: "domani" }] }),
    /JSON-LD\.hasPart\[0\]\.contentReferenceTime: "domani" non è un datetime/,
  );
});

test("controlla solo i DateTime: Date e Time validi di altri schemi passano", () => {
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "Offer",
      priceValidUntil: "2026-12-31", // Offer.priceValidUntil è una Date
      validFrom: "2026-11-12", // Date o DateTime
      availabilityStarts: "09:00:00", // Date, DateTime o Time
    }),
  );
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "Schedule",
      startTime: "09:00:00", // Schedule.startTime: DateTime o Time
      endTime: "10:30",
      startDate: "2026-11-12",
      repeatFrequency: "P1W",
    }),
  );
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "Event",
      startDate: "2026-11-12", // Event.startDate: Date o DateTime
      temporalCoverage: "2026/2027", // DateTime, Text o URL
      merchantReturnDays: 30, // Date, DateTime o Integer
      name: "2026-11-12",
      birthDate: "1990-01-01",
    }),
  );
  // Dove lo schema ammette anche altro, un valore scritto come datetime deve comunque essere completo…
  rejects(
    { "@type": "Event", startDate: "2026-11-12T21:00" },
    /startDate: .* non ha il fuso/,
  );
  rejects(
    { "@type": "Schedule", startTime: "2026-11-12T09:00:00" },
    /non ha il fuso/,
  );
  // …e una data deve esistere.
  rejects(
    { "@type": "Event", startDate: "2026-11-31" },
    /non è una data esistente/,
  );
  // Per Google uploadDate ed expires del VideoObject sono DateTime: la sola data non basta.
  rejects(video({ uploadDate: "2026-11-12" }), /non ha il fuso/);
});

test("BroadcastEvent: DateTime obbligatorio solo dentro VideoObject.publication", () => {
  // Badge LIVE della guida Google: publication del VideoObject.
  rejects(
    video({
      publication: {
        "@type": "BroadcastEvent",
        isLiveBroadcast: true,
        startDate: "2026-11-12",
      },
    }),
    /JSON-LD\.publication\.startDate: "2026-11-12" non ha il fuso/,
  );
  rejects(
    video({
      "https://schema.org/publication": [
        { "@type": "https://schema.org/BroadcastEvent", endDate: "2026-11-12" },
      ],
    }),
    /publication\[0\]\.endDate: "2026-11-12" non ha il fuso/,
  );
  // Un BroadcastEvent autonomo segue schema.org, che per startDate/endDate ammette una data.
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "BroadcastEvent",
      startDate: "2026-11-12",
      endDate: "2026-11-13",
    }),
  );
  // …e anche in un altro nodo che non è un VideoObject.
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "Event",
      publication: { "@type": "BroadcastEvent", startDate: "2026-11-12" },
    }),
  );
  // Ma un datetime scritto, ovunque sia, deve comunque essere completo.
  rejects(
    { "@type": "BroadcastEvent", startDate: "2026-11-12T21:00" },
    /non ha il fuso/,
  );
});

test("il controllo legge tipi e valori del JSON emesso, non dell'oggetto di partenza", () => {
  // @type con toJSON(): nel JSON emesso è un VideoObject, quindi uploadDate deve essere un DateTime.
  const emitted = {
    "@type": { toJSON: () => "VideoObject" },
    uploadDate: "2026-11-12",
  };
  assert.match(JSON.stringify(emitted), /"@type":"VideoObject"/);
  rejects(emitted, /JSON-LD\.uploadDate: "2026-11-12" non ha il fuso/);
  rejects(
    {
      "@type": ["Thing", { toJSON: () => "https://schema.org/VideoObject" }],
      expires: "2026-12-31",
    },
    /JSON-LD\.expires: "2026-12-31" non ha il fuso/,
  );
  // [undefined] viene scritto come [null]: null non è un datetime.
  rejects(
    video({ uploadDate: [undefined] }),
    /JSON-LD\.uploadDate\[0\]: null non è una stringa/,
  );
  rejects(
    video({ contentReferenceTime: [() => 1] }),
    /contentReferenceTime\[0\]: null/,
  );
  // Datatype dichiarato esplicitamente: xsd:dateTime con la sola data è un errore, ovunque sia.
  rejects(
    video({
      datePublished: { "@value": "2026-11-12", "@type": "xsd:dateTime" },
    }),
    /JSON-LD\.datePublished\.@value: "2026-11-12" non ha il fuso/,
  );
  rejects(
    video({
      dateModified: {
        "@value": "2026-11-12",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      },
    }),
    /dateModified\.@value/,
  );
  rejects(
    {
      "@type": "Thing",
      qualcosa: { "@value": "domani", "@type": "xsd:dateTime" },
    },
    /JSON-LD\.qualcosa\.@value: "domani"/,
  );
  // xsd:date con una data valida, dove lo schema la ammette, passa; dove serve un DateTime no.
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes(
      video({ datePublished: { "@value": "2026-11-12", "@type": "xsd:date" } }),
    ),
  );
  rejects(
    video({ uploadDate: { "@value": "2026-11-12", "@type": "xsd:date" } }),
    /uploadDate\.@value: "2026-11-12" non ha il fuso/,
  );
  // Quello che viene scritto nella pagina è esattamente il JSON controllato.
  const data = video({
    uploadDate: new Date("2026-11-12T08:00:31Z"),
    extra: [undefined],
  });
  assert.equal(serializeJsonLd(data), JSON.stringify(data));
});
