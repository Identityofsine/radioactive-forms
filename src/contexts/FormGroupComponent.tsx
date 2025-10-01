import React, { createContext, useContext, useState, ReactNode, ReactElement } from "react";
import { FormGroup } from "../controls/FormGroup";
import { FormControlBase } from "../controls/FormControlBase";
import { FormControl } from "../controls/FormControl";

interface FormGroupContextValue {
    formgroup: FormGroup;
    handleChange: (name: string, value: any) => void;
}
const FormGroupContext = createContext<FormGroupContextValue | undefined>(undefined);

interface Props {
    formgroup: FormGroup;
    children: ReactNode |(()=>ReactNode);
}

export function FormGroupComponent({ formgroup, children }: Props):ReactElement {
    const [, setVersion] = useState(0);

    const handleChange = (name: string, value: any) => {
        const control = formgroup.get(name);
        if (control) {
            (control as FormControl).patchValue(value);
            setVersion(v => v + 1); // redraw this section
        }
    };
    return (
        <FormGroupContext.Provider value={{ formgroup, handleChange }}>
            {typeof children === "function" ? (children as () => ReactNode)() : children}
        </FormGroupContext.Provider>
    );
}

export function useFormGroup() {
    const context = useContext(FormGroupContext);
    if (!context) throw new Error("useFormGroup must be used within a FormGroupComponent");
    return context;
}

