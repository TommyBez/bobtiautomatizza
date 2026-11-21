// Modulo senza import: lo esegue anche `node --test`.

/**
 * Tutte le proprietà schema.org che ammettono un DateTime, con gli altri tipi che ammettono oltre a DateTime
 * (lista vuota = solo DateTime). Ricavata dal vocabolario ufficiale schema.org 30.1
 * (https://schema.org/version/latest/schemaorg-current-https.jsonld): proprietà con `DateTime` in
 * `rangeIncludes`, escluse quelle sostituite o nell'area "attic". La usa lib/json-ld.ts.
 */
export const schemaDateTimeProperties: Readonly<
  Record<string, readonly ("Date" | "Integer" | "Text" | "Time" | "URL")[]>
> = {
  arrivalTime: ["Time"],
  auditDate: ["Date"],
  availabilityEnds: ["Date", "Time"],
  availabilityStarts: ["Date", "Time"],
  availableFrom: [],
  availableThrough: [],
  bookingTime: [],
  checkinTime: ["Time"],
  checkoutTime: ["Time"],
  commentTime: ["Date"],
  contentReferenceTime: [],
  coverageEndTime: [],
  coverageStartTime: [],
  cvdCollectionDate: ["Text"],
  dateCreated: ["Date"],
  dateDeleted: ["Date"],
  dateIssued: ["Date"],
  dateModified: ["Date"],
  datePosted: ["Date"],
  datePublished: ["Date"],
  dateRead: ["Date"],
  dateReceived: [],
  dateSent: [],
  departureTime: ["Time"],
  doorTime: ["Time"],
  dropoffTime: [],
  endDate: ["Date"],
  endTime: ["Time"],
  exceptDate: ["Date"],
  expectedArrivalFrom: ["Date"],
  expectedArrivalUntil: ["Date"],
  expires: ["Date"],
  merchantReturnDays: ["Date", "Integer"],
  modifiedTime: [],
  observationDate: ["Date"],
  orderDate: ["Date"],
  ownedFrom: [],
  ownedThrough: [],
  paymentDueDate: ["Date"],
  pickupTime: [],
  previousStartDate: ["Date"],
  scheduledTime: ["Date"],
  startDate: ["Date"],
  startTime: ["Time"],
  temporal: ["Text"],
  temporalCoverage: ["Text", "URL"],
  timestamp: [],
  uploadDate: ["Date"],
  validFrom: ["Date"],
  validThrough: ["Date"],
  webCheckinTime: [],
};
