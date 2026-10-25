
import datetime, logging, re, time
from omero.rtypes import rstring, rlong, rtime
import omero
from django.http import JsonResponse
from django.utils.encoding import smart_str
from omeroweb.webclient.controller.search import BaseSearch
from omero.sys import ParametersI
from collections import defaultdict

def toBoolean(val):
    """Convert string to boolean"""
    if val is not None and val.lower() == 'true':
        return True
    return False

def get_only_types(request):
    r = request.GET
    # Get object types to search
    onlyTypes = r.getlist("datatype")
    if not onlyTypes:
        onlyTypes = ["images"]
    
    if "plates" in onlyTypes:
        onlyTypes.append("plateacquisitions")
    
    return onlyTypes

def _to_bool(v):
    if v is None:
        return False
    return str(v).strip().lower() in {"1", "true", "yes", "on"}

# validate / process search query
def verify_search_query(request):
    r = request.GET
    query_search = r.get("query", None)
    if query_search is None:
        return False
    
    # Replace + with spaces (from URL encoding)
    query_search = query_search.replace("+", " ")
    return query_search

def _parse_query(r):
    advanced = _to_bool(r.get("advanced"))
    if advanced and r.get("advanced_search"):
        return r.get("advanced_search"), True
    q = r.get("query")
    if not q:
        return None, False
    # refined_query = re.sub(r'[^A-Za-z0-9]+', ' ', q or '').strip()
    return q, False

def get_search_queries(request):
    print("get search queries")
    # Get query parameters
    r = request.GET
    query_search = verify_search_query(request)
        
    if not query_search:
        return JsonResponse({"error": "Query parameter is required"}, status=400)

def _only_types(r):
    types = r.getlist("objectType") or ["images", "datasets", "projects", "plates", "wells", "screens"]
    if "plates" in types:
        types.append("plateacquisitions")
    return types

def _fields(r):
    return r.getlist("field") or []

# Process date range if provided
def get_date_range(request):
    r = request.GET
    date = None
    startdate = r.get("startDate", None)
    startdate = startdate is not None and smart_str(startdate) or None
    enddate = r.get("endDate", None)
    enddate = enddate is not None and smart_str(enddate) or None
        
    if startdate is not None:
        if enddate is None:
            n = datetime.datetime.now()
            enddate = "%s-%02d-%02d" % (n.year, n.month, n.day)
        date = "%s_%s" % (startdate, enddate)
    return date

def _date_range(r):
    # support both new(startDate/endDate) and legacy(startdateinput/enddateinput)
    start = r.get("startDate") or r.get("startdateinput")
    end   = r.get("endDate")   or r.get("enddateinput")
    if not start:
        return None
    if not end:
        now = datetime.datetime.now()
        end = f"{now.year}-{now.month:02d}-{now.day:02d}"
    return f"{start}_{end}"


def _resolve_experimenter_id(conn, user):
    if user in (None, "me"):
        return conn.getEventContext().userId
    if isinstance(user, int) or str(user).isdigit():
        return int(user)
    exp = conn.getAdminService().lookupExperimenter(str(user).strip())
    return exp.getId()


# If the query is only numbers (separated by commas or spaces)
# we search for objects by ID
def search_by_id(conn, query_search, onlyTypes):
    foundById = []
    isIds = re.compile(r"^[\d ,]+$")
    if isIds.search(query_search) is not None:
        conn.SERVICE_OPTS.setOmeroGroup(-1)
        idSet = set()
        for queryId in re.split(" |,", query_search):
            if len(queryId) == 0:
                continue
            try:
                searchById = int(queryId)
                if searchById in idSet:
                    continue
                idSet.add(searchById)
                for t in onlyTypes:
                    t = t[0:-1]  # remove 's'
                    if t in (
                        "project",
                        "dataset",
                        "image",
                        "screen",
                        "plate",
                        "well",
                    ):
                        obj = conn.getObject(t, searchById)
                        if obj is not None:
                            foundById.append({"otype": t, "obj": obj})
            except ValueError:
                pass
    return foundById 

def _search_by_ids(conn, only_types, query):
    found = []
    if re.fullmatch(r"[\d ,]+", query or "") is None:
        return found
    conn.SERVICE_OPTS.setOmeroGroup(-1)
    seen = set()
    for tok in re.split(r"[ ,]+", query.strip()):
        if not tok:
            continue
        try:
            oid = int(tok)
        except ValueError:
            continue
        if oid in seen:
            continue
        seen.add(oid)
        for t in only_types:
            otype = t[:-1]  # images -> image, etc.
            if otype not in {"project", "dataset", "image", "screen", "plate", "well"}:
                continue
            obj = conn.getObject(otype, oid)
            if obj:
                found.append({"otype": otype, "obj": obj})
    return found

