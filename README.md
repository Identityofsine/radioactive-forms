# Radioactive Forms

Type-safe, reactive forms for React.

## Overview

- Typed controls with validators
- Nested forms and arrays of forms/controls
- Reactive updates via a lightweight hook
- Readonly/disabled modes and dirty/touched tracking
- Build fully typed output objects with `form.build()`

## Installation

```bash
npm i @identityofsine/radioactive-forms
```

## Quickstart

```tsx
import { useForm, Validators, Form } from '@identityofsine/radioactive-forms';

type Profile = { name: string; email: string; age: number; agree: boolean };

export function Example() {
  const { form } = useForm<Profile>({
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
    age: [18, []],
    agree: [false, []],
  });
  const controls = (form as unknown as { controls: Record<string, any> })?.controls;
  return (
    <>
      <input value={String(controls?.name.value ?? '')} onChange={e => controls?.name && (controls.name.value = e.target.value)} />
      <button disabled={!form?.valid || form?.readonly} onClick={() => console.log(Form.isForm(form) ? form.build() : undefined)}>Submit</button>
    </>
  );
}
```

## Core Concepts

- Form template: `{ field: [initialValue, [validators...]] }`
- `Form` state: `valid`, `dirty`, `touched`, `readonly`, `disabled`
- `Form` methods: `reset()`, `patchValue(partial)`, `build()`; static `Form.isForm(obj)`
- `FormControl<T, O>`: `.value` setter triggers validation, `.reset()`, `.patchValue()`
- Validators: `Validators.required`
- Nesting: controls can hold nested `Form` or arrays of `Form`/`FormControl`

## API Surface

- `useForm<T>(template, options?, deps?) => { form?: Form<T> }`
- `Form<T>`: `.controls`, `.invalids`, `.getControl(key)`, `.addControls(map)`, `.readonly`, `.disabled`, `.reset()`, `.patchValue()`, `.build()`
- `FormControl<T, O>`: `.value`, `.readonly`, `.disabled`, `.reset()`, `.patchValue()`
- `Validators`: `required`
- React context: `FormGroup` for providing `form` via context
- React hook: `useFormGroup<T>(options?) => { form?: Form<T> }`

### useFormGroup Example

```tsx
import { FormGroupProvider, useFormGroup, useForm } from '@identityofsine/radioactive-forms';

type Profile = { name: string; email: string };

function Child() {
  const { form } = useFormGroup<Profile>({ required: true });
  const controls = (form as any)?.controls;
  return (
    <input value={String(controls?.name.value ?? '')} onChange={e => controls?.name && (controls.name.value = e.target.value)} />
  );
}

export function Parent() {
  const { form } = useForm<Profile>({ name: ['', []], email: ['', []] });
  return (
    <FormGroupProvider form={form}>
      <Child />
    </FormGroupProvider>
  );
}
```

## Examples / Local Development

The example app (development environment) lives in `example/basic-react-forms` and hot-reloads against local sources.

```bash
npm run example:install
npm run example:dev
```

This runs Vite in `example/basic-react-forms`, which is configured to use the local `src/index.ts` so you can develop the library and see changes live.

## Testing & Type-Checking

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run typecheck
```

## Contributing

PRs welcome! Use the example app for local development and run tests and type checks before submitting.

## License

MIT
