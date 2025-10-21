import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { Form } from '../form';
import { formGroup } from '../form/functional';
import { BaseFormComponent } from '../test/react-test-utils';

interface ChildShape { name: string; }
interface SchemaShape {
  parentField: string;
  child: Form<ChildShape>;
  children: Form<ChildShape>[];
}

describe('Readonly/Disabled propagation - nested forms and arrays', () => {
  it('toggling parent form readonly/disabled propagates to nested controls and arrays', async () => {
    const schema: SchemaShape = {
      parentField: 'p',
      child: formGroup<ChildShape>({ name: 'c' }) as Form<ChildShape>,
      children: [
        formGroup<ChildShape>({ name: 'a' }) as Form<ChildShape>,
        formGroup<ChildShape>({ name: 'b' }) as Form<ChildShape>,
      ],
    };

    let formRef: Form<SchemaShape> | undefined;

    render(
      <BaseFormComponent schema={schema} formRef={(f) => (formRef = f)}>
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());

    // Initial state
    expect(formRef!.readonly).toBe(false);
    expect(formRef!.disabled).toBe(false);
    expect(formRef!.controls.child.value.readonly).toBe(false);
    expect(formRef!.controls.child.value.disabled).toBe(false);
    expect(formRef!.controls.children.value[0].readonly).toBe(false);
    expect(formRef!.controls.children.value[1].readonly).toBe(false);

    // Set parent readonly
    await act(async () => {
      formRef!.readonly = true;
    });
    await waitFor(() => {
      expect(formRef!.readonly).toBe(true);
      expect(formRef!.controls.child.value.readonly).toBe(true);
      expect(formRef!.controls.children.value[0].readonly).toBe(true);
      expect(formRef!.controls.children.value[1].readonly).toBe(true);
    });

    // Unset parent readonly
    await act(async () => {
      formRef!.readonly = false;
    });
    await waitFor(() => {
      expect(formRef!.readonly).toBe(false);
      expect(formRef!.controls.child.value.readonly).toBe(false);
      expect(formRef!.controls.children.value[0].readonly).toBe(false);
      expect(formRef!.controls.children.value[1].readonly).toBe(false);
    });

    // Set parent disabled
    await act(async () => {
      formRef!.disabled = true;
    });
    await waitFor(() => {
      expect(formRef!.disabled).toBe(true);
      expect(formRef!.controls.child.value.disabled).toBe(true);
      expect(formRef!.controls.children.value[0].disabled).toBe(true);
      expect(formRef!.controls.children.value[1].disabled).toBe(true);
    });

    // Unset parent disabled
    await act(async () => {
      formRef!.disabled = false;
    });
    await waitFor(() => {
      expect(formRef!.disabled).toBe(false);
      expect(formRef!.controls.child.value.disabled).toBe(false);
      expect(formRef!.controls.children.value[0].disabled).toBe(false);
      expect(formRef!.controls.children.value[1].disabled).toBe(false);
    });
  });

  it('toggling control-level readonly/disabled on array control propagates to each child form', async () => {
    const schema: SchemaShape = {
      parentField: 'p',
      child: formGroup<ChildShape>({ name: 'c' }) as Form<ChildShape>,
      children: [
        formGroup<ChildShape>({ name: 'a' }) as Form<ChildShape>,
        formGroup<ChildShape>({ name: 'b' }) as Form<ChildShape>,
      ],
    };

    let formRef: Form<SchemaShape> | undefined;

    render(
      <BaseFormComponent schema={schema} formRef={(f) => (formRef = f)}>
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());

    // Set readonly at control level for array
    await act(async () => {
      formRef!.controls.children.readonly = true;
    });
    await waitFor(() => {
      expect(formRef!.controls.children.readonly).toBe(true);
      expect(formRef!.controls.children.value[0].readonly).toBe(true);
      expect(formRef!.controls.children.value[1].readonly).toBe(true);
    });

    // Toggle disabled at control level for array
    await act(async () => {
      formRef!.controls.children.disabled = true;
    });
    await waitFor(() => {
      expect(formRef!.controls.children.disabled).toBe(true);
      expect(formRef!.controls.children.value[0].disabled).toBe(true);
      expect(formRef!.controls.children.value[1].disabled).toBe(true);
    });
  });
});



