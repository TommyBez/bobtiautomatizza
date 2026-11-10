# Architettura del sito — bobtiautomatizza.com

**Versione:** v2 · 2026-11-10 · Legge `.agents/product-marketing.md` per posizionamento e voce.

## Decisioni
- Obiettivo: casa dei contenuti di Bob, crea fiducia e seguito. Il servizio non è nominato.
- Conversione: newsletter del lunedì (email + "Che tipo di attività hai?" facoltativo). Secondario: YouTube e Instagram.
- Solo italiano, `lang="it"`, dominio `bobtiautomatizza.com` (registrato su Vercel; `.it` libero).
- Contenuti in MDX nel repo. Bozze generate dalle trascrizioni e riviste a mano (non raccontato sul sito).
- Niente cookie di tracciamento: Vercel Web Analytics, YouTube `youtube-nocookie` caricato al clic, niente pixel. Servono privacy policy (newsletter) e cookie policy breve.
- Titolare: Tommaso Carnemolla, P.IVA 07516690489 (nel footer). Contatto privacy: privacy@bobtiautomatizza.com (ricezione su Resend). Informativa `/privacy` e cookie policy `/cookie` scritte a mano da rileggere con un legale; il sito non usa cookie.
- Lancio (decisione del 2026-11-10): si esce con i contenuti esistenti, 3 video + 2 puntate del lunedì, più /metodo e /chi-sono. La soglia iniziale di 6 video è stata abbandonata.
- Nome del formato del lunedì: «Il lunedì dell'AI» (come su YouTube); «pillola» resta la parola per la singola puntata.

## Gerarchia
```
/                           Home
├── /video                  Archivio video divulgativi (filtro per argomento quando esistono)
│   └── /video/[slug]       Pagina del video
├── /lunedi-ai             Archivio de «Il lunedì dell'AI»
│   └── /lunedi-ai/[data]   Una puntata, «pillola» (es. /lunedi-ai/2026-11-09)
├── /argomenti/[slug]       Hub argomento (solo da 3 video in su; generato dai tag dei video)
├── /casi/[slug]            Caso reale (anonimo, es. /casi/agenzia-di-marketing)
├── /metodo                 Il metodo di Bob
├── /chi-sono               Chi c'è dietro Bob
├── /newsletter             Iscrizione + /newsletter/grazie
├── /privacy
└── /cookie
```

## Mappa URL
| Pagina | URL | Padre | Nav | Priorità |
|---|---|---|---|---|
| Home | `/` | — | logo | alta |
| Video | `/video` | Home | header | alta |
| Video singolo | `/video/[slug]` | Video | — | alta (SEO) |
| Il lunedì dell'AI | `/lunedi-ai` | Home | header | media |
| Puntata | `/lunedi-ai/[data]` | Il lunedì dell'AI | — | media |
| Argomento | `/argomenti/[slug]` | Video | sottomenu Video (quando esiste) | media |
| Caso | `/casi/[slug]` | Home | home; header da 2 casi | media |
| Il metodo | `/metodo` | Home | header | alta |
| Chi sono | `/chi-sono` | Home | header | alta |
| Newsletter | `/newsletter` | Home | CTA header | alta |
| Privacy, Cookie | `/privacy`, `/cookie` | Home | footer | bassa |

## Navigazione
- **Header:** logo (Bob + "Bob ti automatizza") · Video · Il lunedì dell'AI · Il metodo · Chi sono · [Iscriviti] (CTA a destra). Il sottomenu argomenti di "Video" compare solo quando esiste il primo argomento con 3 video.
- **Footer:** Contenuti (Video, Pillole, Il metodo) · Bob (Chi sono, YouTube, Instagram, LinkedIn) · Legale (Privacy, Cookie) · "Tommaso Carnemolla · P.IVA …".
- **Breadcrumb:** sulle pagine di dettaglio (Home › Video › Titolo), con BreadcrumbList.
- I giorni di uscita non compaiono sul sito (non sono fissi).

## Modelli di pagina
**Home:** hero (Bob, "Ti spiego come usare l'AI per toglierti di dosso il lavoro ripetitivo.", "Video brevi e pratici, anche se non scrivi codice.", form newsletter, link YouTube/Instagram) → ultimi video + ultima pillola → il metodo in 3 passi ("Prima capisci il processo. Poi ci metti l'AI.") → caso reale (anteprima) → chi c'è dietro Bob → newsletter.

**Video (`/video/[slug]`):** sempre: H1 scritto come una ricerca Google (titolo YouTube come sottotitolo), meta (argomento, strumenti, "senza codice", durata, data), video al clic, "In breve" (3 punti). Solo se servono: il lavoro ripetitivo di partenza, i passaggi, prompt e modelli da copiare (liberi, mai dietro email), errori da evitare. Poi correlati e box newsletter. Schema: VideoObject + BreadcrumbList.

