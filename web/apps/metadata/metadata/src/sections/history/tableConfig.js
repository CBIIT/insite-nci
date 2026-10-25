import { cellTypes, RADIO } from '../Table/ColumnTypes';
// facility_id
// feedback
// form_data
// id
// iteration
// omero_group
// timestamp
// username
export const tblConfig = [
  // {
  //   label: 'Facility Id',
  //   field: 'facility_id',
  // },
  {
    label: 'Date',
    field: 'timestamp',
  },
  {
    label: 'File Name',
    field: 'file_name',
  },
  {
    label: 'Action',
    field: 'feedback',
  },
  {
    label: 'Download',
    field: 'form_data',
    type: cellTypes.CUSTOM_ELEM,
  },
  {
    label: 'Load',
    field: 'form_data',
    type: cellTypes.CUSTOM_ELEM,
  }
];