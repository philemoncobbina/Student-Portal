// src/Services/StudentAttendanceService.js
//
// Read-only attendance service for the Student Portal.
//
// Backend contract (attendance app):
//   GET terms/                 -> all AcademicTerms (array or paginated)
//   GET my-classes/            -> { current_class, classes: [{value,label,is_current}],
//                                   terms: [{class_name, term}] }   (student only)
//   GET summary/?term=<id>[&class_name=<class>]
//        -> { student, class_name, term, summary, attendance_history }
//     (for a student the server uses the logged-in student automatically, and
//      class_name defaults to the student's current class)
//
// AcademicTerm: { id, academic_year, term: 'first'|'second'|'third', term_display,
//                 start_date, end_date, is_current, ... }
//
// Requests go through the global axios instance, which setupHttp() in http.ts has already
// given credentials, CSRF handling and the 401 -> refresh -> retry flow.
import axios from 'axios';
import { API_URL } from './http'; // adjust the path/filename if your http module lives elsewhere

const TERMS_URL = `${API_URL}terms/`;
const MY_CLASSES_URL = `${API_URL}my-classes/`;
const SUMMARY_URL = `${API_URL}summary/`;

/** Mirrors TERM_CHOICES on the backend. Order matters: it is the display order. */
export const TERM_CHOICES = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
];

export const termLabel = (value) =>
  TERM_CHOICES.find((t) => t.value === value)?.label || value;

/** Format a Date as YYYY-MM-DD using local time (no UTC shift). */
export const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse a YYYY-MM-DD string as a local date (avoids off-by-one from UTC parsing). */
export const parseLocalDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Choose the term used when nothing has been picked (e.g. the dashboard
 * notifications, which have no term selector):
 *   1. the term flagged is_current
 *   2. the term whose dates contain today
 *   3. the most recent term that has already started
 *   4. the earliest upcoming term
 * Returns null only when there are no terms at all.
 */
export const pickDefaultTerm = (terms, today = toISODate(new Date())) => {
  if (!terms || terms.length === 0) return null;

  const current = terms.find((t) => t.is_current);
  if (current) return current;

  const containingToday = terms.find(
    (t) => t.start_date <= today && today <= t.end_date
  );
  if (containingToday) return containingToday;

  const byStartDesc = [...terms].sort((a, b) =>
    a.start_date < b.start_date ? 1 : -1
  );
  const started = byStartDesc.find((t) => t.start_date <= today);
  if (started) return started;

  // Every term is in the future: take the earliest one.
  return byStartDesc[byStartDesc.length - 1];
};

/**
 * What the Attendance page selects on first load:
 * the student's CURRENT class, and its First Term
 * (newest academic year if the class somehow has more than one).
 * If the class has no First Term, the first available term is used.
 *
 * Want it to open on the running term instead? Replace the
 * `.term === 'first'` lookup below with a pickDefaultTerm() match.
 */
export const pickInitialSelection = ({ currentClass, classes, entries }) => {
  const className = classes.some((c) => c.value === currentClass)
    ? currentClass
    : classes[0]?.value || '';

  const newestFirst = entries
    .filter((e) => e.className === className)
    .sort((a, b) => (a.term.start_date < b.term.start_date ? 1 : -1));

  const pick =
    newestFirst.find((e) => e.term.term === 'first') ||
    TERM_CHOICES.map((c) => newestFirst.find((e) => e.term.term === c.value)).find(Boolean) ||
    null;

  return { className, term: pick ? pick.term : null };
};

// ---- Terms list (cached in memory; terms rarely change) ----
const TERMS_TTL_MS = 60 * 60 * 1000;
let cachedTerms = null;
let cachedTermsAt = 0;
let termsInFlight = null;

async function fetchAllTerms() {
  const all = [];
  let url = TERMS_URL;
  let params = {};
  let guard = 0; // protects against a misbehaving `next` link

  while (url && guard < 20) {
    const res = await axios.get(url, { params });
    const data = res.data;

    if (Array.isArray(data)) {
      all.push(...data);
      break;
    }

    all.push(...(data.results || []));
    url = data.next || null;
    params = {}; // `next` already carries its own query string
    guard += 1;
  }

  return all;
}

