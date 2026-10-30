import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SelectField, TextField } from '../ui/FormFields';
import { getErrorMessage } from '../../lib/errors';
import { createBudgetItem, updateBudgetItem, type BudgetItemInput } from '../../services/budgetService';
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS, type BudgetCategory, type BudgetItemRow } from '../../types/database';

interface BudgetItemDialogProps {
  eventId: string;
  item: BudgetItemRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface FormValues {
  category: BudgetCategory;
  description: string;
  estimated: string;
  actual: string;
}

interface FormErrors {
  description?: string;
  estimated?: string;
  actual?: string;
}

const CATEGORY_OPTIONS = BUDGET_CATEGORIES.map((category) => ({ value: category, label: BUDGET_CATEGORY_LABELS[category] }));
const MAX_AMOUNT = 100_000_000;

export function BudgetItemDialog(props: BudgetItemDialogProps) {
  const title = props.item ? 'Edit budget line' : 'Add budget line';
  return (
    <Modal
      open={props.open}
      title={title}
      description="Estimates are your planning figures. Record an actual cost once you have paid or agreed a price."
      onClose={props.onClose}
    >
      <BudgetItemForm key={props.item?.id ?? 'new'} {...props} />
    </Modal>
  );
}

function BudgetItemForm({ eventId, item, onClose, onSaved }: BudgetItemDialogProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    category: item?.category ?? 'venue',
    description: item?.description ?? '',
    estimated: item ? String(item.estimated_cost) : '',
    actual: item?.actual_cost === null || item?.actual_cost === undefined ? '' : String(item.actual_cost),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const update = (patch: Partial<FormValues>) => {
    setValues((previous) => ({ ...previous, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const input: BudgetItemInput = {
      category: values.category,
      description: values.description.trim(),
      estimated_cost: Number(values.estimated),
      actual_cost: values.actual.trim() === '' ? null : Number(values.actual),
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (item) await updateBudgetItem(eventId, item.id, input);
      else await createBudgetItem(eventId, input);
      await onSaved();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The budget line could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="budget-item-form" onSubmit={handleSubmit} noValidate className="space-y-5">
      <SelectField
        label="Category"
        options={CATEGORY_OPTIONS}
        value={values.category}
        onChange={(event) => update({ category: event.target.value as BudgetCategory })}
      />
      <TextField
        label="Description"
        value={values.description}
        onChange={(event) => update({ description: event.target.value })}
        error={errors.description}
        placeholder="e.g. Venue deposit"
        maxLength={200}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Estimated cost"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={values.estimated}
          onChange={(event) => update({ estimated: event.target.value })}
          error={errors.estimated}
        />
        <TextField
          label="Actual cost"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={values.actual}
          onChange={(event) => update({ actual: event.target.value })}
          error={errors.actual}
          hint="Leave blank until paid or agreed."
        />
      </div>
      {saveError && <p className="text-sm text-danger-700" role="alert">{saveError}</p>}
      <div className="flex justify-end gap-3 border-t border-ink-200 pt-5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{item ? 'Save changes' : 'Add line'}</Button>
      </div>
    </form>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const description = values.description.trim();
  if (description.length === 0) errors.description = 'Describe what this budget line covers.';
  else if (description.length > 200) errors.description = 'Keep the description under 200 characters.';

  const estimated = Number(values.estimated);
  if (values.estimated.trim() === '' || !Number.isFinite(estimated) || estimated < 0) {
    errors.estimated = 'Enter an estimated cost of 0 or more.';
  } else if (estimated > MAX_AMOUNT) {
    errors.estimated = 'Enter a smaller amount.';
  }

  if (values.actual.trim() !== '') {
    const actual = Number(values.actual);
    if (!Number.isFinite(actual) || actual < 0) errors.actual = 'Enter an actual cost of 0 or more.';
    else if (actual > MAX_AMOUNT) errors.actual = 'Enter a smaller amount.';
  }
  return errors;
}
