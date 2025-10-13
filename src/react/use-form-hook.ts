import React from "react";
import { Form } from "../form";
import {
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../types/form.types";

export type UseFormHookOptions<T> = {};

export type UseFormHook<T> = (
  form: Form<T>,
  options?: UseFormHookOptions<T>,
) => {
  form?: Form<T>;
};

export const useForm = <T>(
  formTemplate: FormControlPrimitiveMap<T> | FormControlNonArrayPrimitiveMap<T>,
  options?: UseFormHookOptions<T>,
  dependencies: React.DependencyList = [],
): ReturnType<UseFormHook<T>> => {
  const dependency = React.useMemo(
    () => [...(dependencies || [])],
    [...(dependencies || [])],
  );

  const [form, setForm] = React.useState<Form<T>>();

  React.useEffect(() => {
    const newForm = new Form<T>(formTemplate, setForm);
    setForm(newForm);
  }, [setForm, ...dependency]);

  return {
    form,
  };
};
