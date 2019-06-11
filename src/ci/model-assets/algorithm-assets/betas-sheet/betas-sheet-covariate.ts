import { VariableTypeMixin } from './variable-type-mixin';

class _BetasSheetCovariate {
    name: string;
    beta: string;

    constructor(name: string, beta: string) {
        this.name = name;
        this.beta = beta;
    }
}

export class BetasSheetCovariate extends VariableTypeMixin(
    _BetasSheetCovariate,
) {}
