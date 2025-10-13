import { Form } from "../../form";
import React from "react";

export interface FormGroupContextInterface<T> {
  form?: Form<T>;
}

export const FormGroupContext = React.createContext<
  FormGroupContextInterface<any> | undefined
>(undefined);

type FormGroupProviderProps<T> = React.PropsWithChildren<
  FormGroupContextInterface<T> & { value?: Form<T> }
>;

export const FormGroupProvider = <T,>({
  form,
  value,
  children,
}: FormGroupProviderProps<T>) => {
  const provided = form ?? value;
  return (
    <FormGroupContext.Provider value={{ form: provided }}>
      {children}
    </FormGroupContext.Provider>
  );
};
