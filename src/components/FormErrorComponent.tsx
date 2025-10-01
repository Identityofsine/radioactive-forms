import { useFormGroup } from "../contexts/FormGroupComponent";
import { FormControl } from "../controls/FormControl";

interface FormErrorComponentProps {
    name: string | null;
    onError?: (control: FormControl | null) => void;
    noText?: boolean;
    errorComponent?: React.ReactElement;
}

export function FormErrorComponent({ name, onError, noText, errorComponent }: FormErrorComponentProps) {
    if (!name) return null;
    const { formgroup } = useFormGroup();
    const ageControl = formgroup.get(name);
    const error = ageControl?.validate().valid ? "" : ageControl?.validate().errors;
    if (onError && error) onError(ageControl as FormControl | null);
    if (noText) return null;
    if(errorComponent && error) return errorComponent;
    return error ? <span style={{ color: "red" }}>{error}</span> : null;
}