def _collect(obj):
    tags, key_values = [], []
    max_items = 20
    n = 0
    try:
        anns = obj.listAnnotations()
    except Exception:
        return tags, key_values
    for ann in anns:
        if n >= max_items:
            break
        n += 1
        oclass = getattr(ann, "OMERO_CLASS", None) or ann.__class__.__name__

        # --- Tag annotations ------------------------------------------------
        if "TagAnnotation" in oclass:
            try:
                tv = ann.getTextValue()
                if tv:
                    tags.append(str(tv))
            except Exception:
                pass

        # --- Map (key-value) annotations -----------------------------------
        elif "MapAnnotation" in oclass:
            try:
                pairs = ann.getValue() or []
            except Exception:
                pairs = []
            # pairs can be list of (name,value) tuples or NamedValue objects
            for p in pairs:
                try:
                    key = getattr(p, "name", None) or p[0]
                    val = getattr(p, "value", None) or p[1]
                    key_values.append({
                        "key": str(key),
                        "value": "" if val is None else str(val)
                    })
                except Exception:
                    continue
    return tags, key_values

def _serialize_common(obj):
    out = {
        "id": obj.getId(),
        "name": obj.getName(),
        "description": obj.getDescription() or "",
    }
    tag_matches, ann_matches = _collect(obj)
    out["tags"] = tag_matches
    out["annotations"] = ann_matches
    try:
        out["owner"] = {"id": obj.getOwner().getId(), "name": obj.getOwner().getFullName()}
        out["group"] = {"id": obj.getDetails().getGroup().getId(),
                        "name": obj.getDetails().getGroup().getName()}
    except Exception:
        pass
    return out

def _serialize_by_type(obj_type, obj):
    data = _serialize_common(obj)
    if obj_type == "images":
        try:
            ad = obj.getAcquisitionDate()
            data["acquisition_date"] = ad.isoformat() if ad else None
        except Exception:
            data["acquisition_date"] = None
        data["pixels_size_x"] = obj.getPixelSizeX()
        data["pixels_size_y"] = obj.getPixelSizeY()
        data["pixels_size_z"] = obj.getPixelSizeZ()
    elif obj_type == "wells":
        try:
            plate = obj.getParent()
            data["plate"] = {"id": plate.getId(), "name": plate.getName()}
            data["position"] = obj.getWellPos()
        except Exception:
            pass
    return data

def _format_results(manager, found_by_id):
    containers = {}
    for obj_type, objs in manager.containers.items():
        containers[obj_type] = [_serialize_by_type(obj_type, o) for o in objs]
    found = []
    for item in found_by_id:
        o = item["obj"]
        entry = _serialize_common(o)
        entry["type"] = item["otype"]
        found.append(entry)
    return containers, found

def _map_omero_error(x, query):
    try:
        import omero  # type: ignore
        if isinstance(x, omero.ServerError):
            s = str(x)
            if "TooManyClauses" in s:
                return "Please narrow your query; the wildcard matched too many terms."
            if "caused a parse exception" in s:
                msg = "There was an error parsing your query."
                if ":" in (query or ""):
                    msg += " Colons are reserved for key-value annotation queries like 'key:value'."
                msg += (" See https://omero-guides.readthedocs.io/en/latest/"
                        "introduction/docs/search-omero.html for details.")
                return msg
    except Exception:
        pass
    return str(x)

def _image_dict(img):
    return {
        "id": img.getId(),
        "name": img.getName(),
        "owner": getattr(img.getOwner(), "getFullName", lambda: None)() if img.getOwner() else None,
        "groupId": img.getDetails().getGroup().getId() if img.getDetails() and img.getDetails().getGroup() else None,
    }

def _images_from_entity(conn, obj_type, obj, limit=20):
    out, seen = [], set()

    def push(img):
        iid = img.getId()
        if iid not in seen:
            seen.add(iid)
            out.append(_image_dict(img))
        return len(out) >= limit
    
    # Dataset → Images
    # get the numeric id
    object_id = obj.get("id") if isinstance(obj, dict) else obj
    try:
        object_id = int(object_id)
    except Exception:
        return out
    
    if obj_type == "datasets":
        ds = conn.getObject("Dataset", object_id)
        if ds:
            for img in ds.listChildren():
                if push(img): break

    # Project → Datasets → Images
    elif obj_type == "projects":
        pr = conn.getObject("Project", object_id)
        if pr:
            for ds in pr.listChildren():
                for img in ds.listChildren():
                    if push(img): break
                if len(out) >= limit: break
        

    # Well → WellSamples → Image
    elif obj_type == "wells":
        well = conn.getObject("Well", object_id)
        if well:
            # Only images from *this* well's samples
            for ws in well.listChildren():  # WellSamples
                try:
                    w = ws.getWell()
                    if int(w.getId()) != object_id:      # paranoid guard
                        continue
                    img = ws.getImage()
                    if img and push(img):
                        break
                except Exception:
                    continue
        
    # Plate → Wells → Images (via samples)
    elif obj_type == "plates":
        plate = conn.getObject("Plate", object_id)
        if plate:
            for well in plate.listChildren():
                imgs = _images_from_entity(conn, "wells", {"id": well.getId()}, limit - len(out))
                for d in imgs:
                    if d["id"] not in seen:
                        seen.add(d["id"]); out.append(d)
                if len(out) >= limit: break
        
    # Screen → Plates → Wells → Images
    elif obj_type == "screens":
        screen = conn.getObject("Screen", object_id)
        if screen:
            for plate in screen.listChildren():
                imgs = _images_from_entity(conn, "plates", {"id": plate.getId()}, limit - len(out))
                for d in imgs:
                    if d["id"] not in seen:
                        seen.add(d["id"]); out.append(d)
                if len(out) >= limit: break
        
    return out, len(out)