async function getTerms(force = false) {
  if (!force && cachedTerms && Date.now() - cachedTermsAt < TERMS_TTL_MS) {
    return cachedTerms;
  }

  if (!termsInFlight) {
    termsInFlight = fetchAllTerms()
      .then((terms) => {
        cachedTerms = terms;
        cachedTermsAt = Date.now();
        return cachedTerms;
      })
      .finally(() => {
        termsInFlight = null;
      });
  }
  return termsInFlight;
}

async function getDefaultTerm() {
  const terms = await getTerms();
  const term = pickDefaultTerm(terms);
  if (!term) {
    throw new Error('No academic terms have been set up yet.');
  }
  return term;
}

/**
 * attendance_history item ->
 * { id, date: 'YYYY-MM-DD', status: 'present' | 'absent', reason, isFinalized }
 */
const normalizeRecord = (r) => ({
  id: r.record_id,
  date: r.date,
  status: r.status === 'absent' ? 'absent' : 'present',
  reason: r.absence_reason || '',
  isFinalized: Boolean(r.is_finalized),
});

export const StudentAttendanceService = {
  /** Every academic term. */
  async getTerms(force = false) {
    return getTerms(force);
  },

  /** The term used when none is chosen (see pickDefaultTerm). */
  async getDefaultTerm() {
    return getDefaultTerm();
  },

  /**
   * Everything the class + term selectors need:
   * {
   *   currentClass: 'Class 3',
   *   classes: [{ value, label, isCurrent }],      // current class + past classes
   *   entries: [{ className, term }]               // selectable (class, term) pairs
   * }
   * `entries` holds every (class, term) the student has finalized records in,
   * plus the current class paired with the current academic year's terms so a
   * new student still sees a (possibly empty) page instead of a dead end.
   */
  async getOptions(force = false) {
    const [terms, mineRes] = await Promise.all([
      getTerms(force),
      axios.get(MY_CLASSES_URL),
    ]);
    const mine = mineRes.data || {};

    const termsById = new Map(terms.map((t) => [t.id, t]));
    const entries = [];
    const seen = new Set();
    const add = (className, term) => {
      if (!className || !term) return;
      const key = `${className}:${term.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ className, term });
    };

    (mine.terms || []).forEach((row) => add(row.class_name, termsById.get(row.term)));

    const defaultTerm = pickDefaultTerm(terms);
    if (defaultTerm && mine.current_class) {
      terms
        .filter((t) => String(t.academic_year) === String(defaultTerm.academic_year))
        .forEach((t) => add(mine.current_class, t));
    }

    return {
      currentClass: mine.current_class || '',
      classes: (mine.classes || []).map((c) => ({
        value: c.value,
        label: c.label,
        isCurrent: Boolean(c.is_current),
      })),
      entries,
    };
  },

  /**
   * Full summary payload for a term and class:
   * { student, class_name, term, summary, attendance_history }
   * With no termId the best-guess term is used; with no className the
   * server uses the student's current class.
   */
  async getSummary(termId, className) {
    const id = termId ?? (await getDefaultTerm()).id;
    const params = { term: id };
    if (className) params.class_name = className;
    const res = await axios.get(SUMMARY_URL, { params });
    return res.data;
  },

  /**
   * The logged-in student's attendance records for a class and term,
   * oldest first. Only finalized registers are returned unless
   * includeUnfinalized is true, so students never see a mark the
   * teacher might still change.
   *
   * @param {{ termId?: number|string, className?: string, start_date?: string,
   *           end_date?: string, includeUnfinalized?: boolean }} [options]
   */
  async getMyRecords({
    termId,
    className,
    start_date,
    end_date,
    includeUnfinalized = false,
  } = {}) {
    const data = await this.getSummary(termId, className);
    let records = (data.attendance_history || []).map(normalizeRecord);

    if (!includeUnfinalized) records = records.filter((r) => r.isFinalized);
    if (start_date) records = records.filter((r) => r.date >= start_date);
    if (end_date) records = records.filter((r) => r.date <= end_date);

    return records;
  },

  /** Convenience: records from the last `days` days (including today). */
  async getRecentRecords(days = 7) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return this.getMyRecords({
      start_date: toISODate(start),
      end_date: toISODate(end),
    });
  },
};

export default StudentAttendanceService;