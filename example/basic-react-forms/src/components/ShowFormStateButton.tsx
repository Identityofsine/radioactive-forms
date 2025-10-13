import React from 'react';
import { Form, FormGroupContext } from '@radioactive/forms';

type ShowFormStateButtonProps<T> = {
  form?: Form<T>;
  label?: string;
};

export function ShowFormStateButton<T>({ form, label = 'Show Form JSON' }: ShowFormStateButtonProps<T>) {
  const ctx = React.useContext(FormGroupContext);
  const formRef = (form ?? (ctx?.form as Form<T> | undefined));
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <button onClick={() => setOpen((v) => !v)} disabled={!formRef}>
        {label}
      </button>
      {open && formRef && (
        <pre data-testid="form-json" style={{ width: '100%', maxWidth: 700, textAlign: 'left', whiteSpace: 'pre-wrap' }}>
{JSON.stringify(formRef, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default ShowFormStateButton;



