import { useFormGroup } from "../contexts/FormGroupComponent";

export function FormErrorComponent({ name }: { name: string | null }) {
    if (!name) return null;
    const { formgroup } = useFormGroup();
    const ageControl = formgroup.get(name);
    const error = ageControl?.validate().valid ? "" : ageControl?.validate().errors;
    return error ? <span style={{ color: "red" }}>{error}</span> : null;
}