import { FormControlBase } from "./FormControlBase";
import { FormControl } from "./FormControl";
import { FormGroup } from "./FormGroup";
export class FormArray extends FormControlBase{
    private _items: Array<FormControlBase> = [];
    constructor(arr: any[]){
        super();
        for (const item of arr) {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                this._items.push(new FormGroup(item));
            } else if(Array.isArray(item)){
                this._items.push(new FormArray(item));
            }else{
                this._items.push(new FormControl(item));
            }
        }
    }

    validate(): any[] {
        let errors:any[] = [];

        for(const item of this._items){
            errors.push(item.validate());
        }
        return errors;
    }

}