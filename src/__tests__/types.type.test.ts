import { describe, it, expectTypeOf } from "vitest";
import { formGroup } from "../form/functional";
import { Form } from "../form";
import { useForm } from "../react";
import {} from "../util";

describe("Types - compile-time assertions", () => {
  it("infers primitive and nested types from form controls", () => {
    const form = formGroup({
      name: "Admin",
      age: 30,
      flags: { active: true },
      pet: formGroup({
        type: "Dog",
        age: 5,
      }),
    });

    expectTypeOf(form.controls.name.value).toEqualTypeOf<string>();
    expectTypeOf(form.controls.age.value).toEqualTypeOf<number>();
    expectTypeOf(form.controls.flags.value.active).toEqualTypeOf<boolean>();

    expectTypeOf(form.controls.pet.value).toEqualTypeOf<
      Form<{ type: string; age: number }>
    >();

    // Negative example (keep commented). Uncomment to ensure compile fails as expected.
    // expectTypeOf(form.controls.age.value).toEqualTypeOf<string>();
  });
});
