import { excelCoordinatesToRefs } from "../../utils2";
import { coreFields as channelFields } from "../../channel/defaultField";
import { getChannelStainValue, returnStringValue } from "./GenerateExcel2";
import { inputTypes } from "../../FormField/FieldTypes";

export function addChannel(
  specimenSheet,
  specimen,
  biosampleIndex,
  specimenIndex,
  rowOffset,
  fieldOptions,
  displayField
) {
  const displayFields = { ...displayField?.channel };
  // dynamically add columns
  const channelColumns = Object.keys(displayFields).map(
    (key) => {
      const field = displayFields[key];
      return {name: field.label, filterButton: false};
    }
  );

  // rows
  const dropDownFields = {};
  const addRow = (ch) => {
    const chParameters = Object.keys(displayFields).map((key, index) => {
      const field = displayFields[key];
      if(field.inputType === inputTypes.DROPDOWN) {
        // 1 position occupy by case id
        dropDownFields[field.fieldName] = {
          index: index + 1,
          options: fieldOptions[field.fieldName]
        }
        return ch[field.fieldName]?.label || "";
      }
      return ch[field.fieldName] || "";
    });
    return chParameters
  }
  // const channelsParameters = specimen?.channels?.map((channel) => ([
  //   channel?.signalOrContrastMechanism?.label,
  //   getChannelStainValue(null, channel),
  //   returnStringValue(channel?.molecularEntity)
  // ]));

  const channelsParameters = specimen?.channels?.map((channel) => addRow(channel))

  specimenSheet.addTable({
    name: `Biosample${biosampleIndex + 1}Specimen${specimenIndex + 1}Channels`,
    ref: excelCoordinatesToRefs(rowOffset, 1),
    headerRow: true,
    style: {
      theme: "TableStyleMedium2",
      showFirstColumn: true,
      showRowStripes: true,
    },
    columns: channelColumns,
    rows: channelsParameters,
  });

  const itemFormulae = {
    signalContrastMechanism: [`=INDIRECT("LookupChannelSignalContrastMechanism[Signal or Contrast Mechanisms]")`],
    stain: [`=INDIRECT("LookupChannelSignalContrastMechanism[Signal or Contrast Mechanisms]")`],
  }

  for (let i = 0; i < specimen?.channels?.length; i++) {
    specimenSheet.getCell(rowOffset + i + 1, 1).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupChannelSignalContrastMechanism[Signal or Contrast Mechanisms]")`],
    };

    specimenSheet.getCell(rowOffset + i + 1, 2).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=INDIRECT("LookupChannelStain[Channel Stains]")`],
    };
    if (fieldOptions?.molecularentity)
    {
      specimenSheet.getCell(rowOffset + i + 1, 3).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=INDIRECT("LookupMolecularEntity[Molecular Entity]")`],
      };
    }
  }
}
