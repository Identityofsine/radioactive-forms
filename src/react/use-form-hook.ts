import React from "react";
import { Form } from "../form"
import { FormControlPrimitiveMap } from "../types/form.types";

export type UseFormHookOptions<T> = {

}

export type UseFormHook<T> = (
  form: Form<T>,
  options?: UseFormHookOptions<T>
) => {
  form?: Form<T>;
}

export const useForm = <T>(
  formTemplate: FormControlPrimitiveMap<T>,
  options?: UseFormHookOptions<T>
): ReturnType<UseFormHook<T>> => {

  const [form, setForm] = React.useState<Form<T>>();

  React.useEffect(() => {
    const newForm = new Form<T>(formTemplate, setForm);
    setForm(newForm);
  }, [
    setForm
  ]);

  return {
    form,
  };
};
