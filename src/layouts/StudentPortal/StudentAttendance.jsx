import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Percent
} from 'lucide-react';
import {
  StudentAttendanceService,
  TERM_CHOICES,
  pickInitialSelection,
  toISODate,
  parseLocalDate
} from '../../Services/StudentAttendanceService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const rateStyles = (rate) => {
  if (rate === null) return { text: 'text-gray-500', bg: 'bg-gray-100', label: 'No data yet' };
  if (rate >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' };
  if (rate >= 75) return { text: 'text-amber-600', bg: 'bg-amber-50', label: 'Needs attention' };
  return { text: 'text-red-600', bg: 'bg-red-50', label: 'Low attendance' };
};

const calcStats = (records) => {
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const total = present + absent;
  return {
    present,
    absent,
    total,
    rate: total > 0 ? Math.round((present / total) * 100) : null
  };
};

/** First day of the month the calendar should open on for a given term. */
const initialViewMonth = (term) => {
  const now = new Date();
  const today = toISODate(now);

  if (!term) return new Date(now.getFullYear(), now.getMonth(), 1);

  let anchor;
  if (today >= term.start_date && today <= term.end_date) anchor = now;
  else if (today > term.end_date) anchor = parseLocalDate(term.end_date);
  else anchor = parseLocalDate(term.start_date);

  return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
};

