import {
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../../types/form.types";
import { Form } from "../form";

export function formGroup<T>(props: FormControlPrimitiveMap<T>): Form<T>;
export function formGroup<T>(props: FormControlNonArrayPrimitiveMap<T>): Form<T>;
export function formGroup<T>(
  props: FormControlPrimitiveMap<T> | FormControlNonArrayPrimitiveMap<T>,
): Form<T> {
  return new Form<T>(props);
}
