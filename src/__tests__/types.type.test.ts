import { describe, it, expectTypeOf } from "vitest";
import { formGroup } from "../form/functional";
import { Form, Validators } from "../form";
import { useForm } from "../react";
import { } from "../util";

describe("Types - compile-time assertions", () => {
  it("infers primitive and nested types from form controls", () => {
    const form = formGroup({
      name: "Admin",
      complexType: "complex" as string | number,
      complexTypeWithValidator: ["complex" as string | number, [Validators.required]],
      age: [30, [Validators.required]],
      flags: { active: true },
      nickname: [
        "admini",
        [Validators.required]
      ],
      pet: formGroup({
        type: "Dog",
        age: 5,
      }),
      list: [['item1', 'item2', 'item4'], []],
      formGroups: [
        formGroup({ id: 1, value: "A" }),
        formGroup({ id: 2, value: "B" }),
        formGroup({ id: 3, value: "C" })
      ],
      formGroupsWithValidators: [
        [
          formGroup({ id: 4, value: "D" }),
          formGroup({ id: 5, value: "E" }),
          formGroup({ id: 6, value: "F" })
        ],
        [Validators.required]
      ]
    });

    expectTypeOf(form.controls.name.value).toEqualTypeOf<string>();
    expectTypeOf(form.controls.age.value).toEqualTypeOf<number>();
    expectTypeOf(form.controls.complexType.value).toEqualTypeOf<string | number>();
    expectTypeOf(form.controls.complexTypeWithValidator.value).toEqualTypeOf<string | number>();
    expectTypeOf(form.controls.flags.value.active).toEqualTypeOf<boolean>();
    expectTypeOf(form.controls.nickname.value).toEqualTypeOf<string>();
    expectTypeOf(form.controls.list.value).toEqualTypeOf<string[]>();
    expectTypeOf(form.controls.formGroups.value).toEqualTypeOf<
      Array<Form<{ id: number; value: string }>>
    >();
    expectTypeOf(form.controls.formGroupsWithValidators.value).toEqualTypeOf<
      Array<Form<{ id: number; value: string }>>
    >();

    expectTypeOf(form.controls.pet.value).toEqualTypeOf<
      Form<{ type: string; age: number }>
    >();

    // Negative example (keep commented). Uncomment to ensure compile fails as expected.
    // expectTypeOf(form.controls.age.value).toEqualTypeOf<string>();
  });
});
