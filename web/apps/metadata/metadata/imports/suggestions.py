import omero
from omero.sys import ParametersI

# IMPORTANT: whitelist mapping to prevent HQL injection via object_type
HQL_ENTITY_MAP = {
    "Project": "Project",
    "Dataset": "Dataset",
    "Plate": "Plate",
    "Screen": "Screen",
    # add only what you need; keep "Image" excluded per your logic
}

def hql_projection_ids_names(conn, entity_name: str, limit: int = 500):
    """
    Returns list of (id, name) tuples using HQL projection.
    Uses the user's current session/group context (so call after setGroupForSession).
    """
    qs = conn.getQueryService()
    params = ParametersI()
    # HQL projection: only two columns, much faster than loading objects
    hql = f"select o.id, o.name from {entity_name} o order by o.id desc"
    # Add a limit (Filter) to avoid massive responses
    params.page(0, int(limit))
    return qs.projection(hql, params, conn.SERVICE_OPTS)