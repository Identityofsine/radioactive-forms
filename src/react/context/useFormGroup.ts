import React from "react";
import { Form } from "../../form";
import { FormGroupContext } from "./FormGroup";

type UseFormGroupOptions = {
  required?: boolean;
};

export function useFormGroup<T>(options?: UseFormGroupOptions): { form?: Form<T> } {
  const ctx = React.useContext(FormGroupContext);
  const form = ctx?.form as Form<T> | undefined;

  if (options?.required && !form) {
    throw new Error("useFormGroup must be used within a FormGroupProvider");
  }
  return { form };
}


