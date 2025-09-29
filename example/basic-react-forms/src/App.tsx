import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useForm } from '@radioactive/forms'

type TestForm = {
  name: string;
  age: number;
  dead: boolean;
}

function App() {

  const { form } = useForm<TestForm>({
    name: ['John Doe', [(value) => value.includes('John')]],
    age: [30, [(value) => value > 0]],
    dead: [false]
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
            {
              form &&
              Object.entries(form?.controls).map(([key, field]) => (
                <tr key={key}
                  style={{ borderBottom: '1px solid black', textAlign: 'center' }}
                >
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
                        const value = typeof field.value === 'boolean' ? e.target.checked : (typeof field.value === 'number' ? Number(e.target.value) : e.target.value);
                        field.value = value as any;
                      }}
                    />
                  </td>
                  <td style={{ borderLeft: '1px solid black' }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); field.dirty = !field.dirty }}
                    >
                      {field.dirty ? '✔️' : '❌'}
                    </div>
                  </td>
                </tr>
              ))}
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
            onClick={() => form?.reset()}
          >
            Reset {form?.dirty && '(dirty)'}
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
