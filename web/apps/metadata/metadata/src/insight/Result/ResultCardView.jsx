import React from "react";

const CardView = ({
  result, 
  objectType
}) => {
  const name = result?.name || 'Unnamed';
  const description = result?.description || 'No description';
  const id = result?.id;
  // Get icon based on object type
  switch(objectType) {
    case 'projects': icon = 'folder'; break;
    case 'datasets': icon = 'collection'; break;
    case 'screens': icon = 'grid-3x3'; break;
    case 'plates': icon = 'grid-3x2'; break;
    case 'wells': icon = 'grid-1x2'; break;
    default: icon = 'image';
  }
  // Get singular object type
  const singularType = objectType.endsWith('s') ? objectType.slice(0, -1) : objectType;

  return (
    <div class="col-md-4">
      <div class="card h-100 border-0 shadow-sm">
        <div class="position-relative">
          <div class="result-card-image d-flex justify-content-center align-items-center">
            {(objectType === 'images') ? 
              (<img 
                src={`/webgateway/render_thumbnail/${id}`}
                alt={name}
                loading="lazy"
                onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML += '<i class=\'bi bi-image\' style=\'font-size: 3rem; opacity: 0.6;\'></i>';"
              />)
              : 
              (<i class="bi bi-${icon}" style="font-size: 3rem; opacity: 0.6;"></i>)
            }
          </div>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0 text-truncate">{name}</h5>
          </div>
          <div class="small mb-3 d-flex gap-2 align-items-center">
            <span class="badge bg-secondary">{singularType}</span>
            <span class="text-muted">ID: {id}</span>
          </div>
          <p class="card-text small text-truncate">${description}</p>
          {(result?.owner) && (
            <div class="small text-muted mb-2">
              <i class="bi bi-person"></i> {result?.owner?.name || 'Unknown'}
            </div>
          )}
          {result?.acquisition_date && (
            <div class="small text-muted">
              <i class="bi bi-calendar"></i> {new Date(result?.acquisition_date).toLocaleDateString()}
            </div>
          )}
        </div>
        <div class="card-footer bg-transparent border-top d-flex justify-content-between align-items-center">
          <div class="d-flex flex-wrap gap-1">
            <span class="badge bg-info bg-opacity-10 text-info algorithm-badge">
              <i class="bi bi-cpu"></i> Algorithm
            </span>
          </div>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-three-dots"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              {(objectType === 'images') ? (
                <>
                  <li>
                    <a 
                      class="dropdown-item" 
                      href="/webclient/?show=image-${id}" 
                      target="_blank"
                    >
                      <i class="bi bi-eye me-2"></i>View in OMERO
                    </a>
                  </li>
                  <li>
                    <a 
                      class="dropdown-item" 
                      href="/webgateway/img_detail/${id}/" 
                      target="_blank"
                    >
                      <i class="bi bi-search me-2"></i>View Detail</a>
                  </li>
                </>
              ) : (
                <li>
                  <a 
                    class="dropdown-item" 
                    href="/webclient/?show=${singularType}-${id}" 
                    target="_blank"
                  >
                  <i class="bi bi-eye me-2"></i>View
                  </a>
                </li>
              )}
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-download me-2"></i>
                    Download
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-info-circle me-2"></i>
                  Details
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardView;
