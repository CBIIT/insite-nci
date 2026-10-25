import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import Modal from "react-bootstrap/Modal";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { fetchTaxonomyId } from "./Util";
import { tableConfig } from "./Config";
import TableContextProvider from "../../Table/ContextProvider";
import Table from "../../Table/TableController";
import defaultOptions from "./defaultOptions.json";
import { useFormContext } from "../../../FormContextProvider";
import { updateFormChange } from "../../../state/Actions";

export default function Organism ({
  // form,
  sample,
  sampleIndex,
}) {
  // access form state and reducer
  const { context: form } = useFormContext();
  const { samples = [], dispatch } = form;

  // drowpdown options 
  // configure form fields
  const {
    displayFormFields = {},
    displayFieldOptions = {}
  } = form;

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function closeSearchModal() {
    setShowSearchModal(false);
    setSearchTerm("");
    setSearchResult([]);
    setSelectedSearchResult(null);
    setError(null);
  }
    
  function setTxID(value = "") {
    setSelectedSearchResult(value);
    setOrganismValue(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await fetchTaxonomyId(searchTerm);
      console.log(result);
      setSearchResult([result]);
    } catch (error) {
      console.error(error);
      setError(error.toString());
    } finally {
      setLoading(false);
    }
  }

  function setOrganismValue (value) {
    sample.organismNCBITaxonomy = value;
    dispatch(updateFormChange(form));
  }

  const tblRef = useRef();
  const clearSelectedValue = () => {
    // model
    setSelectedSearchResult("");
    setOrganismValue("");
    // table
    tblRef.current.clearSelectedVal();
  }

  const clearSearchTerm = () => {
    setSearchTerm("");
    setSearchResult([]);
  };

  return (
    <>
      {
        (displayFormFields?.biosample?.organismNCBITaxonomy) ? (
          <div className="col-md mb-3">
            <label className="form-label" htmlFor={`organism-${sampleIndex}`}>
              Organism (NCBI taxonomy)
            </label>
            <div className="row">
              <div className="col-8">
                <input
                  className="form-control"
                  id="ncbiTaxomonyId"
                  name="organismNCBITaxonomy"
                  placeholder="Enter taxomony Id"
                  onChange={(event) => setTxID(event?.target?.value)}
                  value={sample.organismNCBITaxonomy}
                />
              </div>
              <div className="col-4">
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="btn btn-primary mb-1"
              >
                Search Taxonomy
              </button>
              </div>
            </div>
            <Modal show={showSearchModal} onHide={closeSearchModal} size="xl">
              <Modal.Header closeButton>
                <Modal.Title>Search Taxonomy</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <form className="row mb-3" onSubmit={handleSubmit}>
                  <Row>
                    <Col xs={12} md={8}>
                      <label className="form-label" htmlFor="uniprotSearchTerm">
                        Organism Name
                      </label>
                      <div class="input-group">
                        <input
                          className="form-control"
                          id="organismSearchTerm"
                          name="organismSearchTerm"
                          onChange={(e) => setSearchTerm(e.target.value)}
                          value={searchTerm}
                          required
                        />
                        <button
                          class="btn btn-clear btn-primary"
                          type="button"
                          id="clearInput"
                          onClick={clearSearchTerm}
                        >
                          &times;
                        </button>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <label className="form-label d-block" aria-hidden="true">
                        &zwj;
                      </label>
                      <button type="submit" className="btn btn-primary w-30" disabled={loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                            <span role="status">Loading</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-search me-1"></i>
                            Search
                          </>
                        )}
                      </button>
                    </Col>
                  </Row>
                </form>
                <hr />
                {
                  selectedSearchResult && (
                  <div className="row">
                    <div class="input-group">
                      <label class="input-group-text" htmlFor="selectedSearchResult">
                        Selected Taxonomy Id
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
                      rows={searchResult}
                      tableConfig={tableConfig}
                      setSelectedValue={setOrganismValue}
                      setSelectedSearchResult={setSelectedSearchResult}
                    />
                  </TableContextProvider>
                </div>
              </Modal.Body>
            </Modal>
          </div>
        ) : (
          <div className="col-md mb-3">
            <label className="form-label required" htmlFor={`organism-${sampleIndex}`}>
              Organism
            </label>
            <Select
              options={defaultOptions.organisms}
              aria-label="Select Organism"
              placeholder="Select Organism"
              onChange={(value) => setOrganismValue(value)}
              value={sample.organismNCBITaxonomy}
              required
            />
          </div>
        )
      }
    </>
      
  )
}
