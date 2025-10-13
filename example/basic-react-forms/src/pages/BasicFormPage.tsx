import React from 'react';
import { useForm, Validators, Form } from '@radioactive/forms';
import ShowFormStateButton from '../components/ShowFormStateButton';

type BasicForm = {
  name: string;
  email: string;
  age: number;
  agreeToTerms: boolean;
};

export const BasicFormPage: React.FC = () => {
  const { form } = useForm<BasicForm>({
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
    age: [18, []],
    agreeToTerms: [false, []],
  });

  const controls = (form as unknown as { controls: Record<string, any> })?.controls;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ minWidth: 360 }}>
        <h2>Basic Form</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            Name
            <input
              data-testid="name"
              value={String(controls?.name.value ?? '')}
              onChange={(e) => controls?.name && (controls.name.value = e.currentTarget.value)}
              style={{
                border: controls?.name.valid ? '1px solid #888' : '2px solid #e53935',
                display: 'block',
                width: '100%'
              }}
            />
          </label>
          <label>
            Email
            <input
              data-testid="email"
              value={String(controls?.email.value ?? '')}
              onChange={(e) => controls?.email && (controls.email.value = e.currentTarget.value)}
              style={{
                border: controls?.email.valid ? '1px solid #888' : '2px solid #e53935',
                display: 'block',
                width: '100%'
              }}
            />
          </label>
          <label>
            Age
            <input
              data-testid="age"
              type="number"
              value={String(controls?.age.value ?? 0)}
              onChange={(e) => controls?.age && (controls.age.value = Number(e.currentTarget.value))}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              data-testid="agree"
              type="checkbox"
              checked={Boolean(controls?.agreeToTerms.value)}
              onChange={(e) => controls?.agreeToTerms && (controls.agreeToTerms.value = e.currentTarget.checked)}
            />
            Agree to terms
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button data-testid="reset" onClick={() => form?.reset()}>Reset</button>
            <button
              data-testid="toggle-readonly"
              onClick={() => { if (form) form.readonly = !form.readonly; }}
            >
              Toggle Readonly
            </button>
            <button
              data-testid="submit"
              disabled={!form?.valid || form?.readonly}
              onClick={() => console.log('submit', Form.isForm(form) ? form.build() : undefined)}
            >
              Submit
            </button>
          </div>

          <div style={{ color: form?.valid ? '#2e7d32' : '#e53935' }}>
            {form?.valid ? 'Form is valid' : 'Form is invalid'}
            {form?.dirty ? ' (dirty)' : ''}
            {form?.readonly ? ' (readonly)' : ''}
          </div>
        </div>
      </div>
      <ShowFormStateButton form={form} />
    </div>
  );
};

export default BasicFormPage;



