import React, { useState } from 'react';
import { useFormBuilder } from '../../../src/hooks/useFormBuilder';
import { FormGroupComponent } from '../../../src/contexts/FormGroupComponent';
import { FormArrayComponent, useFormArray } from '../../../src/contexts/FormArrayComponent';
import { useFormControl } from '../../../src/hooks/useFormControl';
import { FormGroup } from '../../../src/controls/FormGroup';
import { FormArray } from '../../../src/controls/FormArray';

function App() {
  const { group, control, array } = useFormBuilder();
  // Custom validator for age > 5
  const ageValidator = {
    required: true,
    func: (val: any) => Number(val) > 5,
    errorMsg: "Age must be greater than 5."
  };

  // Build the form structure
  const [form] = useState(() =>
    group({
      userInfo: group({
        name: control(""),
        age: control(0, ageValidator)
      }),
      email: control(""),
      phoneNumbers: array(["", ""])
    })
  );

  // Get phoneNumbers array
  const phoneNumbersArray = form.get("phoneNumbers") as FormArray;

  // Validation
  const ageControl = (form.get("userInfo") as FormGroup).get("age");
  const ageError = ageControl?.validate().valid ? "" : ageControl?.validate().errors;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(form.buildObject());
  }

  return (
    <div>
      <h1>Radioactive Forms Example</h1>
      <form onSubmit={handleSubmit}>
        <FormGroupComponent formgroup={form}>
          {()=>{
              
              return(
                <div>
          <FormGroupComponent formgroup={form.get("userInfo") as FormGroup}>
            {()=>{
              
              return(
                <div>
                  <label>
                    Name:
                    <input type="text" {...useFormControl("name")} />
                  </label>
                  <label>
                    Age:
                    <input type="number" {...useFormControl("age")} />
                    {ageError && <span style={{ color: "red" }}>{ageError}</span>}
                  </label>
                </div>
              );
            }}
          </FormGroupComponent>
          {/* <label>
            Email:
            <input type="email" {...useFormControl("email")} />
          </label> */}
          <FormArrayComponent formarray={phoneNumbersArray}>
            <div>
              <label>Phone Numbers:</label>
              {phoneNumbersArray.controls.map((ctrl, i) => (
                <div key={i}>
                  <input
                    type="text"
                    value={ctrl.value}
                    onChange={e => useFormArray().handleItemChange(i, e.target.value)}
                  />
                  <button type="button" onClick={() => useFormArray().removeItem(i)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => useFormArray().addItem("")}>Add Phone</button>
            </div>
          </FormArrayComponent>
          <button type="submit">Submit</button>
          </div>
          );
            }}
        </FormGroupComponent>
      </form>
    </div>
  );
}

export default App;