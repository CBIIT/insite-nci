import React from "react";

const FooterView = () => {
    return (
     <footer class="flex-grow-0 bg-primary text-light py-3">
      <div class="container">
        <ul class="list-inline text-start text-md-center mb-2">
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.cancer.gov/" target="_blank" rel="noopener noreferrer"> Home </a>
          </li>
          <li class="list-inline-item d-none d-md-inline-block">|</li>
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" target="_blank" rel="noopener noreferrer" href="mailto:NIFEsubmit@nih.gov"> Contact Us </a>
          </li>
          <li class="list-inline-item d-none d-md-inline-block">|</li>
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.cancer.gov/global/web/policies" target="_blank" rel="noopener noreferrer"> Policies </a>
          </li>
          <li class="list-inline-item d-none d-md-inline-block">|</li>
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.hhs.gov/vulnerability-disclosure-policy/index.html" target="_blank" rel="noopener noreferrer">
              HHS Vulnerability Disclosure
            </a>
          </li>
        </ul>
        <ul class="list-inline text-start text-md-center mb-0">
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.hhs.gov/" target="_blank" rel="noopener noreferrer">
              U.S. Department of Health and Human Services
            </a>
          </li>
          <li class="list-inline-item d-none d-md-inline-block">|</li>
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.nih.gov" target="_blank" rel="noopener noreferrer"> National Institutes of Health </a>
          </li>
          <li class="list-inline-item d-none d-md-inline-block">|</li>
          <li class="list-inline-item d-block d-md-inline-block">
            <a class="link-light" href="https://www.cancer.gov/" target="_blank" rel="noopener noreferrer"> National Cancer Institute </a>
          </li>
        </ul>
      </div>
    </footer>
    );
};

export default FooterView;
