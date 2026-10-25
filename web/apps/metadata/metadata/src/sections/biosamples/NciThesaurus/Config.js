import { cellTypes, RADIO } from '../../Table/ColumnTypes';

export const tableConfig = {
  dataKey: 'code',
  columns: [
    {
      label: '',
      type: RADIO,
    },
    {
      label: 'NCI Code',
      field: 'code',
    },
    {
      label: 'NCIt Preferred Name',
      field: 'name',
    },
    {
      label: 'Source Synonyms',
      field: 'synonyms',
      type: cellTypes.LIST,
    }
  ]
};