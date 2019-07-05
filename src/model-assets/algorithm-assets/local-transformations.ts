import { ILocalTransformations } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/local_transformations/local_transformations';
import { ITaxonomy } from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/taxonomy';
import { uniq, flatten } from 'lodash';
import {
    IDerivedField,
    IFieldRef,
    IApply,
} from '@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml';
import { AssetsUtil } from '../assets-util';

export class LocalTransformations {
    // Set in the factory method since the parsing code is async and constructors cannot be async
    xml!: {
        PMML: {
            LocalTransformations: ILocalTransformations;
            Taxonomy: ITaxonomy;
        };
    };

    static async factory(
        algorithmFolder: string,
    ): Promise<LocalTransformations> {
        const localTransformations = new LocalTransformations();
        localTransformations.xml = await AssetsUtil.parseXmlFile(
            `${algorithmFolder}/local-transformations.xml`,
        );

        return localTransformations;
    }

    getLocalTransformationsNode(): ILocalTransformations {
        return this.xml.PMML.LocalTransformations;
    }

    getTaxonomyNode(): ITaxonomy {
        return this.xml.PMML.Taxonomy;
    }

    getFieldNames(): string[] {
        const localTransformationsNode = this.getLocalTransformationsNode();

        return uniq(
            flatten(
                localTransformationsNode.DerivedField instanceof Array
                    ? localTransformationsNode.DerivedField.map(
                          derivedField => {
                              return this.getFieldNamesFromDerivedFieldNode(
                                  derivedField,
                              );
                          },
                      )
                    : this.getFieldNamesFromDerivedFieldNode(
                          localTransformationsNode.DerivedField,
                      ),
            ),
        );
    }

    private getFieldNamesFromDerivedFieldNode(
        derivedField: IDerivedField,
    ): string[] {
        const fieldRefNodeFieldNames = derivedField.FieldRef
            ? this.getFieldNamesFromFieldRefNode(derivedField.FieldRef)
            : [];
        const applyNodeFieldNames = derivedField.Apply
            ? this.getFieldNamesFromApplyNode(derivedField.Apply)
            : [];

        return [derivedField.$.name]
            .concat(fieldRefNodeFieldNames)
            .concat(applyNodeFieldNames);
    }

    private getFieldNamesFromFieldRefNode(fieldRef: IFieldRef): string[] {
        return [fieldRef.$.field];
    }

    private getFieldNamesFromApplyNode(apply: IApply): string[] {
        return apply.$$
            ? flatten(
                  apply.$$.filter(applyChildNode => {
                      return (
                          applyChildNode['#name'] === 'FieldRef' ||
                          applyChildNode['#name'] === 'Apply'
                      );
                  }).map(applyChildNode => {
                      return applyChildNode['#name'] === 'FieldRef'
                          ? this.getFieldNamesFromFieldRefNode(
                                applyChildNode as IFieldRef,
                            )
                          : this.getFieldNamesFromApplyNode(
                                applyChildNode as IApply,
                            );
                  }),
              )
            : [];
    }
}
