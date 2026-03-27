/**
 * Citation bibliography extracted from audio-synthesis-reference.
 *
 * Professional sources referenced across the 27-chapter guide.
 */

export interface AudioCitation {
  id: string;
  author: string;
  title: string;
  year: number;
  source: string;
  domain: string;
  chapters: number[];
}

export const audioBibliography: AudioCitation[] = [
  { id: 'ac-001', author: 'Hermann von Helmholtz', title: 'On the Sensations of Tone', year: 1863, source: 'Dover Publications', domain: 'acoustics', chapters: [1, 3] },
  { id: 'ac-002', author: 'Harvey Fletcher & W.A. Munson', title: 'Loudness, Its Definition, Measurement and Calculation', year: 1933, source: 'Journal of the Acoustical Society of America', domain: 'acoustics', chapters: [2] },
  { id: 'ac-003', author: 'ISO', title: 'ISO 226:2003 Equal-Loudness Contours', year: 2003, source: 'International Organization for Standardization', domain: 'acoustics', chapters: [2] },
  { id: 'ac-004', author: 'Albert S. Bregman', title: 'Auditory Scene Analysis', year: 1990, source: 'MIT Press', domain: 'acoustics', chapters: [3] },
  { id: 'ac-005', author: 'E. Zwicker & H. Fastl', title: 'Psychoacoustics: Facts and Models', year: 1990, source: 'Springer-Verlag', domain: 'acoustics', chapters: [3] },
  { id: 'syn-001', author: 'Robert Moog', title: 'Voltage-Controlled Electronic Music Modules', year: 1965, source: 'Journal of the Audio Engineering Society', domain: 'synthesis', chapters: [5] },
  { id: 'syn-002', author: 'Allen Strange', title: 'Electronic Music: Systems, Techniques, and Controls', year: 1972, source: 'William C. Brown', domain: 'synthesis', chapters: [5, 6] },
  { id: 'syn-003', author: 'Curtis Roads', title: 'The Computer Music Tutorial', year: 1996, source: 'MIT Press', domain: 'synthesis', chapters: [5, 6] },
  { id: 'syn-004', author: 'Don Buchla', title: 'The Modular Electronic Music System', year: 1966, source: 'Buchla & Associates', domain: 'synthesis', chapters: [6] },
  { id: 'syn-005', author: 'Mark Vail', title: 'Vintage Synthesizers', year: 1993, source: 'Miller Freeman Books', domain: 'synthesis', chapters: [5, 6] },
  { id: 'mid-001', author: 'Dave Smith & Chet Wood', title: 'MIDI Specification 1.0', year: 1983, source: 'International MIDI Association', domain: 'protocols', chapters: [7] },
  { id: 'mid-002', author: 'Jeff Rona', title: 'The MIDI Companion', year: 1994, source: 'Hal Leonard', domain: 'protocols', chapters: [7, 8] },
  { id: 'mid-003', author: 'MIDI Manufacturers Association', title: 'MIDI 2.0 Specification', year: 2020, source: 'MMA/AMEI', domain: 'protocols', chapters: [7] },
  { id: 'mid-004', author: 'Commodore-Amiga', title: 'Amiga Hardware Reference Manual', year: 1985, source: 'Addison-Wesley', domain: 'protocols', chapters: [8] },
  { id: 'mix-001', author: 'Rupert Neve', title: 'Console Design Principles', year: 1970, source: 'Neve Electronics', domain: 'mixing', chapters: [9] },
  { id: 'mix-002', author: 'Michael Stavrou', title: 'Mixing with Your Mind', year: 2003, source: 'Flux Research', domain: 'mixing', chapters: [16] },
  { id: 'mix-003', author: 'Bobby Owsinski', title: 'The Mixing Engineers Handbook', year: 1999, source: 'Thomson Course Technology', domain: 'mixing', chapters: [9, 16] },
  { id: 'mix-004', author: 'Solid State Logic', title: 'SSL 4000 Series Technical Manual', year: 1979, source: 'Solid State Logic', domain: 'mixing', chapters: [9] },
  { id: 'mix-005', author: 'Paul Horowitz & Winfield Hill', title: 'The Art of Electronics', year: 1980, source: 'Cambridge University Press', domain: 'mixing', chapters: [9, 16] },
  { id: 'rec-001', author: 'Geoff Emerick', title: 'Here, There and Everywhere: My Life Recording the Beatles', year: 2006, source: 'Gotham Books', domain: 'production', chapters: [10] },
  { id: 'rec-002', author: 'Howard Massey', title: 'Behind the Glass', year: 2000, source: 'Backbeat Books', domain: 'production', chapters: [10] },
  { id: 'pro-001', author: 'Rick Snoman', title: 'Dance Music Manual', year: 2004, source: 'Focal Press', domain: 'production', chapters: [13, 14] },
  { id: 'pro-002', author: 'Richard Boulanger', title: 'The Csound Book', year: 2000, source: 'MIT Press', domain: 'production', chapters: [14] },
  { id: 'pro-003', author: 'Fred Lerdahl & Ray Jackendoff', title: 'A Generative Theory of Tonal Music', year: 1983, source: 'MIT Press', domain: 'production', chapters: [11] },
  { id: 'film-001', author: 'Fred Karlin & Rayburn Wright', title: 'On the Track: A Guide to Contemporary Film Scoring', year: 1990, source: 'Schirmer Books', domain: 'production', chapters: [15] },
  { id: 'film-002', author: 'Hans Zimmer', title: 'MasterClass: Film Scoring', year: 2017, source: 'MasterClass', domain: 'production', chapters: [18] },
  { id: 'dj-001', author: 'Bill Brewster & Frank Broughton', title: 'Last Night a DJ Saved My Life', year: 1999, source: 'Grove Press', domain: 'culture', chapters: [25] },
  { id: 'dj-002', author: 'Simon Reynolds', title: 'Energy Flash: A Journey Through Rave Music and Dance Culture', year: 1998, source: 'Picador', domain: 'culture', chapters: [26] },
  { id: 'dj-003', author: 'Fikentscher Kai', title: 'You Better Work! Underground Dance Music in New York', year: 2000, source: 'Wesleyan University Press', domain: 'culture', chapters: [26] },
  { id: 'live-001', author: 'Bob McCarthy', title: 'Sound Systems: Design and Optimization', year: 2007, source: 'Focal Press', domain: 'culture', chapters: [27] },
  { id: 'nyq-001', author: 'Harry Nyquist', title: 'Certain Topics in Telegraph Transmission Theory', year: 1928, source: 'Transactions of the AIEE', domain: 'acoustics', chapters: [1, 23] },
  { id: 'sha-001', author: 'Claude Shannon', title: 'A Mathematical Theory of Communication', year: 1948, source: 'Bell System Technical Journal', domain: 'protocols', chapters: [23] },
];
