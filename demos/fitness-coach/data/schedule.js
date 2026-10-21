/* ==========================================================================
   SCHEDULE + AVAILABILITY  ·  REBRAND FILE 3 of 3  [DEMO sample data]
   --------------------------------------------------------------------------
   One source for the weekly timetable, the free-trial picker, coach
   profiles and the booking flow.

   Days use JavaScript numbering: 0 = Sunday, 1 = Monday … 6 = Saturday.
   Times are 24 h "HH:MM", in the visitor's local time (demo).
   `demoFill` makes the demo look lived-in: it pre-fills some spots with a
   repeatable pattern so you see "few left" and "full" states. Set it to
   false for a clean, fully open calendar.
   ========================================================================== */

export const services = [
  {
    id: 'one-to-one',
    label: '1:1 session',
    minutes: 60,
    capacity: 1,
    blurb: 'Private coaching on the gym floor. Form, programming and a plan for next week.',
  },
  {
    id: 'group',
    label: 'Small-group class',
    minutes: null, // taken from each class below
    capacity: 6,
    blurb: 'Coached strength or conditioning, six people at most. Pick a class from the timetable.',
  },
  {
    id: 'online',
    label: 'Online check-in',
    minutes: 30,
    capacity: 1,
    blurb: 'A video call to review your week, check form clips and set the next block.',
  },
];

/* Weekly small-group timetable. trial: true = eligible for a free trial. */
export const classes = [
  { id: 'sf',  day: 1, time: '06:30', minutes: 60, name: 'Strength Foundations', kind: 'Strength',     coach: 'maya', trial: true },
  { id: 'ec',  day: 1, time: '12:15', minutes: 30, name: 'Express Conditioning', kind: 'Conditioning', coach: 'dev',  trial: true },
  { id: 'bc',  day: 1, time: '18:30', minutes: 60, name: 'Barbell Club',         kind: 'Strength',     coach: 'maya', trial: false },

  { id: 'mc',  day: 2, time: '07:00', minutes: 45, name: 'Mobility & Core',      kind: 'Mobility',     coach: 'sana', trial: true },
  { id: 'sf',  day: 2, time: '18:00', minutes: 60, name: 'Strength Foundations', kind: 'Strength',     coach: 'theo', trial: true },
  { id: 'ws',  day: 2, time: '19:15', minutes: 60, name: 'Women’s Strength',     kind: 'Strength',     coach: 'maya', trial: true },

  { id: 'bc',  day: 3, time: '06:30', minutes: 60, name: 'Barbell Club',         kind: 'Strength',     coach: 'maya', trial: false },
  { id: 'ec',  day: 3, time: '12:15', minutes: 30, name: 'Express Conditioning', kind: 'Conditioning', coach: 'dev',  trial: true },
  { id: 'sf',  day: 3, time: '19:00', minutes: 60, name: 'Strength Foundations', kind: 'Strength',     coach: 'theo', trial: true },

  { id: 'mc',  day: 4, time: '07:00', minutes: 45, name: 'Mobility & Core',      kind: 'Mobility',     coach: 'sana', trial: true },
  { id: 'er',  day: 4, time: '18:00', minutes: 45, name: 'Engine Room',          kind: 'Conditioning', coach: 'dev',  trial: false },
  { id: 'ws',  day: 4, time: '19:15', minutes: 60, name: 'Women’s Strength',     kind: 'Strength',     coach: 'maya', trial: true },

  { id: 'sf',  day: 5, time: '06:30', minutes: 60, name: 'Strength Foundations', kind: 'Strength',     coach: 'theo', trial: true },
  { id: 'ec',  day: 5, time: '17:30', minutes: 30, name: 'Express Conditioning', kind: 'Conditioning', coach: 'dev',  trial: true },

  { id: 'bc',  day: 6, time: '09:00', minutes: 75, name: 'Barbell Club',         kind: 'Strength',     coach: 'maya', trial: false },
  { id: 'mr',  day: 6, time: '10:30', minutes: 45, name: 'Mobility Reset',       kind: 'Mobility',     coach: 'sana', trial: true },
];

/* 1:1 and online slots each coach offers, by weekday. */
export const coachSlots = {
  maya: {
    'one-to-one': { 1: ['08:00', '10:00'], 2: ['08:00', '16:30'], 3: ['08:00', '10:00', '16:30'], 4: ['10:00'], 5: ['08:00', '16:30'], 6: ['11:30'] },
    online: { 2: ['12:30'], 4: ['12:30'] },
  },
  dev: {
    'one-to-one': { 1: ['07:00', '13:00', '17:00'], 3: ['07:00', '13:00', '17:00'], 5: ['07:00', '13:00'], 6: ['08:00'] },
    online: { 1: ['20:00'], 4: ['20:00'] },
  },
  sana: {
    'one-to-one': { 2: ['08:15', '11:00', '15:00'], 4: ['08:15', '11:00', '15:00'], 6: ['11:30'] },
    online: { 3: ['13:00'] },
  },
  theo: {
    'one-to-one': { 2: ['06:30', '12:00'], 3: ['12:00', '17:30'], 5: ['08:00', '12:00'], 6: ['09:00', '10:30'] },
    online: { 1: ['19:30'], 2: ['20:00'], 3: ['20:00'], 4: ['19:30'], 5: ['18:30'] },
  },
};

export const closedDays = [0]; // Sunday: rest day
export const restDayNote = 'Rest day. Recovery counts too.';
export const bookingWindowDays = 14; // the booking date strip shows this many days
export const fewLeftAt = 2; // "2 left" or fewer shows the few-left state
export const demoFill = true;
