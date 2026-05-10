import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, BookOpen, Phone, Mail, Hash,
  ChevronDown, AlertCircle, Loader2, History,
  LayoutGrid, List, Search, X, User,
} from 'lucide-react';
import { studentCoursesService } from '../../Services/student-courses-service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TERMS = [
  { value: 'all',    label: 'All Terms'    },
  { value: 'first',  label: 'First Term'   },
  { value: 'second', label: 'Second Term'  },
  { value: 'third',  label: 'Third Term'   },
];

const CURRENT_TERMS = [
  { value: 'first',  label: 'First Term'   },
  { value: 'second', label: 'Second Term'  },
  { value: 'third',  label: 'Third Term'   },
];

const CLASSES = [
  'Creche', 'Nursery', 'KG 1', 'KG 2', 'Class 1', 'Class 2', 'Class 3',
  'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
].map(cls => ({ value: cls, label: cls }));

const TERM_COLORS = {
  first:  { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-400'   },
  second: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  third:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
};

// ---------------------------------------------------------------------------
// CourseCard — class & term info removed; promoted to context headers
// ---------------------------------------------------------------------------

function CourseCard({ course, view }) {
  if (view === 'list') {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-teal-200 transition-all duration-200">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} className="text-teal-600" />
        </div>

        {/* Course info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-sm truncate">{course.course_name}</h3>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {course.course_code}
            </span>
          </div>
        </div>

        {/* Teacher info — desktop */}
        <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={12} className="text-indigo-500" />
            </div>
            <span className="text-sm font-medium text-gray-700">{course.teacher_name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href={`mailto:${course.teacher_email}`}
              className="text-gray-500 hover:text-teal-600 transition-colors flex items-center gap-1"
              title={course.teacher_email}
            >
              <Mail size={11} />
              <span className="hidden xl:inline">{course.teacher_email}</span>
            </a>
            <a
              href={`tel:${course.teacher_phone}`}
              className="text-gray-500 hover:text-teal-600 transition-colors flex items-center gap-1"
            >
              <Phone size={11} />
              <span>{course.teacher_phone}</span>
            </a>
          </div>
        </div>

        {/* Teacher — mobile */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={13} className="text-indigo-500" />
          </div>
          <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{course.teacher_name}</span>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200">
      {/* Header row — just the icon, no term badge */}
      <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
        <BookOpen size={20} className="text-teal-600" />
      </div>

      {/* Course name + code */}
      <div>
        <h3 className="font-semibold text-gray-800 text-base leading-snug">{course.course_name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <Hash size={12} className="text-gray-400" />
          <span className="text-xs font-mono text-gray-400">{course.course_code}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Teacher details */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-indigo-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-gray-800">{course.teacher_name}</span>
            <p className="text-xs text-gray-500">Class Teacher</p>
          </div>
        </div>

        <a
          href={`mailto:${course.teacher_email}`}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-teal-600 transition-colors group truncate"
          title={course.teacher_email}
        >
          <Mail size={12} className="flex-shrink-0 group-hover:text-teal-500 transition-colors" />
          <span className="truncate">{course.teacher_email}</span>
        </a>

        <a
          href={`tel:${course.teacher_phone}`}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-teal-600 transition-colors group"
        >
          <Phone size={12} className="flex-shrink-0 group-hover:text-teal-500 transition-colors" />
          <span>{course.teacher_phone}</span>
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContextHeader — displayed once above the course grid to replace per-card info
// ---------------------------------------------------------------------------

function ContextHeader({ className, termDisplay, term, totalCourses, shown }) {
  const termStyle = TERM_COLORS[term] ?? TERM_COLORS.first;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Term pill */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${termStyle.bg} ${termStyle.text} ${termStyle.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${termStyle.dot}`} />
          {termDisplay}
        </span>

        {/* Class name */}
        {className && (
          <>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-sm font-semibold text-gray-700">{className}</span>
          </>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-700">{shown}</span>
        {shown !== totalCourses && (
          <> of <span className="font-semibold text-gray-700">{totalCourses}</span></>
        )}
        {' '}course{shown !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TermGroup — used when "All Terms" is selected in Previous Classes
// ---------------------------------------------------------------------------

function TermGroup({ termKey, termDisplay, courses, view }) {
  const termStyle = TERM_COLORS[termKey] ?? TERM_COLORS.first;

  return (
    <div className="space-y-3">
      {/* Term section header */}
      <div className={`flex items-center gap-2 px-1`}>
        <span className={`w-2 h-2 rounded-full ${termStyle.dot}`} />
        <h2 className={`text-sm font-semibold ${termStyle.text}`}>{termDisplay}</h2>
        <span className="text-xs text-gray-400 font-normal ml-1">
          ({courses.length} course{courses.length !== 1 ? 's' : ''})
        </span>
        <div className={`flex-1 h-px ${termStyle.border} border-t ml-1`} />
      </div>

      <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {courses.map(course => (
          <CourseCard key={course.id} course={course} view={view} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI states
// ---------------------------------------------------------------------------

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <GraduationCap size={28} className="text-teal-400" />
      </div>
      <p className="text-gray-500 text-sm max-w-xs">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <p className="text-gray-600 font-medium mb-1">Something went wrong</p>
      <p className="text-gray-400 text-sm mb-4 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function SkeletonCard({ view }) {
  if (view === 'list') {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="hidden md:block space-y-1">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-2.5 bg-gray-100 rounded w-32" />
        </div>
        <div className="md:hidden h-3 bg-gray-100 rounded w-16" />
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-100" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Previous-courses panel
// ---------------------------------------------------------------------------

function PreviousCoursesPanel({ view }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('first');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPrevious = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await studentCoursesService.getPreviousCourses({
        class_name: selectedClass,
        term,
      });
      setData(res);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not load previous courses.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, term]);

  // Group courses by term when "all" is selected
  const groupedByTerm = data && term === 'all'
    ? TERMS.filter(t => t.value !== 'all').reduce((acc, t) => {
        const courses = data.courses.filter(c => c.term === t.value);
        if (courses.length) acc.push({ termKey: t.value, termDisplay: t.label, courses });
        return acc;
      }, [])
    : null;

  const selectedTermLabel = TERMS.find(t => t.value === term)?.label ?? term;

  return (
    <div className="space-y-5">
      {/* Search form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm text-gray-500 mb-4">
          Select the class and term you want to look up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Class dropdown */}
          <div className="relative flex-1">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-9 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-gray-700"
            >
              <option value="" disabled>Select a class…</option>
              {CLASSES.map(cls => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Term dropdown */}
          <div className="relative">
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-9 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-gray-700"
            >
              {TERMS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Search button */}
          <button
            onClick={fetchPrevious}
            disabled={!selectedClass || loading}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} view={view} />)}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={fetchPrevious} />}

      {!loading && !error && data && (
        <>
          {data.courses.length === 0 ? (
            <EmptyState message={`No courses found for ${data.class_name} — ${selectedTermLabel}.`} />
          ) : term === 'all' && groupedByTerm ? (
            // "All Terms" → render one TermGroup section per term
            <div className="space-y-8">
              {/* Single class context header (no term pill since groups show it) */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm font-semibold text-gray-700">{data.class_name}</span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500">{data.total_courses} courses across all terms</span>
              </div>
              {groupedByTerm.map(group => (
                <TermGroup
                  key={group.termKey}
                  termKey={group.termKey}
                  termDisplay={group.termDisplay}
                  courses={group.courses}
                  view={view}
                />
              ))}
            </div>
          ) : (
            // Single term → context header + flat grid
            <div className="space-y-4">
              <ContextHeader
                className={data.class_name}
                termDisplay={selectedTermLabel}
                term={term}
                totalCourses={data.total_courses}
                shown={data.courses.length}
              />
              <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {data.courses.map(course => (
                  <CourseCard key={course.id} course={course} view={view} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && !data && (
        <EmptyState message="Select your previous class and term above, then press Search." />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudentCourses() {
  const [activeTab, setActiveTab] = useState('current');
  const [termFilter, setTermFilter] = useState('first');
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await studentCoursesService.getCurrentCourses({ term: termFilter });
      setData(res);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not load your courses. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [termFilter]);

  useEffect(() => {
    if (activeTab === 'current') fetchCurrent();
  }, [activeTab, fetchCurrent]);

  // Client-side search filter
  const displayedCourses = (data?.courses ?? []).filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.course_name.toLowerCase().includes(q) ||
      c.course_code.toLowerCase().includes(q) ||
      c.teacher_name.toLowerCase().includes(q) ||
      c.teacher_email.toLowerCase().includes(q)
    );
  });

  const selectedTermLabel = CURRENT_TERMS.find(t => t.value === termFilter)?.label ?? termFilter;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap size={26} className="text-teal-500" />
            My Courses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View your enrolled courses and assigned teachers
          </p>
        </div>

        {/* View-mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'current'
              ? 'bg-white shadow-sm text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={15} />
          Current Class
        </button>
        <button
          onClick={() => setActiveTab('previous')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'previous'
              ? 'bg-white shadow-sm text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={15} />
          Previous Classes
        </button>
      </div>

      {/* ── Current-class controls ── */}
      {activeTab === 'current' && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses, teachers…"
              className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Term filter */}
          <div className="flex gap-2 flex-wrap">
            {CURRENT_TERMS.map(t => (
              <button
                key={t.value}
                onClick={() => setTermFilter(t.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border ${
                  termFilter === t.value
                    ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      {activeTab === 'previous' ? (
        <PreviousCoursesPanel view={viewMode} />
      ) : (
        <>
          {/* Loading skeletons */}
          {loading && (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} view={viewMode} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && <ErrorState message={error} onRetry={fetchCurrent} />}

          {/* Results */}
          {!loading && !error && data && (
            <div className="space-y-4">
              {/* Single context header replaces all per-card repetition */}
              <ContextHeader
                className={data.class_name}
                termDisplay={selectedTermLabel}
                term={termFilter}
                totalCourses={data.total_courses}
                shown={displayedCourses.length}
              />

              {displayedCourses.length === 0 ? (
                <EmptyState
                  message={
                    search
                      ? `No courses match "${search}".`
                      : 'No courses have been assigned to your class yet.'
                  }
                />
              ) : (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {displayedCourses.map(course => (
                    <CourseCard key={course.id} course={course} view={viewMode} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}