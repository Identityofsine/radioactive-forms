class FormControl{
    private _value: any;
    private _validator: FormValidator | null = null;
    constructor(defaultValue: any, validator?: FormValidator){
        this._value = defaultValue;
        this._validator = validator || null;
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
    
    get value(){
        return this._value;
    }
    set value(val: any){
        this._value = val;
    }

}
