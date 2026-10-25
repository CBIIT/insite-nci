import { RADIO } from "../../sections/Table/ColumnTypes";

export const tblConfig = [
  {
    label: '',
    type: RADIO,
  },
  {
    label: 'Taxonomy ID',
    field: 'id',
  },
  {
    label: 'NCBI Term',
    field: 'term',
}];

export const tableConfig = {
  dataKey: 'id',
  columns: [
    {
      label: '',
      type: RADIO,
    },
    {
      label: 'Taxonomy ID',
      field: 'id',
    },
    {
      label: 'NCBI Term',
      field: 'term',
  }]
}