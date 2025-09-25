class FormGroup{
    private _fields: {[key: string]: any} = {};

    constructor(obj: Object, validators?: {[key: string]: FormValidator}){
        for(const key in obj){
            const validator = validators ? validators[key] : null;
            if(Array.isArray((obj as any)[key])){
                // TODO
            }else if(typeof (obj as any)[key] === 'object' && (obj as any)[key] !== null){
                this._fields[key] = new FormGroup((obj as any)[key], validators as {[key: string]: FormValidator});
            } else {
                this._fields[key] = new FormControl((obj as any)[key], validator);
            }
        }
    }

    validate(): {[key: string]: string} {
        let errors: {[key: string]: string} = {};

        for(const key in this._fields){
            const field = this._fields[key];
            if(field instanceof FormControl){
                const validOut = field.validate();
                if(!validOut.valid) errors[key] = validOut.errors;
            }else if(field instanceof FormGroup){
                errors = {...errors, ...field.validate()};
            }else {
                // TODO Arrays
            }
        }

        return errors;
    }

    buildObject(): Object {
        let obj: {[key: string]: any} = {};
        for(const key in this._fields){
            const field = this._fields[key];
            if(field instanceof FormControl){
                obj[key] = field.value;
            }else if(field instanceof FormGroup){
                obj[key] = field.buildObject();
            }else {
                // TODO Arrays
            }
        }
        return obj;
    }
}