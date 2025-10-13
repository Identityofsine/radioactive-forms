import React from 'react';
import { useForm, Validators, formGroup, Form } from '@radioactive/forms';
import ShowFormStateButton from '../components/ShowFormStateButton';

type Address = { street: string; city: string; zip: string };
type Payment = { cardNumber: string; expiry: string; cvc: string };
type ComplexForm = {
  fullName: string;
  email: string;
  address: Address;
  payment: Payment;
  saveCard: boolean;
};

export const ComplexFormPage: React.FC = () => {
  const { form } = useForm<ComplexForm>({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required]],
    address: formGroup<Address>({ street: '', city: '', zip: '' }),
    payment: formGroup<Payment>({ cardNumber: '', expiry: '', cvc: '' }),
    saveCard: [false],
  });

  const controls = (form as unknown as { controls: Record<string, any> })?.controls;

  const canSubmit = Boolean(form?.valid) && Boolean(!form?.readonly) && Boolean(form?.dirty);

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ minWidth: 420 }}>
        <h2>Checkout</h2>
        <fieldset style={{ border: '1px solid #aaa', padding: 12 }}>
          <legend>Contact</legend>
          <label>
            Full Name
            <input
              data-testid="fullName"
              value={String(controls?.fullName.value ?? '')}
              onChange={(e) => controls?.fullName && (controls.fullName.value = e.currentTarget.value)}
              style={{ border: controls?.fullName.valid ? '1px solid #888' : '2px solid #e53935', display: 'block', width: '100%' }}
            />
          </label>
          <label>
            Email
            <input
              data-testid="email"
              value={String(controls?.email.value ?? '')}
              onChange={(e) => controls?.email && (controls.email.value = e.currentTarget.value)}
              style={{ border: controls?.email.valid ? '1px solid #888' : '2px solid #e53935', display: 'block', width: '100%' }}
            />
          </label>
        </fieldset>

        <fieldset style={{ border: '1px solid #aaa', padding: 12, marginTop: 12 }}>
          <legend>Address</legend>
          <label>
            Street
            <input
              data-testid="street"
              value={String(controls?.address.value.controls.street.value ?? '')}
              onChange={(e) => controls?.address && (controls.address.value.controls.street.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            City
            <input
              data-testid="city"
              value={String(controls?.address.value.controls.city.value ?? '')}
              onChange={(e) => controls?.address && (controls.address.value.controls.city.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            ZIP
            <input
              data-testid="zip"
              value={String(controls?.address.value.controls.zip.value ?? '')}
              onChange={(e) => controls?.address && (controls.address.value.controls.zip.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
        </fieldset>

        <fieldset style={{ border: '1px solid #aaa', padding: 12, marginTop: 12 }}>
          <legend>Payment</legend>
          <label>
            Card Number
            <input
              data-testid="cardNumber"
              value={String(controls?.payment.value.controls.cardNumber.value ?? '')}
              onChange={(e) => controls?.payment && (controls.payment.value.controls.cardNumber.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            Expiry
            <input
              data-testid="expiry"
              value={String(controls?.payment.value.controls.expiry.value ?? '')}
              onChange={(e) => controls?.payment && (controls.payment.value.controls.expiry.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label>
            CVC
            <input
              data-testid="cvc"
              value={String(controls?.payment.value.controls.cvc.value ?? '')}
              onChange={(e) => controls?.payment && (controls.payment.value.controls.cvc.value = e.currentTarget.value)}
              style={{ display: 'block', width: '100%' }}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              data-testid="saveCard"
              type="checkbox"
              checked={Boolean(controls?.saveCard.value)}
              onChange={(e) => controls?.saveCard && (controls.saveCard.value = e.currentTarget.checked)}
            />
            Save card for future
          </label>
        </fieldset>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button data-testid="reset" onClick={() => form?.reset()}>Reset</button>
          <button data-testid="toggle-readonly" onClick={() => { if (form) form.readonly = !form.readonly; }}>Toggle Readonly</button>
          <button data-testid="pay" disabled={!canSubmit} onClick={() => console.log('PAY', form?.build())}>Pay</button>
        </div>
        <div style={{ color: form?.valid ? '#2e7d32' : '#e53935' }}>
          {form?.valid ? 'Valid' : 'Invalid'}
          {form?.dirty ? ' (dirty)' : ''}
          {form?.readonly ? ' (readonly)' : ''}
        </div>
      </div>
      <ShowFormStateButton form={form} />
    </div>
  );
};

export default ComplexFormPage;