def _rt(x):  # OMERO RType -> Python
        return getattr(x, "val", x)

def _chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

def _singular(t: str) -> str:
    m = {
        "images":"Image","datasets":"Dataset","projects":"Project",
        "plates":"Plate","wells":"Well","screens":"Screen",
        "image":"Image","dataset":"Dataset","project":"Project",
        "plate":"Plate","well":"Well","screen":"Screen"
    }
    return m.get(t.lower(), t)

def _empty_rec(oid: int):
    return {"id": oid, "name": "", "description": "", "tags": []}


def filter_dataset(request, conn=None):
    try:
        r = request.GET
        # verify query search
        query, advanced = _parse_query(r)
        if not query:
            return JsonResponse({"error": "Query parameter is required"}, status=400)
        query_search = query

        only_types = _only_types(r)
        fields = _fields(r)

        r = request.GET

        # Get fields to search in
        fields = r.getlist("field") or ["name", "description", "tags", "annotations"]

        # Get group and owner restrictions
        search_group = r.get("searchGroup", None)
        owned_by = r.get("ownedBy", None)
        # Use acquisition date?
        use_acq = _to_bool(r.get("useAcquisitionDate"))
        date = _date_range(r)

        # search by date range
        date = get_date_range(request)

        images_per_parent = int(request.GET.get("imagesPerParent", 20))

        # Execute the search
        start = time.perf_counter()
        manager = BaseSearch(conn)
        try:
            manager.search(
                query, only_types, fields, search_group, owned_by,
                useAcquisitionDate=use_acq,  # keep exact parameter name your BaseSearch expects
                date=date, rawQuery=advanced
            )
            
            found_by_id = _search_by_ids(conn, only_types, query_search)
        
        except Exception as x:
            return JsonResponse(
                {"status": "error", "searchError": _map_omero_error(x, query_search)},
                status=500
            )
        end_1 = time.perf_counter()
        # containers, found = _format_results(manager, found_by_id)


        # Safe debug summaries
        # manager_container_counts = {k: len(v) for k, v in manager.containers.items()}   # counts only
        # or, if you want IDs:
        # manager_container_ids = {k: [o.getId() for o in v] for k, v in manager.containers.items()}

        manager_container_brief = {
            obj_type: [
                int(o.getId())
                for o in objs
            ]
            for obj_type, objs in manager.containers.items()
        }
        # image_ids = [o.getId() for o in manager.containers.get("images", [])][:50]
        # data = fetch_with_annotations(conn, "images", image_ids, group_id=request.GET.get("searchGroup"))

        end_2 = time.perf_counter()

        return JsonResponse({
            "status": "success",
            "query": query,
            "filter_date": date,
            # "manager_container_counts": manager_container_counts,
            # "manager_container_ids": manager_container_ids,
            "manager_container_brief": manager_container_brief,
            "total_time_search": round(end_1 - start, 3),
            "total_time_refine": round(end_2 - end_1, 3),
            # "data": data,
            "containers": manager_container_brief,
            # "foundById": found,
            # "resultCount": manager.c_size + len(found),
            "moreResults": manager.moreResults,
            "searchError": None,
            "useAcquisitionDate": use_acq
        })

    except Exception as e:
        logging.error("Error in search_metadata: %s", e, exc_info=True)
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def apply_map_annotations_flatten(
    conn,
    q,
    otype,
    oid_list,
    child_2_parent,
    base,
    reserved,
    chunk_size,
    over_budget
):
    """
    Populate `base[oid]` with flattened MapAnnotation key/values for objects of type `otype`.

    - `q`:         conn.getQueryService()
    - `opts`:      conn.SERVICE_OPTS
    - `otype`:     "Image" | "Dataset" | "Project" | "Plate" | "Well" | "Screen"
    - `oid_list`:  IDs to fetch
    - `base`:      dict of existing records (will be updated in-place)
    - `reserved`:  keys that must not be overwritten (e.g., {"id","name","description","tags",...})
    - `chunk_size`: HQL paging size
    - `over_budget`: callback -> bool; if True, stop early
    - `rt`:        RType→Python converter (defaults to `.val` passthrough)

    Returns:
      True if stopped early due to `over_budget()`, else False.
    """
    if not oid_list:
        return False

    hql_maps = f"""
        select o.id, kv.name, kv.value
        from {otype} o
        join o.annotationLinks al
        join al.child ma
        join ma.mapValue kv
        where type(ma) = MapAnnotation and o.id in (:ids)
    """
    """set up parent mapping to child Image / Well """
    parent_obj = {}
    if child_2_parent is not None:
        parent_obj = {i: {"id": i, "name": "", "description": "", "tags": []} for i in oid_list}
    
    for chunk in _chunks(oid_list, chunk_size):
        if over_budget():
            return True
        p = ParametersI().addIds(chunk)
        rows = q.projection(hql_maps, p, conn.SERVICE_OPTS) or []
        for oid, k, v in rows:
            oid = int(_rt(oid))
            key = (_rt(k) or "").strip()
            val = (_rt(v) or "").strip()
            if not key:
                continue

            rec = base.setdefault(oid, {}) if child_2_parent is None else {}
            # avoid clobbering reserved/core keys
            key = f"ann_{key}" if key in reserved else key
            
            if child_2_parent is not None:
                pObj = parent_obj.setdefault(oid, {})
                pObj[key] = val

            else:
                if key not in rec:
                    rec[key] = val
                else:
                    if not isinstance(rec[key], list):
                        rec[key] = [rec[key]]
                    if val and val not in rec[key]:
                        rec[key].append(val)

    # map parent to child
    if child_2_parent is not None:
        for child, parent in child_2_parent.items():
            ch_rec = base.setdefault(int(child), {})
            if isinstance(parent, (list, tuple, set)):
                parent_ids = list(parent)
            else:
                parent_ids = [parent]

            for pId in parent_ids:    
                if pId in parent_obj:
                    meta = parent_obj.get(int(pId), {"id": int(pId), "name": "", "description": "", "tags": []})
                    ch_rec[f"{otype}_{int(pId)}"] = meta

    return False

