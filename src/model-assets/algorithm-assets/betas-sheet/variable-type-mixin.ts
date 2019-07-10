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
            // This account for the following interaction names:
            // interaction1 - The current way of doing interaction naming
            // AgeCXPhysical_int - The old way of naming interactions
            const InteractionVariableRegex = /interaction[0-9]+$|.*X.*_int$/;

            return InteractionVariableRegex.test(this.name);
        }
    };
}
