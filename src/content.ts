export const company = {
  name: 'A2O Anlæg & Entreprise',
  phone: '+45 53 63 22 20',
  tel: 'tel:+4553632220',
  cvr: '45871711',
  instagram: { label: 'Instagram', handle: '@a2o_entreprise', href: 'https://www.instagram.com/a2o_entreprise/' },
  facebook: { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100069012435914' },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/company/109758118/' },
}

export const nav = [
  { label: 'Om os', href: '#om' },
  { label: 'Ydelser', href: '#ydelser' },
  { label: 'Mandskab', href: '#mandskab' },
  { label: 'Projekter', href: '#projekter' },
  { label: 'Ledelse', href: '#ledelse' },
  { label: 'Kontakt', href: '#kontakt' },
] as const

export const hero = {
  eyebrow: 'A2O ANLÆG & ENTREPRISE — HELE DANMARK',
  lines: ['Kvalitet og', 'ekspertise', 'i hvert', 'projekt'],
  lead: 'Velkommen til A2O Anlæg & Entreprise. Vi stiller erfarent og dygtigt mandskab til bygge- og anlægsprojekter i hele Danmark, fra første spadestik til færdigt resultat.',
  cta: 'Tag fat i os',
  call: 'Ring +45 53 63 22 20',
  hint: 'SCROLL NED',
}

/** Photo descriptor: files live in /public/photos as <name>-<width>.webp */
export type Img = { name: string; w: number; h: number; widths: readonly number[]; alt: string; pos: string }

export const about = {
  label: 'OM OS',
  title: 'En moderne tilgang til mandskabs­levering',
  lead: 'A2O blev stiftet for at levere mandskab af højeste kvalitet til byggeprojekter. Bag os står et dedikeret team med mange års erfaring.',
  pull: 'Én fast partner fra start til slut.',
  rows: [
    { k: 'A', t: 'Effektiv udvælgelse og levering.', d: 'En enkel proces fra behov til mand på pladsen.' },
    { k: 'B', t: 'Mindre administration.', d: 'Vi tager os af det praktiske, så I kan fokusere på byggeriet.' },
    { k: 'C', t: 'Hurtig og præcis matching.', d: 'Folk, der passer ind i jeres eksisterende team.' },
  ],
  projects: [
    {
      caption: 'Projekt for AKF Ejendomme A/S',
      img: { name: 'om-1', w: 1440, h: 1920, widths: [640, 1000], pos: '50% 45%', alt: 'Afstivet udgravning med gravemaskine og arbejdere, projekt for AKF Ejendomme A/S' } satisfies Img,
    },
    {
      caption: 'Projekt for G.V.L Entreprise A/S',
      img: { name: 'om-project', w: 1440, h: 1920, widths: [640, 1000], pos: '50% 55%', alt: 'Arbejdere ved en åben udgravning, projekt for G.V.L Entreprise A/S' } satisfies Img,
    },
  ],
}

export const services = {
  label: 'YDELSER',
  title: 'Vores ydelser',
  lead: 'Vi leverer specialiserede mandskabsløsninger og udfører entreprenøropgaver inden for en bred vifte af anlægs- og byggeprojekter. Anlægsarbejde, belægning, beton, tømrer & maskin- og kranarbejde.',
  items: [
    { n: '01', t: 'Anlægsgartnere', d: 'Grønt serviceteam til hækklipning, beskæring, græsslåning og ukrudtsbekæmpelse for virksomheder, boligforeninger og private.', img: { name: 'svc-anlaegsgartnere-crop', w: 1000, h: 750, widths: [640, 1000], pos: '50% 50%', alt: 'Nyanlagt græsplæne og belægning i en have' } satisfies Img },
    { n: '02', t: 'Banearbejdere', d: 'Alle typer spor: etablering, vedligehold og justering.', img: { name: 'svc-banearbejdere', w: 1920, h: 1187, widths: [640, 1200, 1920], pos: '50% 50%', alt: 'Banearbejdere ved jernbanespor' } satisfies Img },
    { n: '03', t: 'Brolæggere', d: 'Brosten og kantsten lagt med præcision. Vores folk betjener også minigravere og dumpere.', img: { name: 'hero-site', w: 1402, h: 1122, widths: [640, 1200], pos: '50% 60%', alt: 'Brolægger på knæ ved nylagt belægning' } satisfies Img },
    { n: '04', t: 'Tømrere', d: 'Tagkonstruktioner, renovering og indvendigt tømrerarbejde.', img: { name: 'svc-toemrere', w: 1448, h: 1086, widths: [640, 1200], pos: '50% 50%', alt: 'Tømrere i gang med tagkonstruktion' } satisfies Img },
    { n: '05', t: 'Maskinførere', d: 'Præcis og sikker betjening af entreprenørmaskiner.', img: { name: 'home-1', w: 1402, h: 1122, widths: [640, 1200], pos: '50% 55%', alt: 'Gul dumper med fører på mudret byggeplads' } satisfies Img },
    { n: '06', t: 'Betonarbejdere', d: 'Fra støbning af fundament til færdig råhus.', img: { name: 'crew', w: 1200, h: 1600, widths: [640, 1000], pos: '50% 60%', alt: 'To arbejdere ved armeringsnet og forskalling' } satisfies Img },
  ],
}

