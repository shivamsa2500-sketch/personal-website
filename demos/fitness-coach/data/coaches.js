/* ==========================================================================
   COACHES  ·  REBRAND FILE 2 of 3  [DEMO: all four coaches are fictional]
   --------------------------------------------------------------------------
   Each coach's available days and weekly slots are NOT written here: they
   are worked out from data/schedule.js, so profiles, the timetable and the
   booking flow can never disagree.

   specialties: keys from `specialties` below (used by the filter chips and
   the "Match me with a coach" quiz).
   portrait: { photo: key in brand.media } or { gradient: [from, to] } for a
   placeholder portrait with the coach's initials.
   ========================================================================== */

export const specialties = [
  { id: 'strength', label: 'Strength' },
  { id: 'conditioning', label: 'Fat loss & conditioning' },
  { id: 'mobility', label: 'Mobility & recovery' },
  { id: 'women', label: "Women's strength" },
  { id: 'beginners', label: 'Beginners' },
  { id: 'online', label: 'Online' },
];

export const coaches = [
  {
    id: 'maya',
    name: 'Coach Maya R.',
    firstName: 'Maya',
    initials: 'MR',
    role: 'Head coach',
    specialties: ['strength', 'women'],
    summary: 'Barbell strength and women’s strength classes. Calm, precise, and a little loud when you hit a personal best.',
    bio: [
      'Maya started Forgeline to coach strength the way she wished she had been taught: slowly, clearly, and with the plan written down.',
      'She coaches the big barbell lifts, runs the women’s strength classes and works with anyone who wants to get properly strong. Expect her to film a set, show you one thing to fix, and save the rest for next week.',
    ],
    approach: ['Technique first, then load', 'Plans that fit a real week', 'Progress you can see on paper'],
    portrait: { photo: 'benchSpot', photoSmall: 'benchSpotSmall', gradient: ['#3a3412', '#0f0f11'], position: '32% 30%', zoom: 1.9, zoomOrigin: '30% 34%', alt: 'Placeholder photo: a coach in a black cap spotting a client’s incline bench press' },
    credentials: 2,
  },
  {
    id: 'dev',
    name: 'Coach Dev K.',
    firstName: 'Dev',
    initials: 'DK',
    role: 'Conditioning coach',
    specialties: ['conditioning', 'strength'],
    summary: 'Fat loss without living in the gym. Short, honest sessions and food habits you will actually keep.',
    bio: [
      'Dev runs the conditioning classes and coaches people who want to lose fat and get fitter without giving up their evenings.',
      'His sessions are short and hard, and his food advice is simple: more protein, more sleep, fewer rules you will quit by Thursday.',
    ],
    approach: ['Short sessions, real effort', 'Habits over meal plans', 'Fitness you can test every month'],
    portrait: { gradient: ['#3a2a12', '#0f0f11'] },
    credentials: 2,
  },
  {
    id: 'sana',
    name: 'Coach Sana L.',
    firstName: 'Sana',
    initials: 'SL',
    role: 'Mobility & recovery coach',
    specialties: ['mobility', 'beginners'],
    summary: 'Stiff backs, cranky shoulders and coming back after time off. She builds you up one step at a time.',
    bio: [
      'Sana works with people who feel stiff, sore or out of practice, and with anyone returning to training after time away.',
      'She is happy to work alongside your physio’s advice, and she will never rush you to a heavier weight before you are ready.',
    ],
    approach: ['Move well before moving heavy', 'Small daily wins', 'Clear, patient cues'],
    portrait: { gradient: ['#1f2a24', '#0f0f11'] },
    credentials: 2,
  },
  {
    id: 'theo',
    name: 'Coach Theo M.',
    firstName: 'Theo',
    initials: 'TM',
    role: 'Beginner & online coach',
    specialties: ['beginners', 'online', 'strength'],
    summary: 'First time in a weights room? Theo makes the first month simple, in the studio or over online check-ins.',
    bio: [
      'Theo coaches first-timers and runs most of the online check-ins. If you have never touched a barbell, he will make the first month feel simple.',
      'Online clients get a weekly plan, quick video form checks and an evening check-in call that fits around work.',
    ],
    approach: ['No judgement, ever', 'One new skill a week', 'Check-ins that fit after work'],
    portrait: { gradient: ['#2b2140', '#0f0f11'] },
    credentials: 2,
  },
];
