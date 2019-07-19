export abstract class InteractionUtil {
    static NewInteractionRegex = /interaction[0-9]+$/;
    static OldInteractionRegex = /.*X.*_int$/;

    static isInteractionVar(varName: string): boolean {
        return (
            varName.search(InteractionUtil.NewInteractionRegex) !== -1 ||
            varName.search(InteractionUtil.OldInteractionRegex) !== -1
        );
    }

    static getInteractingVars(varName: string): string[] {
        if (varName.search(InteractionUtil.OldInteractionRegex) !== -1) {
            return varName.replace('_int', '').split('X');
        }

        if (varName.search(InteractionUtil.NewInteractionRegex) !== -1) {
            throw new Error(`New interactions terms not handled`);
        }

        throw new Error(`Not interaction term`);
    }
}
