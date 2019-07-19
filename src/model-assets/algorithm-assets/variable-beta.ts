import { VariableTypeMixin } from './variable-type-mixin';

class _VariableBeta {
    name: string;
    beta: string;

    constructor(name: string, beta: string) {
        this.name = name;
        this.beta = beta;
    }
}

export class VariableBeta extends VariableTypeMixin(_VariableBeta) {}