def fetch_with_annotations(
    conn,
    obj_type: str,
    ids,
    chunk_size=1000,
    group_id=None,            # pass a specific group id; avoid -1 here
    max_runtime_sec=200,       # hard wall-clock budget
    max_ids=5000,               # optional cap on how many IDs to process
    dedupe_sort_tags=True
):
    """
    Returns a list of dicts like:
    {
      id, name, description,
      tags: ["tag1","tag2"],
      <ann_key_1>: <ann_value_or_list>, ...
    }
    If time budget is exceeded, returns what’s gathered so far and sets
    fetch_with_annotations.last_meta = {"timed_out": True, ...}
    """
    start = time.perf_counter()
    deadline = start + float(max_runtime_sec)

    def time_left() -> float:
        return deadline - time.perf_counter()

    def over_budget() -> bool:
        return time_left() <= 0

    ids = [int(i) for i in ids]
    if not ids:
        fetch_with_annotations.last_meta = {
            "timed_out": False, "processed": 0, "total_ids": 0,
            "elapsed_sec": 0.0
        }
        return []

    # Optional cap on how many we'll process this call
    if isinstance(max_ids, int) and max_ids > 0:
        ids = ids[:max_ids]

    otype = _singular(obj_type)
    reserved = {"id", "name", "description", "tags"}
    old_group = conn.SERVICE_OPTS.getOmeroGroup()
    timed_out = False
    processed_ids_base = set()  # which IDs completed the "base" phase

    try:
        # NOTE: avoid setOmeroGroup(-1) for HQL; use a specific group.
        if group_id is not None and int(group_id) >= 0:
            conn.SERVICE_OPTS.setOmeroGroup(int(group_id))

        q = conn.getQueryService()

        # ---------- 1) Base fields ----------
        base = {i: {"id": i, "name": "", "description": "", "tags": []} for i in ids}
        hql_base = f"select o.id, o.name, o.description from {otype} o where o.id in (:ids)"
        if otype == "Well":
            hql_base = f"select o.id from {otype} o where o.id in (:ids)"

        for chunk in _chunks(ids, chunk_size):
            if over_budget():
                timed_out = True
                break
            p = ParametersI().addIds(chunk)
            rows = q.projection(hql_base, p, conn.SERVICE_OPTS) or []
            if otype != "Well":
                for oid, nm, ds in rows:
                    d = base[int(_rt(oid))]
                    d["name"] = _rt(nm) or ""
                    d["description"] = _rt(ds) or ""
                    processed_ids_base.add(d["id"])
            else:
                processed_ids_base = ids

        # The rest of the phases only run for IDs that completed base
        work_ids = [i for i in ids if i in processed_ids_base]
        if not work_ids or over_budget():
            timed_out = timed_out or over_budget()
            # Return what we have so far
            out = [base[i] for i in ids if i in base]
            fetch_with_annotations.last_meta = {
                "timed_out": timed_out,
                "processed": len(work_ids),
                "total_ids": len(ids),
                "elapsed_sec": round(time.perf_counter() - start, 3)
            }
            return out

        # ---------- 2) Tags ----------
        hql_tags = f"""
            select o.id, a.textValue
            from {otype} o
            join o.annotationLinks al
            join al.child a
            where type(a) = TagAnnotation and o.id in (:ids)
        """
        for chunk in _chunks(work_ids, chunk_size):
            if over_budget():
                timed_out = True
                break
            p = ParametersI().addIds(chunk)
            rows = q.projection(hql_tags, p, conn.SERVICE_OPTS) or []
            for oid, txt in rows:
                base[int(_rt(oid))]["tags"].append((_rt(txt) or "").strip())

        # ---------- 3) MapAnnotations (flatten) ----------
        if not over_budget():
            timed_out = apply_map_annotations_flatten(
                conn,
                q=q,
                otype=otype,
                oid_list=work_ids,
                child_2_parent=None,
                base=base,
                reserved=reserved,
                chunk_size=chunk_size,
                over_budget=over_budget
            )

        # --------------- 4) Parent annotation ---------
        # ------- (A) Image -------------
        if otype == "Image":
            # Image -> Dataset(s)
            hql_img_ds = """
                select dil.child.id, dil.parent.id
                from DatasetImageLink dil
                where dil.child.id in (:ids)
            """
            img_to_ds = defaultdict(list)

            for chunk in _chunks(work_ids, chunk_size):
                if over_budget():
                    timed_out = True
                    break
                p = ParametersI().addIds(chunk)
                rows = q.projection(hql_img_ds, p, conn.SERVICE_OPTS) or []
                for img_r, ds_r in rows:
                    img_id = int(_rt(img_r))
                    ds_id  = int(_rt(ds_r))
                    if ds_id not in img_to_ds[img_id]:
                        img_to_ds[img_id].append(ds_id)

            # (optional) record the list of parent dataset ids per image
            for img_id in work_ids:
                ds_ids = list(dict.fromkeys(img_to_ds.get(img_id, [])))
                if ds_ids:
                    base[img_id]["parent_dataset_ids"] = ds_ids

            all_ds_ids = sorted({ds for lst in img_to_ds.values() for ds in lst})

            # --- Dataset -> Project(s)
            ds_to_pr = defaultdict(list)
            if all_ds_ids and not over_budget():
                hql_ds_pr = """
                    select pdl.child.id, pdl.parent.id
                    from ProjectDatasetLink pdl
                    where pdl.child.id in (:ids)
                """
                for chunk in _chunks(all_ds_ids, chunk_size):
                    if over_budget():
                        timed_out = True
                        break
                    p = ParametersI().addIds(chunk)
                    rows = q.projection(hql_ds_pr, p, conn.SERVICE_OPTS) or []
                    for ds_r, pr_r in rows:
                        ds_id = int(_rt(ds_r))
                        pr_id = int(_rt(pr_r))
                        if pr_id not in ds_to_pr[ds_id]:
                            ds_to_pr[ds_id].append(pr_id)

            # Build image -> project(s) map (dedup, preserve order)
            img_to_pr = {}
            for img_id, ds_ids in img_to_ds.items():
                seen, pr_ids = set(), []
                for d in ds_ids:
                    for p in ds_to_pr.get(d, []):
                        if p not in seen:
                            seen.add(p)
                            pr_ids.append(p)
                if pr_ids:
                    img_to_pr[img_id] = pr_ids

            # --- Attach Dataset metadata under dynamic keys: "Dataset_<id>"
            if all_ds_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Dataset",          # prefix used for key naming by your helper
                    oid_list=all_ds_ids,
                    child_2_parent=img_to_ds, # {image_id: [dataset_ids]}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out

            # --- Attach Project metadata under dynamic keys: "Project_<id>"
            all_pr_ids = sorted({p for lst in img_to_pr.values() for p in lst})
            if all_pr_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Project",          # prefix used for key naming by your helper
                    oid_list=all_pr_ids,
                    child_2_parent=img_to_pr, # {image_id: [project_ids]}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out

        # ------- (B) Well -------------
        if otype == "Image":
            # Image -> Well (via WellSample) -> Plate -> Screen
            hql_img_well = """
                select ws.image.id, ws.well.id
                from WellSample ws
                where ws.image.id in (:ids)
            """
            img_to_well = {}  # {image_id: well_id}
            for chunk in _chunks(work_ids, chunk_size):
                if over_budget():
                    timed_out = True
                    break
                p = ParametersI().addIds(chunk)
                rows = q.projection(hql_img_well, p, conn.SERVICE_OPTS) or []
                for img_r, well_r in rows:
                    img_id = int(_rt(img_r))
                    w_val = _rt(well_r)
                    if w_val is not None:
                        img_to_well[img_id] = int(w_val)
            # Optional quick lookup id
            for img_id, well_id in img_to_well.items():
                base[img_id]["parent_well_id"] = well_id

            all_well_ids = sorted(set(img_to_well.values()))

            # Well -> Plate (direct)
            well_to_plate = {}  # {well_id: plate_id}
            if all_well_ids and not over_budget():
                hql_well_plate = """
                    select w.id, w.plate.id
                    from Well w
                    where w.id in (:ids)
                """
                for chunk in _chunks(all_well_ids, chunk_size):
                    if over_budget():
                        timed_out = True
                        break
                    p = ParametersI().addIds(chunk)
                    rows = q.projection(hql_well_plate, p, conn.SERVICE_OPTS) or []
                    for w_r, p_r in rows:
                        w_id = int(_rt(w_r))
                        p_val = _rt(p_r)
                        if p_val is not None:
                            well_to_plate[w_id] = int(p_val)
            
            # Image -> Plate (via its Well)
            img_to_plate = {}  # {image_id: plate_id}
            for img_id, w_id in img_to_well.items():
                pl_id = well_to_plate.get(w_id)
                if pl_id is not None:
                    img_to_plate[img_id] = pl_id
                    base[img_id]["parent_plate_id"] = pl_id  # optional quick id

            all_plate_ids = sorted(set(well_to_plate.values()))

            # Plate -> Screen(s)
            plate_to_screen = defaultdict(list)  # {plate_id: [screen_ids]}
            if all_plate_ids and not over_budget():
                hql_plate_screen = """
                    select spl.child.id, spl.parent.id
                    from ScreenPlateLink spl
                    where spl.child.id in (:ids)
                """
                for chunk in _chunks(all_plate_ids, chunk_size):
                    if over_budget():
                        timed_out = True
                        break
                    p = ParametersI().addIds(chunk)
                    rows = q.projection(hql_plate_screen, p, conn.SERVICE_OPTS) or []
                    for plate_r, screen_r in rows:
                        pl_id = int(_rt(plate_r))
                        sc_id = int(_rt(screen_r))
                        if sc_id not in plate_to_screen[pl_id]:
                            plate_to_screen[pl_id].append(sc_id)

            # Image -> Screen(s) (via its Plate)
            img_to_screen = {}  # {image_id: [screen_ids]}
            for img_id, pl_id in img_to_plate.items():
                scr_ids = list(dict.fromkeys(plate_to_screen.get(pl_id, [])))  # de-dupe, keep order
                if scr_ids:
                    img_to_screen[img_id] = scr_ids
                    base[img_id]["parent_screen_ids"] = scr_ids  # optional quick ids

            # ---- Attach parent blobs with flattened MapAnnotations ------------------
            # NOTE: apply_map_annotations_flatten supports child_2_parent as single id OR list.

            # Well_<id>
            if all_well_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Well",
                    oid_list=all_well_ids,
                    child_2_parent=img_to_well,   # {image_id: well_id}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out

            # Plate_<id>
            if all_plate_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Plate",
                    oid_list=all_plate_ids,
                    child_2_parent=img_to_plate,  # {image_id: plate_id}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out

            # Screen_<id> (one-to-many)
            all_screen_ids = sorted({s for lst in img_to_screen.values() for s in lst})
            if all_screen_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Screen",
                    oid_list=all_screen_ids,
                    child_2_parent=img_to_screen, # {image_id: [screen_ids]}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out
                

        if otype == "Well":
            print("Get parent objects for well")
            hql_well_plate = """
                select w.id, w.plate.id
                from Well w
                where w.id in (:ids)
            """
            well_to_plate: dict[int, int] = {}

            for chunk in _chunks(work_ids, chunk_size):
                if over_budget():
                    timed_out = True
                    break
                p = ParametersI().addIds(chunk)
                rows = q.projection(hql_well_plate, p, conn.SERVICE_OPTS) or []
                for w_r, p_r in rows:
                    w_id = int(_rt(w_r))
                    p_val = _rt(p_r)
                    if p_val is not None:
                        pl_id = int(p_val)
                        well_to_plate[w_id] = pl_id
            # (optional) record the parent plate id per well
            for w_id, pl_id in well_to_plate.items():
                base[w_id]["parent_plate_id"] = pl_id

            all_plate_ids = sorted(set(well_to_plate.values()))
            # Plate -> Screen(s)
            plate_to_screen = defaultdict(list)
            if all_plate_ids and not over_budget():
                hql_plate_screen = """
                    select spl.child.id, spl.parent.id
                    from ScreenPlateLink spl
                    where spl.child.id in (:ids)
                """
                for chunk in _chunks(all_plate_ids, chunk_size):
                    if over_budget():
                        timed_out = True
                        break
                    p = ParametersI().addIds(chunk)
                    rows = q.projection(hql_plate_screen, p, conn.SERVICE_OPTS) or []
                    for plate_r, screen_r in rows:
                        pl_id = int(_rt(plate_r))
                        sc_id = int(_rt(screen_r))
                        if sc_id not in plate_to_screen[pl_id]:
                            plate_to_screen[pl_id].append(sc_id)
            
            # Build Well -> Screen(s) map (via its Plate), de-dupe, preserve order
            well_to_screen: dict[int, list[int]] = {}
            for w_id, pl_id in well_to_plate.items():
                scr_ids = list(dict.fromkeys(plate_to_screen.get(pl_id, [])))
                if scr_ids:
                    well_to_screen[w_id] = scr_ids
            
            # (optional) record the list of parent screen ids per well
            for w_id, scr_ids in well_to_screen.items():
                base[w_id]["parent_screen_ids"] = scr_ids

            # --- Attach Plate metadata under dynamic keys: "Plate_<id>"
            if all_plate_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Plate",                # dynamic key prefix inside helper
                    oid_list=all_plate_ids,       # unique parent plate ids
                    child_2_parent=well_to_plate, # {well_id: plate_id}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out
            
            # --- Attach Screen metadata under dynamic keys: "Screen_<id>"
            all_screen_ids = sorted({s for lst in well_to_screen.values() for s in lst})
            if all_screen_ids and not over_budget():
                timed_out = apply_map_annotations_flatten(
                    conn=conn,
                    q=q,
                    otype="Screen",               # dynamic key prefix inside helper
                    oid_list=all_screen_ids,      # unique parent screen ids
                    child_2_parent=well_to_screen,# {well_id: [screen_ids]}
                    base=base,
                    reserved=reserved,
                    chunk_size=chunk_size,
                    over_budget=over_budget,
                ) or timed_out

        # ---------- finalize ----------
        if dedupe_sort_tags:
            for rec in base.values():
                if "tags" in rec:
                    rec["tags"] = sorted({t for t in rec["tags"] if t})

        out = [base[i] for i in ids if i in base]
        fetch_with_annotations.last_meta = {
            "timed_out": timed_out,
            "processed": len(work_ids),
            "total_ids": len(ids),
            "elapsed_sec": round(time.perf_counter() - start, 3)
        }
        return out

    finally:
        conn.SERVICE_OPTS.setOmeroGroup(old_group)

