import React, { useEffect, useState } from "react";
import styled from '@emotion/styled';
import { CircularProgress } from "@mui/material";
import BasicFilter from "./SearchTab/BasicFilter";
import AdvanceFilter from "./SearchTab/AdvanceFilter";
import clsx from "clsx";
import ResultView from "./Result/ResultView";
import { searchQuery } from "./Http";
import useSearchData from "./InsightStore";

const OuterContainer = styled('div')({
  minHeight: '700px',
});

const FilterView = ({
  query,
}) => {
  const [tab, setTab] = useState(1);

  return (
    <OuterContainer>
      <main class="flex-grow-1">
        <div class="card shadow-lg mb-4 border-0 rounded-3">
          <div class="card-body p-4">
             <div class="d-flex justify-content-between align-items-center mb-3">
              <ul class="nav nav-tabs" id="searchModeTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button 
                    className={
                      clsx(
                        'nav-link',
                        {['active']: tab == 1}
                      )
                    }
                    id="simple-search-tab"
                    type="button" 
                    role="tab" 
                    aria-controls="simple-search" 
                    aria-selected="true"
                    onClick={() => setTab(1)}
                  >
                    Simple Search
                  </button>
  
                </li>
                <li class="nav-item" role="presentation">
                  <button 
                   className={
                      clsx(
                        'nav-link',
                        {['active']: tab == 2}
                      )
                    }
                    id="advanced-search-tab"
                    type="button" 
                    role="tab" 
                    aria-controls="advanced-search"
                    aria-selected="false"
                    onClick={() => setTab(2)}
                  >
                    Advanced Search
                  </button>
                </li>
              </ul>
              <button class="btn btn-sm btn-outline-secondary d-flex align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#filtersCollapse" aria-expanded="false" aria-controls="filtersCollapse">
                <i class="bi bi-funnel me-1"></i>
                  Filters
                <i class="bi bi-chevron-down ms-1"></i>
              </button>
            </div>
            <div class="tab-content" id="searchModeTabsContent">
              {(tab === 1) && (
                <BasicFilter pathQuery={query} />
              )}
              {(tab === 2) && (
                <AdvanceFilter pathQuery={query} />
              )}
            </div>
          </div>
        </div>
      </main>
      <ResultView query={query} activeTab={tab === 1 ? 'simple' : 'advance'}/>
    </OuterContainer>
  );
};

export default FilterView;
