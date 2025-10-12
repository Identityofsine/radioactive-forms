import {
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../../types/form.types";
import { Form } from "../form";

export function formGroup<T>(
  props: FormControlPrimitiveMap<T> | FormControlNonArrayPrimitiveMap<T>,
) {
  return new Form<T>(props);
}
