class FormControl{
    private _value: any;
    private validator: FormValidator | null = null;
    constructor(defaultValue: any, validator?: FormValidator){
        this._value = defaultValue;
        this.validator = validator || null;
    }

    get value(){
        return this._value;
    }
}