export const crew = {
  label: 'MANDSKAB',
  title: 'Fremtidens standarder i byggeri',
  sub: 'Byggeri uden kompromis',
  lead: 'Vores vision er at løfte standarden for bygge- og anlægsprojekter, gennem samarbejde, nytænkning og kvalitet uden kompromis.',
  lines: [
    { k: 'ERFARENT MANDSKAB', v: 'Dygtige folk, der tager ansvar for resultatet.' },
    { k: 'FASTE KONTAKTER', v: 'Én ansvarlig partner gennem hele forløbet.' },
    { k: 'HELE DANMARK', v: 'Vores crews arbejder over hele landet.' },
  ],
  a: { name: 'svc-betonarbejdere', w: 1440, h: 1920, widths: [640, 1200], pos: '50% 42%', alt: 'Betonarbejder med vinkelsliber, gnister flyver' } satisfies Img,
  b: { name: 'vision', w: 1200, h: 1600, widths: [640, 1200], pos: '50% 40%', alt: 'Arbejder bøjer armeringsjern på en træplade' } satisfies Img,
}

export type Member = { name: string; role: string; phone: string; tel: string; email: string; photo?: Img }

export const team = {
  label: 'LEDELSE',
  title: 'Mød dem, der står bag',
  lead: 'Direkte adgang til ledelsen, når projektet kræver det.',
  members: [
    {
      name: 'Andrew Oseni', role: 'Direktør', phone: '53 63 22 20', tel: 'tel:+4553632220', email: 'ao@a2o.dk',
      photo: { name: 'team-andrew-oseni', w: 1140, h: 1464, widths: [640, 1140], pos: '50% 18%', alt: 'Andrew Oseni, direktør' },
    },
    { name: 'Yalcin Aydin', role: 'Teknisk direktør', phone: '50 73 06 73', tel: 'tel:+4550730673', email: 'ya@a2o.dk' },
  ] satisfies Member[],
}

export const contact = {
  label: 'KONTAKT',
  title: 'Lad os tage det fra start',
  lead: 'Fortæl os kort om projektet, så vender vi tilbage hurtigst muligt.',
  thanks: 'Tak. Vi har modtaget din besked.',
  thanksSub: 'Vi vender tilbage hurtigst muligt.',
}

export type Case = {
  slug: string; type: string; partner: string; place?: string; year?: string; teaser: string; intro: string; scope: string[]
  img: Img; gallery?: Img[]; placeholder?: boolean
}

const PH_INTRO = 'Pladsholdertekst: her beskriver vi opgaven, forløbet og resultatet, så snart A2O har leveret projektets detaljer og godkendt teksten.'
const PH_SCOPE = ['[Leverance 1]', '[Leverance 2]', '[Leverance 3]']

export const projects = {
  eyebrow: 'Udvalgte projekter',
  title: 'Udvalgte projekter',
  lead: 'Et udpluk af opgaver, vi har løst sammen med vores samarbejdspartnere. Træk i kortene, eller brug pilene.',
  cta: 'Se projektet',
  items: [
    {
      slug: 'akf-ejendomme', type: '[Type opgave]', partner: 'AKF Ejendomme A/S', place: '[Sted]', year: '[År]',
      teaser: 'Afstivet udgravning med gravemaskine og mandskab fra A2O. Detaljer følger.',
      intro: PH_INTRO, scope: PH_SCOPE, placeholder: true,
      img: { name: 'om-1', w: 1440, h: 1920, widths: [640, 1000], pos: '50% 45%', alt: 'Afstivet udgravning med gravemaskine og arbejdere, projekt for AKF Ejendomme A/S' },
    },
    {
      slug: 'gvl-entreprise', type: '[Type opgave]', partner: 'G.V.L Entreprise A/S', place: '[Sted]', year: '[År]',
      teaser: 'Arbejdere ved en åben udgravning. Detaljer følger.',
      intro: PH_INTRO, scope: PH_SCOPE, placeholder: true,
      img: { name: 'om-project', w: 1440, h: 1920, widths: [640, 1000], pos: '50% 55%', alt: 'Arbejdere ved en åben udgravning, projekt for G.V.L Entreprise A/S' },
    },
    {
      slug: 'fjernvarme', type: 'Fjernvarme', partner: '[Samarbejdspartner]', place: '[Sted]', year: '[År]',
      teaser: 'Pladsholder: kort beskrivelse af et fjernvarmeprojekt.',
      intro: PH_INTRO, scope: PH_SCOPE, placeholder: true,
      img: { name: 'home-1', w: 1402, h: 1122, widths: [640, 1200], pos: '50% 55%', alt: 'Gul dumper med fører på mudret byggeplads' },
    },
    {
      slug: 'belaegning', type: 'Belægning', partner: '[Samarbejdspartner]', place: '[Sted]', year: '[År]',
      teaser: 'Pladsholder: kort beskrivelse af et belægningsprojekt.',
      intro: PH_INTRO, scope: PH_SCOPE, placeholder: true,
      img: { name: 'hero-site', w: 1402, h: 1122, widths: [640, 1200], pos: '50% 60%', alt: 'Brolægger på knæ ved nylagt belægning' },
    },
    {
      slug: 'raahus-beton', type: 'Råhus & beton', partner: '[Samarbejdspartner]', place: '[Sted]', year: '[År]',
      teaser: 'Pladsholder: kort beskrivelse af et råhus- og betonprojekt.',
      intro: PH_INTRO, scope: PH_SCOPE, placeholder: true,
      img: { name: 'vision', w: 1200, h: 1600, widths: [640, 1200], pos: '50% 40%', alt: 'Arbejder bøjer armeringsjern på en træplade' },
    },
  ] as Case[],
}