export default function StudentAttendance() {
  // ---- Selector data ----
  const [classes, setClasses] = useState([]);   // [{ value, label, isCurrent }]
  const [entries, setEntries] = useState([]);   // [{ className, term }]
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTermKey, setSelectedTermKey] = useState('');
  const [selectedYear, setSelectedYear] = useState(''); // only matters if a class repeats a term

  // ---- Records ----
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState('');

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ---- Load the student's classes and terms once; default to current class + First Term ----
  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setOptionsLoading(true);
      setError('');
      try {
        const options = await StudentAttendanceService.getOptions();
        if (cancelled) return;

        setClasses(options.classes);
        setEntries(options.entries);

        const initial = pickInitialSelection(options);
        setSelectedClass(initial.className);
        if (initial.term) {
          setSelectedTermKey(initial.term.term);
          setSelectedYear(String(initial.term.academic_year));
        }
      } catch (err) {
        console.error('Error fetching attendance options:', err);
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
            'We could not load your classes and terms. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => { cancelled = true; };
  }, []);

  // Term keys ('first' | 'second' | 'third') that exist for the chosen class
  const availableTermKeys = useMemo(
    () => new Set(
      entries.filter((e) => e.className === selectedClass).map((e) => e.term.term)
    ),
    [entries, selectedClass]
  );

  // Every (class, term) match for the chosen class + term key, newest year first.
  // Normally one; more than one only if the student repeated a class.
  const candidates = useMemo(
    () => entries
      .filter((e) => e.className === selectedClass && e.term.term === selectedTermKey)
      .sort((a, b) => (a.term.start_date < b.term.start_date ? 1 : -1)),
    [entries, selectedClass, selectedTermKey]
  );

  const selectedTerm = useMemo(() => {
    const exact = candidates.find((e) => String(e.term.academic_year) === selectedYear);
    return (exact || candidates[0] || { term: null }).term;
  }, [candidates, selectedYear]);

  const selectedTermId = selectedTerm?.id ?? null;
  const selectedClassLabel =
    classes.find((c) => c.value === selectedClass)?.label || selectedClass;

  const handleClassChange = (className) => {
    setSelectedClass(className);
    setSelectedYear('');

    // Keep the same term (First/Second/Third) if the new class has it,
    // otherwise fall back to the first term that does exist.
    const keys = new Set(
      entries.filter((e) => e.className === className).map((e) => e.term.term)
    );
    if (!keys.has(selectedTermKey)) {
      const next = TERM_CHOICES.find((c) => keys.has(c.value));
      setSelectedTermKey(next ? next.value : '');
    }
  };

  const handleTermChange = (termKey) => {
    setSelectedTermKey(termKey);
    setSelectedYear('');
  };

  // ---- Load the records whenever the chosen class or term changes ----
  useEffect(() => {
    if (!selectedTermId || !selectedClass) {
      setRecords([]);
      return undefined;
    }

    let cancelled = false;

    const loadRecords = async () => {
      setRecordsLoading(true);
      setError('');
      try {
        const data = await StudentAttendanceService.getMyRecords({
          termId: selectedTermId,
          className: selectedClass,
        });
        if (!cancelled) {
          setRecords(data);
          setViewDate(initialViewMonth(selectedTerm));
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        if (!cancelled) {
          setRecords([]);
          setError(
            err.response?.data?.detail ||
            'We could not load your attendance. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    };

    loadRecords();
    return () => { cancelled = true; };
    // selectedTerm is derived from selectedTermId, so the id and class are the only triggers needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTermId, selectedClass]);

  // date string -> record
  const recordsByDate = useMemo(() => {
    const map = new Map();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthRecords = useMemo(
    () => records.filter((r) => {
      const d = parseLocalDate(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
    [records, year, month]
  );

  const overall = useMemo(() => calcStats(records), [records]);
  const monthly = useMemo(() => calcStats(monthRecords), [monthRecords]);
  const overallStyle = rateStyles(overall.rate);

  const absences = useMemo(
    () => records
      .filter((r) => r.status === 'absent')
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [records]
  );

  // Calendar grid (Monday-first)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7; // Mon = 0

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = toISODate(date);
      cells.push({
        day,
        iso,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        outsideTerm: selectedTerm
          ? iso < selectedTerm.start_date || iso > selectedTerm.end_date
          : false,
        record: recordsByDate.get(iso) || null
      });
    }
    return cells;
  }, [year, month, recordsByDate, selectedTerm]);

  const todayISO = toISODate(new Date());

  // Keep month navigation inside the chosen term
  const termStartMonth = selectedTerm ? parseLocalDate(selectedTerm.start_date) : null;
  const termEndMonth = selectedTerm ? parseLocalDate(selectedTerm.end_date) : null;
  const monthIndex = year * 12 + month;
  const canGoPrev = !termStartMonth ||
    monthIndex > termStartMonth.getFullYear() * 12 + termStartMonth.getMonth();
  const canGoNext = !termEndMonth ||
    monthIndex < termEndMonth.getFullYear() * 12 + termEndMonth.getMonth();

  const goToMonth = (delta) => setViewDate(new Date(year, month + delta, 1));
  const goToToday = () => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), 1);
    const idx = target.getFullYear() * 12 + target.getMonth();

    if (termStartMonth && termEndMonth) {
      const startIdx = termStartMonth.getFullYear() * 12 + termStartMonth.getMonth();
      const endIdx = termEndMonth.getFullYear() * 12 + termEndMonth.getMonth();
      if (idx < startIdx || idx > endIdx) {
        setViewDate(initialViewMonth(selectedTerm));
        return;
      }
    }
    setViewDate(target);
  };

  const formatLongDate = (iso) =>
    parseLocalDate(iso).toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

  const formatShortDate = (iso) =>
    parseLocalDate(iso).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric'
    });

  if (optionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const hasOptions = classes.length > 0 && entries.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-white mr-3">
          <CalendarCheck size={20} />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">My Attendance</h2>
          <p className="text-sm text-gray-500">Your daily register, taken once each school day</p>
        </div>
      </div>

      {/* Class + term selector */}
      {hasOptions && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="sm:w-52">
              <label
                htmlFor="attendance-class"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Class
              </label>
              <select
                id="attendance-class"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}{c.isCurrent ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <span className="block text-xs font-medium text-gray-500 mb-1">Term</span>
              <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Select term">
                {TERM_CHOICES.map(({ value, label }) => {
                  const exists = availableTermKeys.has(value);
                  const active = selectedTermKey === value && exists;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={!exists}
                      onClick={() => handleTermChange(value)}
                      title={exists ? label : `${label} has no attendance for ${selectedClassLabel}`}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : exists
                            ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Only appears when the student repeated a class and the same term exists twice */}
            {candidates.length > 1 && (
              <div className="sm:w-40">
                <label
                  htmlFor="attendance-year"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Academic year
                </label>
                <select
                  id="attendance-year"
                  value={selectedTerm ? String(selectedTerm.academic_year) : ''}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {candidates.map((e) => (
                    <option key={e.term.id} value={String(e.term.academic_year)}>
                      {e.term.academic_year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedTerm && (
            <p className="text-xs text-gray-500 mt-3">
              {selectedClassLabel} &middot; {selectedTerm.term_display || selectedTerm.term}{' '}
              ({selectedTerm.academic_year}) runs {formatShortDate(selectedTerm.start_date)} to{' '}
              {formatShortDate(selectedTerm.end_date)}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start">
          <AlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Couldn&apos;t load attendance</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Nothing to choose from */}
      {!error && !hasOptions && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-500">
          <CalendarCheck size={28} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm sm:text-base">
            No attendance or school terms have been set up for you yet. Please check back later.
          </p>
        </div>
      )}

      {/* Class chosen but no term picked */}
      {!error && hasOptions && !selectedTerm && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-500">
          <p className="text-sm sm:text-base">Select a term to see your attendance.</p>
        </div>
      )}

      {selectedTerm && recordsLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {selectedTerm && !recordsLoading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center text-emerald-600 mb-2">
                <CheckCircle size={18} className="mr-2" />
                <span className="text-sm font-medium">Days present</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{overall.present}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center text-red-600 mb-2">
                <XCircle size={18} className="mr-2" />
                <span className="text-sm font-medium">Days absent</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{overall.absent}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center text-indigo-600 mb-2">
                <CalendarCheck size={18} className="mr-2" />
                <span className="text-sm font-medium">School days marked</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{overall.total}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className={`flex items-center mb-2 ${overallStyle.text}`}>
                <Percent size={18} className="mr-2" />
                <span className="text-sm font-medium">Attendance rate</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${overallStyle.text}`}>
                {overall.rate === null ? '—' : `${overall.rate}%`}
              </p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${overallStyle.bg} ${overallStyle.text}`}>
                {overallStyle.label}
              </span>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">
                  {MONTH_NAMES[month]} {year}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {monthly.total > 0
                    ? `${monthly.present} present, ${monthly.absent} absent this month`
                    : 'No attendance marked this month'}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => goToMonth(-1)}
                  disabled={!canGoPrev}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => goToMonth(1)}
                  disabled={!canGoNext}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`blank-${idx}`} />;

                const { record, isWeekend, outsideTerm, iso, day } = cell;
                let style = 'bg-gray-50 text-gray-400';
                let title = isWeekend ? 'Weekend' : 'No record';

                if (record?.status === 'present') {
                  style = 'bg-emerald-100 text-emerald-700 font-semibold';
                  title = 'Present';
                } else if (record?.status === 'absent') {
                  style = 'bg-red-100 text-red-700 font-semibold';
                  title = record.reason ? `Absent: ${record.reason}` : 'Absent';
                } else if (outsideTerm) {
                  style = 'bg-gray-50 text-gray-300';
                  title = 'Outside this term';
                } else if (!isWeekend) {
                  style = 'bg-white text-gray-500 border border-gray-100';
                }

                return (
                  <div
                    key={iso}
                    title={title}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs sm:text-sm ${style} ${
                      iso === todayISO ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-gray-500">
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-100 mr-1.5" />Present</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-red-100 mr-1.5" />Absent</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 mr-1.5" />Weekend / no record</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded ring-2 ring-indigo-500 mr-1.5" />Today</span>
            </div>
          </div>

          {/* Absence history */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="font-semibold text-base sm:text-lg mb-4">Absence history</h3>

            {absences.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {absences.map((a) => (
                  <div key={a.id ?? a.date} className="flex items-start p-3 rounded-lg hover:bg-gray-50">
                    <div className="bg-red-50 rounded-full p-2 mr-3 flex-shrink-0">
                      <XCircle size={16} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base">{formatLongDate(a.date)}</h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {a.reason ? `Reason: ${a.reason}` : 'No reason recorded'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm sm:text-base">
                  {overall.total > 0
                    ? 'No absences on record for this class and term. Keep it up!'
                    : 'No attendance has been recorded for you in this class and term yet.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}