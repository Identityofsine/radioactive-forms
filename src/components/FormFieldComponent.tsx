import React from "react";
import { useFormControl } from "../hooks/useFormControl";
import { useFormArray } from "../contexts/FormArrayComponent";

interface FormFieldComponentProps {
    name?: string;
    arrayIndex?: number;
    children: React.ReactElement;
}

export function FormFieldComponent ({ name,arrayIndex, children }: FormFieldComponentProps) {
    let controlProps;
    if (typeof arrayIndex === "number") {
        const { formarray, handleItemChange } = useFormArray();
        const control = formarray.controls[arrayIndex];
        interface ControlProps {
            value: any;
            checked?: boolean;
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
        }

        if (!control) {
            controlProps = {};
        } else {
            controlProps = {
                value: control.value,
                checked: typeof control.value === "boolean" ? control.value : undefined,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                    const val =
                        target instanceof HTMLInputElement && target.type === "checkbox"
                            ? target.checked
                            : target.value;
                    handleItemChange(arrayIndex, val);
                }
            } as ControlProps;
        }
  } else {
    if (typeof name === "string") {
      controlProps = useFormControl(name);
    } else {
      controlProps = {};
    }
  }
  return React.cloneElement(React.Children.only(children), controlProps);
}