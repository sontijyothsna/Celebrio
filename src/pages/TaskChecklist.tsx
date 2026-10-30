import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { EventPage } from '../components/events/EventPage';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SelectField, TextField } from '../components/ui/FormFields';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { ProgressBar, StatCard } from '../components/ui/PageParts';
import { useAsync } from '../hooks/useAsync';
import { getErrorMessage } from '../lib/errors';
import { formatDateOnly, todayDateOnly } from '../lib/format';
import { getTaskStatus, isUrgentTask, sortTasksByUrgency, type TaskStatus } from '../lib/tasks';
import { createTask, deleteTask, listTasks, setTaskCompleted, type TaskInput } from '../services/tasksService';
import { TASK_PRIORITIES, type EventRow, type TaskPriority, type TaskRow } from '../types/database';

type Filter = 'open' | 'urgent' | 'completed' | 'all';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const STATUS_LABEL: Record<TaskStatus, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  due_soon: 'Due soon',
  upcoming: 'Upcoming',
  no_date: 'No deadline',
  completed: 'Completed',
};

const STATUS_TONE: Record<TaskStatus, 'danger' | 'warning' | 'gold' | 'neutral' | 'success' | 'brand'> = {
  overdue: 'danger',
  due_today: 'warning',
  due_soon: 'gold',
  upcoming: 'brand',
  no_date: 'neutral',
  completed: 'success',
};

const PRIORITY_TONE: Record<TaskPriority, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

export function TaskChecklist() {
  return (
    <EventPage title="Task Checklist" description="Preparation steps for the selected event, ordered by what needs attention first.">
      {(event) => <TaskContent event={event} />}
    </EventPage>
  );
}

function TaskContent({ event }: { event: EventRow }) {
  const { data: tasks, error, loading, reload } = useAsync(() => listTasks(event.id), [event.id]);
  const [filter, setFilter] = useState<Filter>('open');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const today = todayDateOnly();

  const sorted = useMemo(() => sortTasksByUrgency(tasks ?? [], today), [tasks, today]);
  const counts = useMemo(() => {
    const list = sorted.map((task) => getTaskStatus(task, today));
    return {
      total: list.length,
      completed: list.filter((status) => status === 'completed').length,
      overdue: list.filter((status) => status === 'overdue').length,
      urgent: list.filter((status) => isUrgentTask(status)).length,
    };
  }, [sorted, today]);

  const visible = useMemo(() => {
    return sorted.filter((task) => {
      const status = getTaskStatus(task, today);
      if (filter === 'open') return status !== 'completed';
      if (filter === 'urgent') return isUrgentTask(status);
      if (filter === 'completed') return status === 'completed';
      return true;
    });
  }, [sorted, filter, today]);

  if (loading && !tasks) return <LoadingState label="Loading tasks..." />;
  if (error && !tasks) return <ErrorState message={error} onRetry={reload} />;

  const handleToggle = async (task: TaskRow) => {
    setActionError(null);
    try {
      await setTaskCompleted(event.id, task.id, task.title, !task.completed);
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err, 'The task could not be updated. Please try again.'));
    }
  };

  const percent = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {counts.total} tasks for <span className="font-medium text-ink-900">{event.name}</span>, due by {formatDateOnly(event.event_date)}
        </p>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setAdding(true)}>Add task</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Completed" value={`${counts.completed}/${counts.total}`} icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} hint={`${Math.round(percent)}% done`} />
        <StatCard label="Urgent" value={String(counts.urgent)} icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />} hint="Overdue, due today or within 3 days" />
        <StatCard label="Overdue" value={String(counts.overdue)} icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />} />
        <Card className="flex flex-col justify-center">
          <p className="text-sm font-medium text-ink-500">Progress</p>
          <div className="mt-3">
            <ProgressBar value={counts.completed} max={Math.max(counts.total, 1)} />
          </div>
        </Card>
      </div>

      {actionError && <p className="rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">{actionError}</p>}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tasks">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              filter === option.value ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-ink-300 hover:bg-ink-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card padded={false}>
        {visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
              title={filter === 'completed' ? 'Nothing completed yet' : 'All clear here'}
              description={filter === 'completed' ? 'Tick off tasks as you finish them and they will show up here.' : 'No tasks match this filter.'}
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {visible.map((task) => {
              const status = getTaskStatus(task, today);
              return (
                <li key={task.id} className="flex items-start gap-3 px-5 py-4 sm:gap-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 shrink-0 rounded-full text-ink-400 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                    aria-pressed={task.completed}
                  >
                    {task.completed ? <CheckCircle2 className="h-5 w-5 text-success-600" aria-hidden="true" /> : <Circle className="h-5 w-5" aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'text-ink-500 line-through' : 'text-ink-900'}`}>{task.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span className="capitalize">{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{task.due_date ? formatDateOnly(task.due_date) : 'No deadline'}</span>
                      {task.source === 'custom' && <Badge>Custom</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                    <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                    <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" onClick={() => setDeleting(task)} aria-label={`Delete "${task.title}"`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AddTaskDialog
        eventId={event.id}
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={async () => {
          setAdding(false);
          await reload();
        }}
      />

      <Modal
        open={deleting !== null}
        title="Delete this task?"
        description={deleting ? `"${deleting.title}" will be removed from the checklist.` : undefined}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Keep task</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteTask(event.id, deleting.id, deleting.title);
                  setDeleting(null);
                  await reload();
                } catch (err) {
                  setActionError(getErrorMessage(err, 'The task could not be deleted. Please try again.'));
                  setDeleting(null);
                }
              }}
            >
              Delete task
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">This cannot be undone.</p>
      </Modal>
    </div>
  );
}

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((priority) => ({ value: priority, label: priority.charAt(0).toUpperCase() + priority.slice(1) }));

function AddTaskDialog({ eventId, open, onClose, onSaved }: { eventId: string; open: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  return (
    <Modal open={open} title="Add a custom task" description="Use this for anything the generated checklist missed." onClose={onClose}>
      <AddTaskForm eventId={eventId} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function AddTaskForm({ eventId, onClose, onSaved }: { eventId: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    const nextErrors: { title?: string; dueDate?: string } = {};
    if (trimmed.length === 0) nextErrors.title = 'Describe the task.';
    else if (trimmed.length > 200) nextErrors.title = 'Keep the task under 200 characters.';
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) nextErrors.dueDate = 'Enter a valid date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: TaskInput = {
      title: trimmed,
      category: category.trim() || 'general',
      due_date: dueDate || null,
      priority,
    };
    setSaving(true);
    setSaveError(null);
    try {
      await createTask(eventId, input);
      await onSaved();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The task could not be added. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField label="Task" value={title} onChange={(event) => { setTitle(event.target.value); setErrors({}); }} error={errors.title} placeholder="e.g. Pick up the cake" maxLength={200} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Category" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={60} />
        <SelectField label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} />
      </div>
      <TextField label="Deadline" type="date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); setErrors({}); }} error={errors.dueDate} hint="Optional" />
      {saveError && <p className="text-sm text-danger-700" role="alert">{saveError}</p>}
      <div className="flex justify-end gap-3 border-t border-ink-200 pt-5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>Add task</Button>
      </div>
    </form>
  );
}
