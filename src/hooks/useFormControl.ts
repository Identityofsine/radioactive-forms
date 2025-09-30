import { useFormGroup } from "../contexts/FormGroupComponent";
import React from "react";
import { FormControl } from "../controls/FormControl";
export function useFormControl(name: string) {
    const { formgroup, handleChange } = useFormGroup();
    const control = formgroup.get(name);

    return {
        value: (control as FormControl)?.value ?? "",
        checked: typeof (control as FormControl)?.value === "boolean" ? (control as FormControl).value : undefined,
        onChange: (e: React.ChangeEvent<any>) => {
            const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
            handleChange(name, val);
        }
    };
}