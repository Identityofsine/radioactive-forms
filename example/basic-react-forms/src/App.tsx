import React, { useState } from 'react';
import { useFormBuilder } from '../../../src/hooks/useFormBuilder';
import { FormGroupComponent } from '../../../src/contexts/FormGroupComponent';
import { FormArrayComponent, useFormArray } from '../../../src/contexts/FormArrayComponent';
import { useFormControl } from '../../../src/hooks/useFormControl';
import { FormGroup } from '../../../src/controls/FormGroup';
import { FormArray } from '../../../src/controls/FormArray';
import { FormFieldComponent } from '../../../src/components/FormFieldComponent';
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
          <FormGroupComponent formgroup={form.get("userInfo") as FormGroup}>
                <div>
                  <label>
                    Name:
                    <FormFieldComponent name="name">
                      <input type="text"/>
                    </FormFieldComponent>
                  </label>
                  <label>
                    Age:
                    <FormFieldComponent name="age">
                      <input type="number" />
                    </FormFieldComponent>
                    {ageError && <span style={{ color: "red" }}>{ageError}</span>}
                  </label>
                </div>
          </FormGroupComponent>
          <label>
            Email:
           <FormFieldComponent name="email">
                      <input type="text" />
                    </FormFieldComponent>
          </label>
          <FormArrayComponent formarray={phoneNumbersArray}>
            <div>
              <label>Phone Numbers:</label>
              {phoneNumbersArray.controls.map((ctrl, i) => (
                <FormFieldComponent key={i} arrayIndex={i}>
                  <input type="text" />
                </FormFieldComponent>
              ))}
              <button type="button" onClick={() => useFormArray().addItem("")}>Add Phone</button>
            </div>
          </FormArrayComponent>
          <button type="submit">Submit</button>
        </FormGroupComponent>
      </form>
    </div>
  );
}

export default App;