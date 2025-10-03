import { Form } from "../../form";
import React from "react";

export interface FormGroupContextInterface<T> {
  form?: Form<T>;
}

export const FormGroupContext = React.createContext<
  FormGroupContextInterface<any> | undefined
>(undefined);

export const FormGroupProvider = <T,>({
  form,
  children,
}: React.PropsWithChildren<FormGroupContextInterface<T>>) => {
  return (
    <FormGroupContext.Provider value={{ form }}>
      {children}
    </FormGroupContext.Provider>
  );
};
