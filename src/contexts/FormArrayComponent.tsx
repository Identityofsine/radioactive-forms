import React, { createContext, useContext, useState, ReactNode, ReactElement } from "react";
import { FormArray } from "../controls/FormArray";
import { FormControlBase } from "../controls/FormControlBase";
import { FormControl } from "../controls/FormControl";

interface FormArrayContextValue {
    formarray: FormArray;
    handleItemChange: (index: number, value: any) => void;
    addItem: (value: any) => void;
    removeItem: (index: number) => void;
}
const FormArrayContext = createContext<FormArrayContextValue | undefined>(undefined);

interface Props {
    formarray: FormArray;
    children: ReactNode | (()=>ReactNode);
}

export function FormArrayComponent({ formarray, children }: Props): ReactElement {
    const [, setVersion] = useState(0);

    const handleItemChange = (index: number, value: any) => {
        const control = formarray.controls[index];
        if (control) {
            (control as FormControl).patchValue(value);
            setVersion(v => v + 1);
        }
    };

    const addItem = (value: any) => {
        formarray.controls.push(new FormControl(value));
        setVersion(v => v + 1);
    };

    const removeItem = (index: number) => {
        formarray.controls.splice(index, 1);
        setVersion(v => v + 1);
    };

    return (
        <FormArrayContext.Provider value={{ formarray, handleItemChange, addItem, removeItem }}>
            {typeof children === "function" ? (children as () => ReactNode)() : children}
        </FormArrayContext.Provider>
    );
}

export function useFormArray() {
    const context = useContext(FormArrayContext);
    if (!context) throw new Error("useFormArray must be used within a FormArrayComponent");
    return context;
}