def objects_owned_by_user(
    conn,
    obj_type: str,          # project|dataset|image|plate|screen  (no well)
    query: str,
    limit: int = 1500
):
    """
    Return [{id, name}] for OMERO objects of the given type owned by `user`.
    Wells are NOT supported and will raise ValueError.
    """
    otype = _singular(obj_type)
    val = (query or "").strip().lower()
    if otype == "Well":
        raise ValueError("Well objects are not supported by this function.")

    qsvc, opts = conn.getQueryService(), conn.SERVICE_OPTS
    old_gid = opts.getOmeroGroup()
    try:
        results = []
        v = f"%{val}%"
        if v.isdigit():
            id = int(v)
            hql = f"select o.id, o.name from {otype} o where o.id like :id"
            p = ParametersI().addString("id", id).page(0, int(limit))
        else:
            hql = f"select o.id, o.name from {otype} o where str(o.name) like :v"
            p = ParametersI().addString("v", v).page(0, int(limit))

        rows = qsvc.projection(hql, p, opts) or []
        results = [{"id": int(_rt(i)), "name": (_rt(n) or "")} for (i, n) in rows]
        return results
    finally:
        opts.setOmeroGroup(old_gid)

def exact_ids_by_query(
        conn,
        obj_type: str,
        query: str,
        offset=0,
        limit=5000         # cap per subquery to keep things snappy
    ):
    """
    Return a de-duplicated list of OMERO object IDs whose value matches `query` EXACTLY
    in the requested `fields`.
    """

    if query is None:
        return None
    
    otype = _singular(obj_type)
    val = (query or "").strip().lower()
    if not val:
        return []

    qsvc, opts = conn.getQueryService(), conn.SERVICE_OPTS
    old_gid = opts.getOmeroGroup()
    # start = time.perf_counter()

    try:
        ids = []
        v = f"%{val}%"

        if otype != "Well":
            # name
            p = ParametersI().addString("v", v).page(0, int(limit))
            hql = f"select o.id from {otype} o where lower(o.name) like :v"
            ids += [int(_rt(i)) for (i,) in (qsvc.projection(hql, p, opts) or [])]

            # description
            p = ParametersI().addString("v", v).page(0, int(limit))
            hql = f"select o.id from {otype} o where lower(o.description) like :v"
            ids += [int(_rt(i)) for (i,) in (qsvc.projection(hql, p, opts) or [])]

        # tag text
        p = ParametersI().addString("v", v).page(0, int(limit))
        hql = f"""
            select distinct o.id
            from {otype} o
            join o.annotationLinks al
            join al.child a
            where type(a) = TagAnnotation
              and lower(a.textValue) like :v
        """
        ids += [int(_rt(i)) for (i,) in (qsvc.projection(hql, p, opts) or [])]

        # map-annotation values
        p = ParametersI().addString("v", v).page(0, int(limit))
        hql = f"""
            select distinct o.id
            from {otype} o
            join o.annotationLinks al
            join al.child ma
            join ma.mapValue kv
            where type(ma) = MapAnnotation
              and lower(kv.value) like :v
        """
        ids += [int(_rt(i)) for (i,) in (qsvc.projection(hql, p, opts) or [])]

        # de-dup (preserve order)
        seen, out = set(), []
        for i in ids:
            if i not in seen:
                seen.add(i); out.append(i)
        return out
    finally:
        opts.setOmeroGroup(old_gid)

