import { FormControlBase } from "./FormControlBase";
export class FormControl extends FormControlBase{
    private _value: any;
    private _validator: FormValidator | null = null;
    constructor(props: FormControlProps){
        super();
        this._value = props.value;
        this._validator = props.validator || null;
    }

    validate(): FormValidatorOut{
        if(!this._validator)
            return {valid: true, errors: ''};
        if(this._validator.required && (this._value === null || this._value === undefined || this._value === '')){
            return {valid: false, errors: 'This field is required.'};
        }
        if(this._validator.func && !this._validator.func(this._value)){
            return {valid: false, errors: this._validator.errorMsg || 'Invalid value.'};
        }
        return {valid: true, errors: ''};
    }
    
    buildObject(): any{
        return this._value;
    }
    
    patchValue(val: any){
        this._value = val;
    }
    get value(): any{
        return this._value;
    }
}
