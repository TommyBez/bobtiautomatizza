export const site = {
  name: "Bob ti automatizza",
  url: "https://bobtiautomatizza.com",
  headline:
    "Ti spiego come usare l'AI per toglierti di dosso il lavoro ripetitivo.",
  sub: "Video brevi e pratici, anche se non scrivi codice.",
  description:
    "Ti spiego come usare l'AI per toglierti di dosso il lavoro ripetitivo. Video brevi e pratici, anche se non scrivi codice.",
  // Formato del lunedì: il nome è quello usato su YouTube. "Pillola" resta la parola per la singola puntata.
  monday: "Il lunedì dell'AI",
  mondayPath: "/lunedi-ai",
  youtube: "https://www.youtube.com/channel/UC1wxgtLY8iWdx0c-Jq0zFcA",
  instagram: "https://www.instagram.com/bobtiautomatizza/",
  linkedin: "https://www.linkedin.com/in/tcarnemolla/",
  owner: "Tommaso Carnemolla",
  vat: "07516690489",
  // Email per le richieste privacy (obbligatoria nell'informativa). Se torna null, la pagina /privacy
  // blocca la build di produzione, così non si va online con un'informativa incompleta.
  privacyEmail: "privacy@bobtiautomatizza.com" as string | null,
  legalUpdated: "10 novembre 2026",
};

export const nav = [
  { href: "/video", label: "Video" },
  { href: "/lunedi-ai", label: "Il lunedì dell'AI" },
  { href: "/metodo", label: "Il metodo" },
  { href: "/chi-sono", label: "Chi sono" },
] as const;

export const businessTypes = [
  "Agenzia",
  "Attività locale",
  "Studio o professionista",
  "Startup",
  "Altro",
];

export const metodo = [
  {
    n: "01",
    title: "Capisci il processo",
    text: "Scrivi i passaggi come li fai oggi, anche quelli che sembrano ovvi.",
  },
  {
    n: "02",
    title: "Ripuliscilo",
    text: "Togli quello che non serve. Spesso una parte del lavoro sparisce già qui.",
  },
  {
    n: "03",
    title: "Mettici l'AI",
    text: "Solo adesso scegli lo strumento, per i passaggi che restano.",
  },
];

const dateFormat = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Rome",
});
const shortDateFormat = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Rome",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatShortDate = (iso: string) =>
  shortDateFormat.format(new Date(iso));