def _date_params(start_date: str = None, end_date: str = None):
    """Return (where_sql, params_dict) for creationEvent date filters."""
    where = []
    params = {}
    if start_date or end_date:
        from datetime import datetime, timedelta, timezone
        if start_date:
            sd = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
            params["start"] = rtime(int(sd.timestamp() * 1000))
            where.append("o.details.creationEvent.time >= :start")
        if end_date:
            # inclusive end of day
            ed = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            ed = ed + timedelta(days=1) - timedelta(milliseconds=1)
            params["end"] = rtime(int(ed.timestamp() * 1000))
            where.append("o.details.creationEvent.time <= :end")
    return (" and ".join(where) if where else ""), params

def exact_ids_by_query_advance(
    conn,
    object_type: str,            # "Project" | "Dataset" | "Image" | etc.
    field: str = None,           # "name" | "description" | "tag" | "map" (optional; if missing => all)
    query: str = None,           # text to search (substring, case-insensitive)
    search_group: int = None,    # optional: run query under this group
    start_date: str = None,      # optional "YYYY-MM-DD"
    end_date: str = None,        # optional "YYYY-MM-DD"
    offset: int = 0,
    limit: int = 5000,
):
    """
    Return de-duplicated OMERO IDs for `object_type` matching `query`.
    - If `field` is omitted/invalid, search name, description, TagAnnotation.textValue, MapAnnotation.key/value.
    - Date filter is on o.details.creationEvent.time (change to updateEvent if you prefer).
    - All filters are optional.
    """
    if query is None:
        return None

    otype = _singular(object_type)
    q = (query or "").strip().lower()
    if not q:
        return []

    qsvc, opts = conn.getQueryService(), conn.SERVICE_OPTS
    old_gid = opts.getOmeroGroup()
    v = f"%{q}%"

    # Build common date WHERE and params
    date_where, date_params = _date_params(start_date, end_date)
    date_sql = f" and {date_where}" if date_where else ""

    # Define searchable fields
    # Each entry: (joins_sql, where_sql)
    SEARCH_SPECS = {
        "name": (
            "",
            "lower(o.name) like :v"
        ),
        "description": (
            "",
            "lower(o.description) like :v"
        ),
        "tag": (
            "join o.annotationLinks al join al.child a",
            "type(a) = TagAnnotation and lower(a.textValue) like :v"
        ),
        "map": (
            "join o.annotationLinks al join al.child ma join ma.mapValue kv",
            "type(ma) = MapAnnotation and (lower(kv.name) like :v or lower(kv.value) like :v)"
        ),
    }

    if otype == "Well":
        SEARCH_SPECS = {
            "tag": (
                "join o.annotationLinks al join al.child a",
                "type(a) = TagAnnotation and lower(a.textValue) like :v"
            ),
            "map": (
                "join o.annotationLinks al join al.child ma join ma.mapValue kv",
                "type(ma) = MapAnnotation and (lower(kv.name) like :v or lower(kv.value) like :v)"
            ),
        }

    # Decide which specs to run
    fld = (field or "").strip().lower()
    specs = [SEARCH_SPECS[fld]] if fld in SEARCH_SPECS else list(SEARCH_SPECS.values())

    try:
        if search_group is not None:
            # Py3: int is fine; some stacks still call long()
            opts.setOmeroGroup(int(search_group))

        ids = []
        for joins_sql, where_sql in specs:
            p = ParametersI().page(int(offset), int(limit))
            p.addString("v", v)
            # add date params if any
            for k, val in date_params.items():
                p.add(k, val)

            hql = f"""
                select distinct o.id
                from {otype} o
                {joins_sql}
                where {where_sql}{date_sql}
            """
            rows = qsvc.projection(hql, p, opts) or []
            ids.extend(int(_rt(r[0])) for r in rows)

        # de-duplicate preserving order
        seen, out = set(), []
        for i in ids:
            if i not in seen:
                seen.add(i)
                out.append(i)
        return out
    finally:
        opts.setOmeroGroup(old_gid)

def get_object_details(request, conn, ids, object_type):
    object_ids = ids
    data = fetch_with_annotations(conn, object_type, object_ids)
    # details = get_object_metadata(conn, object_type, object_ids)
    return JsonResponse({
        "status": "success",
        "data": data,
        "ids": ids
    })
