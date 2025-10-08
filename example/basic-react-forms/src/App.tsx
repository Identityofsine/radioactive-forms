import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Form, formGroup, useForm } from '@radioactive/forms'

type TestForm = {
  name: string;
  age: number;
  dead: boolean;
  forms: {
    nestedName: string;
  }
  groups: Array<Form<{ nestedName: string }>>
}

function isFormInstance(value: unknown): value is Form<unknown> {
  return Form.isForm(value);
}

type AnyControlLike = { value: unknown; valid: boolean; dirty: boolean };

function renderFormRows<T>(form: Form<T>, keyPrefix: string = ''): Array<React.ReactElement> {
  const controls = (form as unknown as { controls: Record<string, AnyControlLike> }).controls;
  return Object.entries(controls).flatMap(([key, field]: [string, AnyControlLike]) => {
    const value = field.value;

    if (Array.isArray(value) && value.some(isFormInstance)) {
      const headerRow = (
        <tr key={`${keyPrefix}${key}`} style={{ borderBottom: '1px solid black', textAlign: 'center' }}>
          <td style={{ borderRight: '1px solid black' }}>
            <label>{key}</label>
          </td>
          <td colSpan={2} style={{ textAlign: 'left', padding: '6px' }}>
            Array of Forms ({value.length})
          </td>
        </tr>
      );
      const childRows = (value as Array<Form<unknown>>).flatMap((childForm, idx) =>
        renderFormRows(childForm, `${keyPrefix}${key}[${idx}].`)
      );
      return [headerRow, ...childRows];
    }

    if (isFormInstance(value)) {
      const headerRow = (
        <tr key={`${keyPrefix}${key}`} style={{ borderBottom: '1px solid black', textAlign: 'center' }}>
          <td style={{ borderRight: '1px solid black' }}>
            <label>{key}</label>
          </td>
          <td colSpan={2} style={{ textAlign: 'left', padding: '6px' }}>
            Nested Form
          </td>
        </tr>
      );
      const childRows = renderFormRows(value, `${keyPrefix}${key}.`);
      return [headerRow, ...childRows];
    }

    return [
      <tr key={`${keyPrefix}${key}`} style={{ borderBottom: '1px solid black', textAlign: 'center' }}>
        <td style={{ borderRight: '1px solid black' }}>
          <label>{key}</label>
        </td>
        <td>
          <input
            style={{
              border: field.valid ? '1px solid black' : '2px solid red',
            }}
            type={typeof field.value === 'boolean' ? 'checkbox' : (typeof field.value === 'number' ? 'number' : 'text')}
            value={String(field.value)}
            onChange={(e) => {
              const parsedValue = typeof field.value === 'boolean'
                ? e.currentTarget.checked
                : (typeof field.value === 'number'
                  ? Number(e.currentTarget.value)
                  : e.currentTarget.value);
              field.value = parsedValue as typeof field.value;
            }}
          />
        </td>
        <td style={{ borderLeft: '1px solid black' }}>
          <div onClick={(e) => { e.stopPropagation(); field.dirty = !field.dirty }}>
            {field.dirty ? '✔️' : '❌'}
          </div>
        </td>
      </tr>
    ];
  });
}

function App() {

  const { form } = useForm<TestForm>({
    name: ['John Doe', [(value) => value.includes('John')]],
    age: [30, [(value) => value > 0]],
    dead: [false],
    forms: formGroup<{ nestedName: string }>({
      nestedName: 'Nested John',
    }),
    groups: [
      formGroup<{ nestedName: string }>({ nestedName: 'Group A' }),
      formGroup<{ nestedName: string }>({ nestedName: 'Group B' }),
    ]
  });

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Radioactive Forms</h1>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '20px',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <table style={{
          width: '500px',
          border: '1px solid black',
          borderCollapse: 'collapse'
        }}>
          <thead style={{ borderBottom: '1px solid black' }}>
            <tr style={{ textAlign: 'center' }}>
              <td
                style={{ borderRight: '1px solid black', padding: '10px' }}
              >Key</td>
              <td
                style={{ borderRight: '1px solid black', padding: '10px' }}
              >Value</td>
              <td
                style={{ borderRight: '1px solid black', padding: '10px' }}
              >Dirty</td>
            </tr>
          </thead>
          <tbody>
            {form && renderFormRows(form)}
          </tbody>
        </table>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {!form?.valid && <span style={{ color: '#fe6d73', fontWeight: 'bold' }}>Form is not valid</span>}
          <button
            onClick={() => form?.patchValue({ name: 'Jane Doe', age: 45, dead: true })}
          >
            Patch Test
          </button>
          <button
            onClick={() => {
              const groupsCtrl = form?.getControl('groups');
              if (!groupsCtrl) return;
              const arr = groupsCtrl.value
              arr.push(
                formGroup<{ nestedName: string }>({ nestedName: `Group ${((groupsCtrl.value || []).length) + 1}` })
              )
              groupsCtrl.value = arr.slice();
            }}
          >
            Add Group
          </button>
          <button
            onClick={() => form?.reset()}
          >
            Reset {form?.dirty && '(dirty)'}
          </button>
          <button
            style={{ backgroundColor: form?.readonly ? '#4caf50' : undefined, color: form?.readonly ? 'white' : undefined }}
            onClick={() => {
              if (!form) return;
              console.log(form.readonly)
              form.readonly = !form.readonly
            }}
          >
            Set Readonly
          </button>
        </div>
      </div>

      <span>HMR is working with <pre style={{ display: 'inline' }}>@radioactive/forms</pre> package (<pre style={{ display: 'inline' }}>../../src/index.ts</pre>)!</span>

      <h4>Form State (click name to update)</h4>
      <pre style={{ width: '100%' }}>
        <code style={{ display: 'inline-block', width: '100%', textAlign: 'left', fontSize: '16px' }}>
          {JSON.stringify(form, null, 2)}
        </code>
      </pre>

    </>
  )
}

export default App
