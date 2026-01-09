import { describe, it, assert } from "vitest";
import { formGroup } from "../form/functional";
import { Validators } from "../form/validators";

describe("Form controls with File and Blob values", () => {
  it("preserves File instances when patchValue is called on a control", () => {
    const initialFile = new File(["hello"], "hello.txt", {
      type: "text/plain",
    });
    const nextFile = new File(["world"], "world.txt", {
      type: "text/plain",
    });

    const form = formGroup<{ upload: File }>({
      upload: initialFile,
    });

    // Sanity check on initialization
    assert.instanceOf(
      form.controls.upload.value,
      File,
      "File should remain a File instance at initialization",
    );
    assert.equal(
      form.controls.upload.value.name,
      "hello.txt",
      "Initial File name should be preserved",
    );

    form.controls.upload.patchValue(nextFile);

    const current = form.controls.upload.value;
    assert.strictEqual(
      current,
      nextFile,
      "patchValue should replace the value with the provided File instance",
    );
    assert.instanceOf(
      current,
      File,
      "File should not be spread into a plain object",
    );
    assert.equal(current.name, "world.txt", "Updated File name should match");
    assert.equal(
      current.size,
      nextFile.size,
      "Updated File size should be preserved",
    );
  });

  it("preserves Blob instances when patchValue is invoked through the form", () => {
    const initialBlob = new Blob(["abc"], { type: "text/plain" });
    const updatedBlob = new Blob(["xyz"], { type: "text/plain" });

    const form = formGroup<{ payload: Blob }>({
      payload: initialBlob,
    });

    form.patchValue({ payload: updatedBlob });

    const value = form.controls.payload.value;
    assert.strictEqual(
      value,
      updatedBlob,
      "Form.patchValue should replace the control value with the provided Blob",
    );
    assert.instanceOf(
      value,
      Blob,
      "Blob should not be treated as a plain object during patching",
    );
    assert.equal(value.type, "text/plain", "Blob type should remain intact");
    assert.equal(value.size, updatedBlob.size, "Blob size should be preserved");

    // build should return the same Blob instance rather than cloning or spreading it
    assert.strictEqual(
      form.build().payload,
      updatedBlob,
      "build() should keep Blob values intact",
    );
  });

  describe("File objects with required validator", () => {
    it("should be valid when File is present with required validator", () => {
      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const form = formGroup<{ upload: File }>({
        upload: [file, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should be valid when File is present",
      );
      assert.equal(
        form.valid,
        true,
        "Form should be valid when File control is valid",
      );
      assert.instanceOf(
        form.controls.upload.value,
        File,
        "Value should remain a File instance",
      );
    });

    it("should be invalid when File is null with required validator", () => {
      const form = formGroup<{ upload: File | null }>({
        upload: [null, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        false,
        "File control should be invalid when value is null",
      );
      assert.equal(
        form.valid,
        false,
        "Form should be invalid when File control is invalid",
      );
    });

    it("should be invalid when File is undefined with required validator", () => {
      const form = formGroup<{ upload: File | undefined }>({
        upload: [undefined, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        false,
        "File control should be invalid when value is undefined",
      );
      assert.equal(
        form.valid,
        false,
        "Form should be invalid when File control is invalid",
      );
    });

    it("should become valid when File is set after being null", () => {
      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const form = formGroup<{ upload: File | null }>({
        upload: [null, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        false,
        "File control should be invalid initially",
      );

      form.controls.upload.value = file;

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should become valid when File is set",
      );
      assert.equal(
        form.valid,
        true,
        "Form should become valid when File control becomes valid",
      );
      assert.instanceOf(
        form.controls.upload.value,
        File,
        "Value should be a File instance",
      );
    });

    it("should become invalid when File is set to null", () => {
      const file = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const form = formGroup<{ upload: File | null }>({
        upload: [file, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should be valid initially",
      );

      form.controls.upload.value = null;

      assert.equal(
        form.controls.upload.valid,
        false,
        "File control should become invalid when set to null",
      );
      assert.equal(
        form.valid,
        false,
        "Form should become invalid when File control becomes invalid",
      );
    });

    it("should validate File correctly when using patchValue", () => {
      const initialFile = new File(["initial"], "initial.txt", {
        type: "text/plain",
      });
      const newFile = new File(["new"], "new.txt", {
        type: "text/plain",
      });

      const form = formGroup<{ upload: File }>({
        upload: [initialFile, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should be valid with initial File",
      );

      form.controls.upload.patchValue(newFile);

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should remain valid after patchValue with new File",
      );
      assert.instanceOf(
        form.controls.upload.value,
        File,
        "Value should remain a File instance after patchValue",
      );
      assert.equal(
        form.controls.upload.value.name,
        "new.txt",
        "File name should be updated",
      );
    });

    it("should validate File correctly when using form.patchValue", () => {
      const initialFile = new File(["initial"], "initial.txt", {
        type: "text/plain",
      });
      const newFile = new File(["new"], "new.txt", {
        type: "text/plain",
      });

      const form = formGroup<{ upload: File }>({
        upload: [initialFile, [Validators.required]],
      });

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should be valid with initial File",
      );

      form.patchValue({ upload: newFile });

      assert.equal(
        form.controls.upload.valid,
        true,
        "File control should remain valid after form.patchValue with new File",
      );
      assert.instanceOf(
        form.controls.upload.value,
        File,
        "Value should remain a File instance after form.patchValue",
      );
    });
  });

  describe("Blob objects with required validator", () => {
    it("should be valid when Blob is present with required validator", () => {
      const blob = new Blob(["content"], { type: "text/plain" });

      const form = formGroup<{ payload: Blob }>({
        payload: [blob, [Validators.required]],
      });

      assert.equal(
        form.controls.payload.valid,
        true,
        "Blob control should be valid when Blob is present",
      );
      assert.equal(
        form.valid,
        true,
        "Form should be valid when Blob control is valid",
      );
      assert.instanceOf(
        form.controls.payload.value,
        Blob,
        "Value should remain a Blob instance",
      );
    });

    it("should be invalid when Blob is null with required validator", () => {
      const form = formGroup<{ payload: Blob | null }>({
        payload: [null, [Validators.required]],
      });

      assert.equal(
        form.controls.payload.valid,
        false,
        "Blob control should be invalid when value is null",
      );
      assert.equal(
        form.valid,
        false,
        "Form should be invalid when Blob control is invalid",
      );
    });

    it("should be invalid when Blob is undefined with required validator", () => {
      const form = formGroup<{ payload: Blob | undefined }>({
        payload: [undefined, [Validators.required]],
      });

      assert.equal(
        form.controls.payload.valid,
        false,
        "Blob control should be invalid when value is undefined",
      );
      assert.equal(
        form.valid,
        false,
        "Form should be invalid when Blob control is invalid",
      );
    });

    it("should become valid when Blob is set after being null", () => {
      const blob = new Blob(["content"], { type: "text/plain" });

      const form = formGroup<{ payload: Blob | null }>({
        payload: [null, [Validators.required]],
      });

      assert.equal(
        form.controls.payload.valid,
        false,
        "Blob control should be invalid initially",
      );

      form.controls.payload.value = blob;

      assert.equal(
        form.controls.payload.valid,
        true,
        "Blob control should become valid when Blob is set",
      );
      assert.equal(
        form.valid,
        true,
        "Form should become valid when Blob control becomes valid",
      );
      assert.instanceOf(
        form.controls.payload.value,
        Blob,
        "Value should be a Blob instance",
      );
    });

    it("should become invalid when Blob is set to null", () => {
      const blob = new Blob(["content"], { type: "text/plain" });

      const form = formGroup<{ payload: Blob | null }>({
        payload: [blob, [Validators.required]],
      });

      assert.equal(
        form.controls.payload.valid,
        true,
        "Blob control should be valid initially",
      );

      form.controls.payload.value = null;

      assert.equal(
        form.controls.payload.valid,
        false,
        "Blob control should become invalid when set to null",
      );
      assert.equal(
        form.valid,
        false,
        "Form should become invalid when Blob control becomes invalid",
      );
    });
  });
});


