import { describe, it, expect } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useMemo } from "react";
import { useForm } from "../react/use-form-hook";
import { formGroup } from "../form/functional";
import type { Form } from "../form";
import { Validators } from "../form";

type Category = {
  name: string;
};

type Item = {
  itemId: number;
  isCountable?: boolean;
  categories?: Category[];
};

type InfoData = {
  date?: string | Date;
  completedDate?: string | Date | null;
  isPassed?: boolean;
  notes?: string;
  id?: number | null;
};

type Data = {
  id?: number;
  items?: Item[];
  files?: Array<{ id: number; filename: string }>;
  date?: string | Date;
  completedDate?: string | Date | null;
  isPassed?: boolean;
  notes?: string;
};

describe("React - trade-like shape (map -> nested arrays) with forceReadOnly", () => {
  it("forceReadOnly: outer readOnly=true makes all nested controls/forms readonly, while nested changes + appends remain reactive", async () => {
    const user = userEvent.setup();

    const data: Data = {
      id: 123,
      items: [
        {
          itemId: 10,
          isCountable: true,
          categories: [{ name: "G1" }],
        },
      ],
      files: [{ id: 1, filename: "a.pdf" }],
      date: new Date(),
      completedDate: null,
      isPassed: false,
      notes: '',
    };

    const Component = () => {
      const { form: form } = useForm(
        {
          infoForm: formGroup<InfoData>({
            date: [
              data?.date instanceof Date
                ? data.date
                : (data?.date ? new Date(data.date) : new Date()),
              Validators.required,
            ],
            completedDate: [
              data?.completedDate instanceof Date
                ? data.completedDate
                : (data?.completedDate ? new Date(data.completedDate) : null),
              [],
            ],
            isPassed: [data?.isPassed ?? false, []],
            notes: [data?.notes ?? '', []],
            id: [(data?.id === 0 ? null : data?.id) ?? null, []],
          }),
          mainForm: formGroup<{
            items: Form<{
              itemId: number;
              sequence: number;
              isCountable: boolean;
              categories: Form<{ name: string; isGenerated: boolean }>[];
            }>[];
          }>({
            items:
              data?.items?.map((item, index) =>
                formGroup<{
                  itemId: number;
                  sequence: number;
                  isCountable: boolean;
                  categories: Form<{ name: string; isGenerated: boolean }>[];
                }>({
                  itemId: [item.itemId, Validators.required],
                  sequence: [index + 1, Validators.required],
                  isCountable: [item.isCountable ?? false, []],
                  categories:
                    (item?.categories?.map((category, idx) =>
                      formGroup(
                        {
                          name: category.name,
                          isGenerated: [idx === 0, []],
                        },
                        {
                          readOnly: Boolean(data?.id)
                        }
                      ),
                    ) ?? []) as Form<{ name: string; isGenerated: boolean }>[],
                })
              ) ?? [],
          }, {
            readOnly: true,
          }),
          listForm: formGroup<{
            entries: Form<{ id: string; label: string }>[];
          }>({
            entries: [
              formGroup({ id: "e1", label: "Entry 1" }),
              formGroup({ id: "e2", label: "Entry 2" }),
            ],
          }),
          filesForm: formGroup<{
            files: Form<{ id: number; filename: string }>[];
            fileIdsToDelete: number[];
          }>({
            files:
              data?.files?.map((file) =>
                formGroup({
                  ...file,
                }),
              ) ?? [],
            fileIdsToDelete: [[], []],
          }),
        },
        {
          // readonly if editing an existing item
          readOnly: Boolean(data?.id),
        },
        [data],
      );

      const { infoForm, mainForm, listForm, filesForm } = useMemo(() => {
        return {
          infoForm: form?.controls?.infoForm?.value,
          mainForm: form?.controls?.mainForm?.value,
          listForm: form?.controls?.listForm?.value,
          filesForm: form?.controls?.filesForm?.value,
        };
      }, [form]);

      if (!form) return null;

      const item0 = mainForm?.controls.items.value[0];
      const categories0 = item0?.controls.categories;

      return (
        <div>
          <div data-testid="outer-ro">{String(form.readonly)}</div>
          <div data-testid="mainForm-ro">{String(form.controls.mainForm.readonly)}</div>
          <div data-testid="items-ro">{String(item0?.readonly)}</div>
          <div data-testid="categories-control-ro">{String(categories0?.readonly)}</div>
          <div data-testid="categories-count">{String(categories0?.value.length)}</div>

          <div data-testid="category0-ro">{String(categories0?.value[0].readonly)}</div>
          <div data-testid="category0-name">{categories0?.value[0].controls.name.value}</div>

          {categories0 && categories0.value.length > 1 && (
            <>
              <div data-testid="category1-ro">{String(categories0.value[1].readonly)}</div>
              <div data-testid="category1-name">{categories0.value[1].controls.name.value}</div>
            </>
          )}

          <button
            data-testid="rename-category0"
            onClick={() => {
              if (categories0) {
                categories0.value[0].controls.name.value = "G1-renamed";
              }
            }}
          >
            rename-category0
          </button>

          <button
            data-testid="rename-category1"
            onClick={() => {
              if (categories0 && categories0.value.length > 1) {
                categories0.value[1].controls.name.value = "G2-renamed";
              }
            }}
          >
            rename-category1
          </button>

          <button
            data-testid="add-category"
            onClick={() => {
              if (categories0) {
                categories0.value = [
                  ...categories0.value,
                  formGroup<{ name: string; isGenerated: boolean }>(
                    { name: "G2", isGenerated: [false, []] },
                    { readOnly: true }
                  ),
                ];
              }
            }}
          >
            add-category
          </button>

          <button
            data-testid="toggle-outer"
            onClick={() => {
              form.readonly = !form.readonly;
            }}
          >
            toggle-outer
          </button>
        </div>
      );
    };

    render(<Component />);

    // Init: forceReadOnly should make everything readonly (including containing controls)
    await waitFor(() => expect(screen.getByTestId("outer-ro")).toHaveTextContent("true"));
    await waitFor(() => expect(screen.getByTestId("mainForm-ro")).toHaveTextContent("true"));
    await waitFor(() => expect(screen.getByTestId("items-ro")).toHaveTextContent("true"));
    await waitFor(() => expect(screen.getByTestId("categories-control-ro")).toHaveTextContent("true"));
    await waitFor(() => expect(screen.getByTestId("category0-ro")).toHaveTextContent("true"));

    // Reactivity: changing nested value still updates render
    await act(async () => {
      await user.click(screen.getByTestId("rename-category0"));
    });
    await waitFor(() => expect(screen.getByTestId("category0-name")).toHaveTextContent("G1-renamed"));

    // Append: adding a new category should update count (reactive)
    await act(async () => {
      await user.click(screen.getByTestId("add-category"));
    });
    await waitFor(() => expect(screen.getByTestId("categories-count")).toHaveTextContent("2"));

    // Verify newly added form is displayed and readonly
    await waitFor(() => expect(screen.getByTestId("category1-name")).toHaveTextContent("G2"));
    await waitFor(() => expect(screen.getByTestId("category1-ro")).toHaveTextContent("true"));

    // CRITICAL: Newly added form must be reactive - changing its value should update UI
    await act(async () => {
      await user.click(screen.getByTestId("rename-category1"));
    });
    await waitFor(() => expect(screen.getByTestId("category1-name")).toHaveTextContent("G2-renamed"), {
      timeout: 3000,
    });

    // Runtime: toggling outer should still override all nested readonly states
    await act(async () => {
      await user.click(screen.getByTestId("toggle-outer")); // true -> false
    });
    await waitFor(() => expect(screen.getByTestId("outer-ro")).toHaveTextContent("false"));

    await act(async () => {
      await user.click(screen.getByTestId("toggle-outer")); // false -> true
    });
    await waitFor(() => expect(screen.getByTestId("outer-ro")).toHaveTextContent("true"));
  });
});

