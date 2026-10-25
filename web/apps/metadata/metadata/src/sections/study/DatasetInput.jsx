import React, { useEffect, useRef, useState } from "react";
import {
  Typography,
  Tooltip,
  IconButton
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import Modal from "react-bootstrap/Modal";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useFormContext } from "../../FormContextProvider";
import { onInputValueChange } from "../../state/Actions";
import { getSuggestionsByObjectType } from "../../service/Http";
import TableContextProvider from "../Table/ContextProvider";
import { cellTypes } from "../Table/ColumnTypes";
import Table from "../../sections/Table/TableController";

export const tableConfig = {
  dataKey: 'name',
  columns: [
    {
      label: '',
      type: cellTypes.RADIO,
    },
    {
      label: 'Omero ID',
      field: 'id',
    },
    {
      label: 'Name',
      field: 'name',
  }]
}
function InfoTooltip() {
  return (
    <Tooltip
      sx={{
        paddingTop: 0
      }}
      title={
        <div>
          <Typography>Type OMERO Project/Dataset/Image-level to select object name</Typography>
        </div>
      }
      arrow
    >
      <IconButton>
        <InfoIcon color="primary" />
      </IconButton>
    </Tooltip>
  );
};

export const OMERO_OBJECT_OPTIONS = [
  { label: 'Project', value: 'Project' },
  { label: 'Dataset', value: 'Dataset' },
  { label: 'Image',  value: 'Image'  },
];

const DatasetInputView = ({
  onChange,
  fieldValue,
  fieldName
}) => {
  // dispatch to update form state
  const { context } = useFormContext();
  const { dispatch } = context;

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [objectType, setObjectType] = useState('Image');
  const [selectedSearchResult, setSelectedSearchResult] = useState([]);
  const tblRef = useRef();

  const clearSelectedValue = () => {
    setSelectedSearchResult("");
    tblRef.current.clearSelectedVal();
  }

  const handleChange = (value) => {
    console.log(value);
    dispatch(onInputValueChange({
      [fieldName]: value
    }));
  };

  const clearSearchTerm = () => {
    setSearchTerm("");
    setSearchResult([]);
  };

  function closeSearchModal() {
    setShowSearchModal(false);
    clearSearchTerm();
  };

  function handleSubmit() {

  };

  useEffect(() => {
    getSuggestionsByObjectType(objectType, searchTerm).then(res => {
      if (res.data) {
        setSearchResult(res.data);
      }
    });

  }, [objectType, showSearchModal]);

  const filterData = `${searchTerm}`.length === 0
    ? searchResult : searchResult
    .filter(item => (`${item?.name}`.toLowerCase()
    .includes(searchTerm.toLowerCase())));

  return (
    <>
      <div className="col-6 p-2">
        {/* <OmeroIdInputView
          title="Dataset UUID"
          objectTypes={["Project"]}
          searchQuery={fieldValue}
          handleChange={(id, name) => {
            handleOmeroIdChange(name, id);
          }}
          suggestionListItems={suggestionList}
        > */}
          
        {/* </OmeroIdInputView> */}
        <label className="form-label" htmlFor={`Dataset UUID`}>
          Dataset UUID
        </label>
        <div className="row">
          <div className="col-8">
              {/* <InfoTooltip /> */}
            <input
              className="form-control"
              id={fieldName}
              name={fieldName}
              type="text"
              min="0"
              placeholder="Enter Dataset UUID"
              onChange={(ev) => onChange(ev)}
              value={fieldValue}
            />      
          </div>
          <div className="col-4">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="btn btn-primary mb-1"
            >
              Search Dataset UUID
            </button>
          </div>
        </div>
      </div>
      <Modal show={showSearchModal} onHide={closeSearchModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Search Dataset UUID</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="row mb-3" onSubmit={handleSubmit}>
            <Row>
              <Col xs={6} md={6}>
                <label className="form-label" htmlFor="uniprotSearchTerm">
                  Omero Object Type
                </label>
                <div class="input-group">
                  <select
                    id="objectType"
                    name="objectType"
                    value={objectType}
                    onChange={(e) => setObjectType(e.target.value)}
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="" disabled>Choose type…</option>
                    {OMERO_OBJECT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col xs={6} md={6}>
                <label className="form-label" htmlFor="searchTerm">
                  Filter Input
                </label>
                <div class="input-group">
                  <input
                    className="form-control"
                    id="omeroObjectType"
                    placeholder="Enter omero object id"
                    name="omeroObjectType"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    required
                  />
                </div>
              </Col>
            </Row>
          </form>
          <hr />
          {
            selectedSearchResult && (
            <div className="row">
              <div class="input-group">
                <label class="input-group-text" htmlFor="selectedSearchResult">
                  Selected File Name
                </label>
                <span class="form-control" placeholder="Select Protein">
                  {selectedSearchResult}
                </span>
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  onClick={clearSelectedValue}>
                  Clear
                </button>
              </div>
            </div>)
          }
          <div class="row">
            <TableContextProvider>
              <Table
                ref={tblRef}
                rows={filterData}
                tableConfig={tableConfig}
                setSelectedValue={handleChange}
                setSelectedSearchResult={setSelectedSearchResult}
              />
            </TableContextProvider>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DatasetInputView;
