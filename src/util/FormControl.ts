class FormControl{
    private defaultValue: any;
    private validator: FormValidator | null = null;
    constructor(defaultValue: any){
        this.defaultValue = defaultValue;
    }
}
