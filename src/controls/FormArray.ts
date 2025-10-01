import { FormControlBase } from "./FormControlBase";
import { FormControl } from "./FormControl";
import { FormGroup } from "./FormGroup";
export class FormArray extends FormControlBase{
    private _items: Array<FormControlBase> = [];
    constructor(arr: any[]){
        super();
        this._items = arr;
    }

    validate(): any[] {
        let errors:any[] = [];

        for(const item of this._items){
            errors.push(item.validate());
        }
        return errors;
    }

    buildObject() {
        return this._items.map(item => item.buildObject());
    }

    get controls(): Array<FormControlBase>{
        return this._items;
    }
}