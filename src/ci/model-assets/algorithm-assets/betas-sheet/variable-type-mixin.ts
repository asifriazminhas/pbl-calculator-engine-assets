import { Constructor } from './util-types';

export function VariableTypeMixin<T extends Constructor<{ name: string }>>(
    BaseClass: T,
) {
    return class extends BaseClass {
        name!: string;

        constructor(...args: any[]) {
            super(...args);
        }

        isInteractionVariable(): boolean {
            const InteractionVariableRegex = /interaction[0-9]+/;

            return !InteractionVariableRegex.test(this.name);
        }
    };
}
