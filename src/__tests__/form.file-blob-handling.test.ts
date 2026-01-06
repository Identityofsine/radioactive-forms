import { describe, it, assert } from "vitest";
import { formGroup } from "../form/functional";

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
});


