import React from "react";

const HeaderView = () => {
    return (
      <header>
        <div class="container my-2 my-md-1 mb-1">
            <div class="d-flex flex-wrap justify-content-between align-items-center">
            <a class="d-inline-block py-2" rel="noopener noreferrer" href="https://www.cancer.gov/">
                <img src="../static/metadata/assets/logo.svg" height="60" alt="National Cancer Institute Logo" class="mw-100" />
            </a>
            </div>
        </div>
        <div class="bg-primary text-white py-2">
            <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                <h1 class="h4 mb-0 d-flex align-items-center">
                    <i class="bi bi-microscope me-2"></i>
                    <span>NIFE Image Search</span>
                    <small class="ms-2 fw-normal opacity-75">NCI Imaging Facilities Environment</small>
                </h1>
                </div>
                <div class="col-md-6 d-flex justify-content-md-end mt-2 mt-md-0">
                <span class="badge bg-light text-primary px-3 py-2 d-flex align-items-center">
                    <i class="bi bi-database me-2"></i>
                    <span class="fw-bold" id="total-count">0</span> Images
                </span>
                </div>
            </div>
            </div>
        </div>
      </header>
    );
};

export default HeaderView;
