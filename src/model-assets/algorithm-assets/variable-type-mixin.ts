import { Constructor } from './betas-sheet/util-types';
import { InteractionUtil } from '../../util/interaction';

export function VariableTypeMixin<T extends Constructor<{ name: string }>>(
    BaseClass: T,
) {
    return class extends BaseClass {
        name!: string;

        constructor(...args: any[]) {
            super(...args);
        }

        isInteractionVariable(): boolean {
            return InteractionUtil.isInteractionVar(this.name);
        }
    };
}
