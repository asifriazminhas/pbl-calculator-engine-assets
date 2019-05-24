import { IWarning } from "./warning";
import {
  IDataField,
  ICategoricalDataField,
  IValue
} from "@ottawamhealth/pbl-calculator-engine/lib/parsers/pmml/data_dictionary/data_field";
import { NoLabelFoundWarning } from "./no-label-found-warning";
import { Strings } from "../../util/strings";
import { uniqBy } from "lodash";
import { MarkdownBuilder } from "md-builder";

let Warnings: IWarning[] = [];

export function addWarningsForDataFields(
  algorithm: string,
  dataFields: IDataField[]
) {
  return dataFields
    .filter(dataField => {
      return (
        !isInteractionField(dataField) &&
        !isMutatedField(dataField) &&
        !isDummyField(dataField)
      );
    })
    .forEach(dataField => {
      if (Strings.isEmpty(dataField.$.displayName)) {
        Warnings.push(
          NoLabelFoundWarning.ForVariable(algorithm, dataField.$.name)
        );
      }

      if (dataField.$.optype === "categorical") {
        const categoricalDataField = dataField as ICategoricalDataField;

        if (categoricalDataField.Value) {
          if (categoricalDataField.Value instanceof Array) {
            categoricalDataField.Value.forEach(value => {
              addWarningsForValue(
                algorithm,
                categoricalDataField.$.name,
                value
              );
            });
          } else {
            addWarningsForValue(
              algorithm,
              categoricalDataField.$.name,
              categoricalDataField.Value
            );
          }
        }
      }
    });
}

export function prettifyWarnings(): string {
  const algorithms = uniqBy(Warnings, "algorithm").map(({ algorithm }) => {
    return algorithm;
  });

  return algorithms
    .map(algorithm => {
      const warningsForAlgorithm = Warnings.filter(warning => {
        return warning.algorithm === algorithm;
      });

      return MarkdownBuilder.h2(algorithm)
        .text(`### Warnings: ${warningsForAlgorithm.length}`)
        .code(
          warningsForAlgorithm
            .map(warning => {
              return MarkdownBuilder.text(warning.warning).toMarkdown();
            })
            .join("\n")
        )
        .toMarkdown();
    })
    .join("\n");
}

function addWarningsForValue(
  algorithm: string,
  variable: string,
  value: IValue
) {
  if (Strings.isEmpty(value.$.displayName)) {
    Warnings.push(
      NoLabelFoundWarning.ForCategory(algorithm, variable, value.$.value)
    );
  }
}

function isInteractionField(dataField: IDataField) {
  return /interaction[0-9]+/.test(dataField.$.name);
}

function isMutatedField(dataField: IDataField) {
  return /.*_Mutated_[0-9]*$/.test(dataField.$.name);
}

function isDummyField(dataField: IDataField) {
  return /.*_cat[0-9]*_[0-9]*$/;
}
