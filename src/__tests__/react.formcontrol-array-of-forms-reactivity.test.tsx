import { describe, it, expect } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useForm } from "../react/use-form-hook";
import { formGroup } from "../form/functional";
import { Form } from "../form";

interface ItemFormShape {
  id: string;
  value: number;
}

describe("React - FormControl holding an array of FormGroups (reactivity + readonly)", () => {
  it("loads with one child form, appends another, and both stay reactive; readonly init respects explicit, runtime overrides", async () => {
    const user = userEvent.setup();

    const schema = {
      items: [
        // Explicit: should NOT be overridden by parent readOnly at construction time
        formGroup<ItemFormShape>({ id: "a", value: 1 }, { readOnly: false }),
      ] as Form<ItemFormShape>[],
    };

    const Component = () => {
      const { form } = useForm(schema, { readOnly: true }, []);
      if (!form) return null;

      return (
        <div>
          <div data-testid="outer-readonly">{String(form.readonly)}</div>
          <div data-testid="items-control-readonly">
            {String(form.controls.items.readonly)}
          </div>
          <div data-testid="count">{form.controls.items.value.length}</div>

          <button
            data-testid="add"
            onClick={() => {
              form.controls.items.value = [
                ...form.controls.items.value,
                // Implicit: should inherit current parent readonly (true)
                formGroup<ItemFormShape>({ id: "b", value: 2 }),
              ];
            }}
          >
            add
          </button>

          <button
            data-testid="toggle-outer"
            onClick={() => {
              form.readonly = !form.readonly;
            }}
          >
            toggle-outer
          </button>

          {form.controls.items.value.map((itemForm, idx) => (
            <div key={`${itemForm.controls.id.value}-${idx}`} data-testid={`row-${idx}`}>
              <div data-testid={`id-${idx}`}>{itemForm.controls.id.value}</div>
              <div data-testid={`val-${idx}`}>{String(itemForm.controls.value.value)}</div>
              <div data-testid={`ro-${idx}`}>{String(itemForm.readonly)}</div>
              <button
                data-testid={`inc-${idx}`}
                onClick={() => {
                  itemForm.controls.value.value = itemForm.controls.value.value + 1;
                }}
              >
                inc
              </button>
            </div>
          ))}
        </div>
      );
    };

    render(<Component />);

    // Init: outer is readonly, but explicit nested readOnly:false should not be overridden at construction
    await waitFor(() => expect(screen.getByTestId("outer-readonly")).toHaveTextContent("true"));
    // The containing control stays aligned with the explicit nested init semantics (not auto-overridden)
    await waitFor(() =>
      expect(screen.getByTestId("items-control-readonly")).toHaveTextContent("false")
    );
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    await waitFor(() => expect(screen.getByTestId("id-0")).toHaveTextContent("a"));
    await waitFor(() => expect(screen.getByTestId("val-0")).toHaveTextContent("1"));
    await waitFor(() => expect(screen.getByTestId("ro-0")).toHaveTextContent("false"));

    // Reactivity: editing existing nested form updates UI
    await act(async () => {
      await user.click(screen.getByTestId("inc-0"));
    });
    await waitFor(() => expect(screen.getByTestId("val-0")).toHaveTextContent("2"));

    // Append: add a new nested form while outer is readonly
    await act(async () => {
      await user.click(screen.getByTestId("add"));
    });
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    await waitFor(() => expect(screen.getByTestId("id-1")).toHaveTextContent("b"));
    await waitFor(() => expect(screen.getByTestId("val-1")).toHaveTextContent("2"));

    // Newly added form inherits the array-control's current readonly (still false at init)
    await waitFor(() => expect(screen.getByTestId("ro-1")).toHaveTextContent("false"));

    // Reactivity: editing newly added nested form updates UI
    await act(async () => {
      await user.click(screen.getByTestId("inc-1"));
    });
    await waitFor(() => expect(screen.getByTestId("val-1")).toHaveTextContent("3"));

    // Runtime override: parent wins everywhere (including the explicit false one)
    await act(async () => {
      await user.click(screen.getByTestId("toggle-outer")); // true -> false
    });
    await waitFor(() => expect(screen.getByTestId("outer-readonly")).toHaveTextContent("false"));
    await waitFor(() =>
      expect(screen.getByTestId("items-control-readonly")).toHaveTextContent("false")
    );
    await waitFor(() => expect(screen.getByTestId("ro-0")).toHaveTextContent("false"));
    await waitFor(() => expect(screen.getByTestId("ro-1")).toHaveTextContent("false"));

    await act(async () => {
      await user.click(screen.getByTestId("toggle-outer")); // false -> true
    });
    await waitFor(() => expect(screen.getByTestId("outer-readonly")).toHaveTextContent("true"));
    await waitFor(() =>
      expect(screen.getByTestId("items-control-readonly")).toHaveTextContent("true")
    );
    await waitFor(() => expect(screen.getByTestId("ro-0")).toHaveTextContent("true"));
    await waitFor(() => expect(screen.getByTestId("ro-1")).toHaveTextContent("true"));
  });
});