**Puntata del lunedì (`/lunedi-ai/[data]`):** video, poi elenco novità con 1-2 righe "cosa cambia per te" e link alla fonte; video della settimana; box newsletter. La newsletter del lunedì è la versione email della pillola.

**Argomento:** intro breve, elenco video, link al metodo.

## Linking interno
- Ogni video linka il suo argomento (quando esiste), 2-3 correlati, e /metodo quando il video applica un passo del metodo.
- /metodo linka i video che mostrano ciascun passo (hub del sito).
- Ogni pagina ha un box newsletter; nessuna pagina orfana (tutto parte da /video, /lunedi-ai o dalla home).

## Newsletter (Resend + React Email)
- Account Resend esistente di Tommaso (non quello del Marketplace Vercel). Dominio `bobtiautomatizza.com`: invio verificato (DKIM/SPF), MX di ricezione non necessario.
- Su Resend: segmento «Bob ti automatizza», argomento «Il lunedì dell'AI» (opt_out di default, attivato solo alla conferma), campo contatto `attivita`. I contatti Resend sono condivisi da tutto l'account: l'iscrizione a Bob passa solo da segmento + argomento, mai da `unsubscribed`.
- Doppia conferma senza database: link firmato HMAC (`NEWSLETTER_SECRET`, validità 7 giorni) → `/newsletter/conferma` → pulsante «Conferma» (i filtri antispam che aprono i link non confermano da soli). Campo trappola `sito` contro i bot.
- In produzione i link nelle email usano sempre `site.url`, mai l'header `host`.
- Template in `emails/` (React Email): `conferma-iscrizione`, `lunedi-ai`. Anteprima: `pnpm email` (porta 3200).
- Variabili: `RESEND_API_KEY`, `NEWSLETTER_SECRET` (Vercel Production + Preview come segreti, `.env.local` in sviluppo).

## Riferimenti Mobbin (giro del 2026-11-09)
- Hero con personaggio al centro e titolo editoriale: [Town](https://mobbin.com/sites/sections/bbcbaabb-fcaf-45f2-acd4-13c24ffd23ed), [Town routines con etichette](https://mobbin.com/sites/sections/7091dd62-c573-40b8-aa73-dcf32ff7e860), [MANA](https://mobbin.com/sites/sections/1bdcc550-68a0-4c2b-b010-473839dbf7bc), [Charma](https://mobbin.com/sites/sections/4f347562-6b67-4d01-ae3f-9dbcd1209ed6).
- Hero newsletter con form: [Teachable 9-5 Quitters Club](https://mobbin.com/sites/sections/2af7c8c3-487d-4540-b3eb-01c5646f2c7e), [The Leap](https://mobbin.com/sites/sections/5fde18bd-2869-43a7-9842-5ccc7d26de5f), [Podia banda newsletter](https://mobbin.com/sites/sections/a7b701ed-1e43-4557-9333-fc83d66ed3d1).
- Archivi video: [Framer Videos](https://mobbin.com/sites/sections/5ca74586-38a0-4400-88de-4c7988259e45), [Typeform tutorial colorati](https://mobbin.com/sites/sections/d1a00aa8-018a-4de4-b938-3a6a6929c291), [Descript con tab](https://mobbin.com/sites/sections/868651d8-ffe3-4ffb-bf10-6f338ec6e44f).
- Pagina con video + testo: [NN/g su Matter, trascrizione accanto al video](https://mobbin.com/screens/93dc0dbd-a31c-4720-ae35-43112a852628), [Codecademy articolo con indice](https://mobbin.com/screens/4685acfd-ce18-451f-8621-3b9958dda6ae), [Neon blocchi da copiare](https://mobbin.com/screens/94fb6fc0-0fb0-4358-b6da-534a1f5addb9).
- Archivio per data (pillole): [Substack archive](https://mobbin.com/screens/ab559473-d1dd-44d4-8332-9679d2a363a0), [Canny changelog](https://mobbin.com/screens/32a827a7-bbaf-4184-942d-d52462742365).
- Chi sono: [incident.io lettera con firma](https://mobbin.com/sites/sections/67e11461-af20-4b7e-8e9a-8f0cdc669a8d), [Kalstore foto + storia](https://mobbin.com/sites/sections/5e1e6047-eef1-417c-b42b-c7ab44205e35).
- Metodo in 3 passi: [Teak](https://mobbin.com/sites/sections/21c66e06-7eec-424d-8727-6f4906e0b43b), [Beside](https://mobbin.com/sites/sections/2cfd3169-f61f-4ca5-bd2a-67627febbc84).
