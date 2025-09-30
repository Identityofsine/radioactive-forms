interface FormValidator {
    required?: boolean;
    func?: (value: any) => boolean;
    errorMsg?: string;
}

interface FormValidatorOut{
    valid: boolean;
    errors: string;
}

interface FormControlProps{
    value: any;
    validator?: FormValidator | undefined;
}