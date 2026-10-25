import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { queryProteins, organisms } from "./UnitProtUtils";
import { useFormContext } from "../../../../FormContextProvider";

export default function UniProtView({
  fieldName,
  channelVal,
  handleChannelChangeFn
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [organism, setOrganism] = useState(organisms[0].value);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // access form state

  // update result set based on organism
  const selectOrganism = async (value) => {
    setOrganism(value);
    const results = await queryProteins(searchTerm, value);
    setSearchResults(results);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setSubmitted(true);

    try {
      const results = await queryProteins(searchTerm, organism);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
      setError(error.toString());
    } finally {
      setLoading(false);
    }
  }

  function closeSearchModal() {
    setShowSearchModal(false);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedSearchResult(null);
    setSubmitted(false);
    setError(null);
  }

  function setProteinOfInterest(ev, value = "") {
    setSelectedSearchResult(value);
    handleChannelChangeFn(ev, value);
    // if (value) {
    //   handleChannelChangeFn(value);
    // } else {
    //   handleChannelChangeFn({ id: "proteinOfInterest", action: "clear" });
    // }
  }

  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-md mb-3">
            <label className="form-label">Protein of Interest</label>
            <input
              className="form-control"
              id={fieldName}
              name={fieldName}
              placeholder="Enter Protein Of Interest"
              onChange={handleChannelChangeFn}
              value={channelVal.proteinOfInterest}
            />
          </div>
          <div className="col-md mb-3">
            <label className="form-label">
              Search Protein with UniProt API
            </label>
              <button
                className="
                  form-control 
                  btn me-1 mb-1 
                  text-start
                  border border-primary rounded
                  pt-0"
                type="button"
                id="uniportBtn"
                onClick={() => setShowSearchModal(true)}
                style={{
                  backgroundImage: 'url("/static/assets/UniprotLogo.png")',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  height: 40
                }}
              />
          </div>
        </div>
      </div>

      <Modal show={showSearchModal} onHide={closeSearchModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Search Protein of Interest</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="row mb-3" onSubmit={handleSubmit} onChange={() => setSubmitted(false)}>
            <div className="col-md">
              <label className="form-label" htmlFor="uniprotOrganism">
                Organism
              </label>
              <select
                className="form-select"
                id="uniprotOrganism"
                name="uniprotOrganism"
                onChange={(ev) => selectOrganism(ev.target.value)}
                value={organism}
                required>
                {organisms.map((organism) => (
                  <option key={organism.value} value={organism.value}>
                    {organism.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md">
              <label className="form-label" htmlFor="uniprotSearchTerm">
                Protein Name
              </label>
              <div class="input-group">
                <input
                  className="form-control"
                  id="uniprotSearchTerm"
                  name="uniprotSearchTerm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  required
                />
                <button
                  class="btn btn-clear btn-primary"
                  type="button"
                  id="clearInput"
                  onClick={() => setSearchTerm("")}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="col-md">
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
            </div>
          </form>
          <hr />
          {selectedSearchResult && <div className="row">
            <div className="col-md-8 mb-3">
              <div class="input-group">
                <label class="input-group-text" htmlFor="selectedSearchResult">
                  Selected Protein of Interest
                </label>
                <span class="form-control" placeholder="Select Protein">
                  {selectedSearchResult}
                </span>
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  onClick={(e, ) => setProteinOfInterest(e, "")}>
                  Clear
                </button>
              </div>
            </div>
            <div className="col-md mb-3">
              <button type="button" className="btn btn-primary w-30" onClick={closeSearchModal}>
                <i className="bi bi-x-lg me-1"></i>
                Close
              </button>
            </div>
          </div>}
          
          <div className="mvh-50 overflow-auto position-relative">
            <table className="table table-hover mvh-50">
              <thead className="position-sticky top-0">
                <tr>
                  <th className="fw-semibold">Select</th>
                  <th className="fw-semibold">Uniprot Id</th>
                  <th className="fw-semibold">Gene Name</th>
                  <th className="fw-semibold">Protein Name</th>
                  <th className="fw-semibold">Uniprot Link</th>
                </tr>
              </thead>
              <tbody>
                {!searchResults.length && (
                  <tr>
                    <td colSpan="5" className="text-center">
                      {loading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : error ? (
                        <span className="text-danger">{error}</span>
                      ) : !searchTerm ? (
                        "Please provide name of protein"
                      ) : submitted ? (
                        "No results were found"
                      ) : (
                        "Please search to see results"
                      )}
                    </td>
                  </tr>
                )}
                {searchResults.map((item, index) => (
                  <tr
                    key={index}
                    className="cursor-pointer"
                    onClick={(e) => setProteinOfInterest(e, item.id)}
                  >
                    <td>
                      <input
                        className="form-check-input"
                        type="radio"
                        name={fieldName}
                        checked={selectedSearchResult === item.id}
                        onChange={(e) => setProteinOfInterest(e, item.id)}
                      />
                    </td>
                    <td className="fw-semibold">{item.id}</td>
                    <td>
                      <ul className="mb-0 ps-3 text-muted">
                        {item.gene.map((gene, index) => (
                          <li key={index}>{gene}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="mb-0 ps-3 text-muted">
                        {item.name.map((name, index) => (
                          <li key={index}>{name}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        View in UniProt
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
