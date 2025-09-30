import { FormControlBase } from "./FormControlBase";
export class FormGroup extends FormControlBase{
    private _fields: Record<string, FormControlBase> = {};

    constructor(obj: Record<string, FormControlBase>){
        super();
        this._fields = obj;
    }

    validate(): {[key: string]: string} {
        let errors: {[key: string]: string} = {};
        for(const key in this._fields){
            const field = this._fields[key];
            if (field !== undefined) errors = {...errors, key:field.validate()};
        }
        return errors;
    }

    buildObject(): any {
        let obj: {[key: string]: any} = {};
        for(const key in this._fields){
            const field = this._fields[key];
            if (field !== undefined) obj[key] = field.buildObject();
        }
        return obj;
    }

    get(key:string):FormControlBase | undefined{
        return this._fields[key];
    }
}