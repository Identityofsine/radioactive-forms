import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { form } from '@radioactive/forms'
import React from 'react'

function App() {

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
      <table style={{
        width: '300px',
        margin: 'auto',
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
          </tr>
        </thead>
        <tbody>
          {
            Object.entries(form.control).map(([key, field]) => (
              <tr key={key}
                style={{ borderBottom: '1px solid black', textAlign: 'center' }}
              >
                <td style={{ borderRight: '1px solid black' }}>
                  <label>{key}</label>
                </td>
                <td>
                  <p>{String(field.value)}</p>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <span>HMR is working with <pre style={{ display: 'inline' }}>@radioactive/forms</pre> package (<pre style={{ display: 'inline' }}>../../src/index.ts</pre>)!</span>

    </>
  )
}

export default App
