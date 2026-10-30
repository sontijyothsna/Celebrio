import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL_BASE =
  'mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:bg-ink-100 disabled:text-ink-500';

function controlClass(error?: string) {
  return `${CONTROL_BASE} ${error ? 'border-danger-600' : 'border-ink-300'}`;
}

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  children: ReactNode;
}

function FieldShell({ label, error, hint, id, children }: FieldShellProps) {
  return (
    <div className="block">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <input
        id={fieldId}
        className={controlClass(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectField({ label, error, hint, id, options, ...rest }: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <select
        id={fieldId}
        className={controlClass(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({ label, error, hint, id, rows = 3, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fieldId}>
      <textarea
        id={fieldId}
        rows={rows}
        className={controlClass(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}
