import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Form,
  useForm,
  FormGroupProvider,
  type FormControlPrimitiveMap,
  type FormControlNonArrayPrimitiveMap,
} from '@radioactive/forms';

type AcceptedTemplate<T> =
  | FormControlPrimitiveMap<T>
  | FormControlNonArrayPrimitiveMap<T>;

export function renderWithFormProvider<T>(
  ui: React.ReactElement,
  formTemplate: AcceptedTemplate<T>,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { form } = useForm<T>(formTemplate);
    return <FormGroupProvider form={form}>{children}</FormGroupProvider>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export { render, userEvent };


