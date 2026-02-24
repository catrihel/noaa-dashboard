import { format, formatDistanceToNow, isValid, parseISO, isPast } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : 'N/A';
}

export function formatRelative(dateStr) {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function isExpired(expiresStr) {
  if (!expiresStr) return false;
  const d = parseISO(expiresStr);
  return isValid(d) && isPast(d);
}

export function truncate(str, maxLen = 110) {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen).trimEnd()}…` : str;
}

export function pluralise(count, noun) {
  return `${count.toLocaleString()} ${noun}${count !== 1 ? 's' : ''}`;
}

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// US states + territories for the state filter dropdown
const STATE_NAMES = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
  KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
  MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri',
  MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey',
  NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio',
  OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
  DC:'Washington D.C.', PR:'Puerto Rico', GU:'Guam', VI:'U.S. Virgin Islands',
  AS:'American Samoa', MP:'Northern Mariana Islands',
};

export const US_STATES = Object.entries(STATE_NAMES)
  .sort((a, b) => a[1].localeCompare(b[1]))
  .map(([code, name]) => ({ code, name }));
