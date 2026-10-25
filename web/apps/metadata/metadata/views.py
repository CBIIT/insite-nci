import json
import time
import re
from dotenv import load_dotenv
import requests
import datetime
from typing import Any, Optional
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.encoding import smart_str
from omeroweb.decorators import login_required

from omero.gateway import BlitzGateway, MapAnnotationWrapper, _BlitzGateway
from omero.rtypes import rtime, rstring, rlong, rint
from omeroweb.webclient.controller.search import BaseSearch
from omeroweb.webclient.webclient_utils import getDateTime

from omero.constants.metadata import NSCLIENTMAPANNOTATION
import omero
import os
from .imports.import_metadata import append_metadata, append_file
from .imports.submission_history import save_form, get_user_history
from .imports.search import (
    verify_search_query, 
    toBoolean, 
    filter_dataset, 
    get_object_details,
    exact_ids_by_query,
    exact_ids_by_query_advance,
    objects_owned_by_user
)
import logging
import io
from io import BytesIO
from pathlib import Path
import tempfile
import base64
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from .imports.email import send_email
# from .imports.suggestions import _hql_projection_ids_names, HQL_ENTITY_MAP

# load_dotenv("/etc/env/omero-env.conf", override=False)

# @csrf_exempt
# @login_required()
# def submit(request, conn=None, **kwargs):
#     """
#     Django view that processes metadata submissions and applies annotations to OMERO objects.
    
#     Expects a JSON body structured similarly to the original metadata import script,
#     with keys such as 'project_tags', 'dataset_tags', 'screen_tags', 'plate_tags', 'well_tags', and 'image_tags'.
    
#     The view loops over each tag type, processes the tag dictionaries, and returns a JSON response with
#     the resulting annotation IDs.
#     """
#     try:
#         data = json.loads(request.body)

#         # Map tag types to OMERO object types.
#         object_type_map = {
#             "project_tags": "Project",
#             "dataset_tags": "Dataset",
#             "screen_tags": "Screen",
#             "plate_tags": "Plate",
#             "well_tags": "Well",
#             "image_tags": "Image",
#         }

#         results = {}
#         # Process each type of tag if present in the submitted JSON.
#         for tag_type, object_type in object_type_map.items():
#             if tag_type in data:
#                 results[tag_type] = process_object_tags(conn, object_type, data[tag_type])

#         return JsonResponse(results)
#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
@login_required()
def get_plate_ids_by_screen(conn, screen_id):
    plate_ids = []
    try:
        screen = conn.getObject("Screen", screen_id)
        if screen is not None:
            for plate in screen.listChildren():
                plate_ids.append(plate.getId().getValue())
    except Exception as e:
        logging.error("Error occurred while fetching plate IDs by screen: %s", e, exc_info=True)
        JsonResponse({
            "plate_ids": [],
            "error": "An internal error has occurred."
            },
        status=200)
    return JsonResponse({"plate_ids": plate_ids}, status=200)


@csrf_exempt
def index(request, **kwargs):
    return render(request, 'metadata/index.html')
    
@csrf_exempt
def portal(request, **kwargs):
    """
    Renders the metadata search portal page.
    
    Query parameters:
    - query: Search query to pre-populate the search input
    - datatype: Type of object to search for (projects, datasets, images, screens, plates, wells)
    - field: Field to search in
    - advanced: Whether to use advanced search mode
    """
    # Get query parameters to pre-populate the search form
    context = {
        'query': request.GET.get('query', ''),
        'datatype': request.GET.getlist('datatype'),
        'field': request.GET.getlist('field'),
        'advanced': request.GET.get('advanced', 'false').lower() == 'true',
        'searchGroup': request.GET.get('searchGroup', None),
        'ownedBy': request.GET.get('ownedBy', None),
        'startdate': request.GET.get('startdateinput', None),
        'enddate': request.GET.get('enddateinput', None),
        'useAcquisitionDate': request.GET.get('useAcquisitionDate', 'false').lower() == 'true',
    }
    
    return render(request, 'metadata/portal.html', context)
    
def getImageInfo(image):
    print("get image pixel information")
    try:
        info = {
            "id": image.getId(),  # usually always present
        }
        getters = [
            ("name", image.getName),
            ("sizeX", image.getSizeX),
            ("sizeY", image.getSizeY),
            ("sizeZ", image.getSizeZ),
            ("sizeT", image.getSizeT),
            ("sizeC", image.getSizeC),
            ("pixelType", lambda: str(image.getPixelsType())),
            ("theme", image.getThumbnail(size=(128, 128)))
        ]
        for key, getter in getters:
            try:
                value = getter()
            except Exception:
                # Getter not available or failed: skip this field
                continue

            if value is not None:
                info[key] = value

            return info
    except Exception as e:
        return None 

@csrf_exempt
def get_image_by_id(request, conn=None, **kwargs):
    """
    Example endpoint:
    - Optional JSON body: {"user": "...", "password": "..."}
    - Connects to OMERO, loads image 11422
    - Returns metadata + a sample plane as base64 PNG
    """
    image_id = None
    # --- Parse request body (if present) ---
    payload = json.loads(request.body)
    if request.body:
        try:
            OMERO_USER = os.environ["OMERO_USER"] or None
            OMERO_PASSWORD = os.environ["OMERO_PASSWORD"] or None

            if not OMERO_USER or not OMERO_PASSWORD:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "No credential available",
                    },
                    status=200,
                )

            req_image_id = payload.get("image_id", image_id)

            if not req_image_id:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Provide image id",
                    },
                    status=200,
                )

            if req_image_id:
                image_id = req_image_id
            client = omero.client(host="localhost", port=4064)
            client.createSession(
                username=OMERO_USER,
                password=OMERO_PASSWORD
            )

            # Establish a single connection initially
            conn = BlitzGateway(client_obj=client)
            
            if not conn.connect():
                return JsonResponse(
                {
                    "success": False,
                    "message": "invalid creadential: conn not connected",
                },
                status=200,
            )

            if conn.isConnected():
                image = conn.getObject("Image", image_id)
                if image:
                    imageInfo = getImageInfo(image)
                    if imageInfo:
                        try:
                            thumb_bytes = image.getThumbnail(size=(128, 128))

                            # Return raw bytes as an image response
                            return HttpResponse(thumb_bytes, content_type="image/jpeg")
                        except Exception:
                            return JsonResponse({
                                "error": "exception thumbnail"
                            }, status=200)

                    return JsonResponse(
                        {
                            "success": False,
                            "image id": image_id,
                            "message": "error while retrieving image metadata"
                        },
                        status=200,
                    )

                return JsonResponse(
                    {
                        "success": False,
                        "message": f"No image with id {image_id}"
                    },
                    status=200,
                )
                
            return JsonResponse(
                {
                    "success": True,
                    "message": "Cannot establish connection with user/pass",
                },
                status=200,
            )
        except Exception as e:
            return JsonResponse(
                {
                    "success": False,
                    "message": "No OMERO credentials available",
                },
                status=200,
            )
            

@csrf_exempt
@login_required()
def search_omero_objects(request, conn=None, **kwargs):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    object_type = payload.get("objectType")
    query = payload.get("query")
    # return filter_dataset(request, conn)

    if object_type is None:
        return JsonResponse({"error": "provide object type"}, status=400)
    
    ids = exact_ids_by_query(
        conn,
        object_type,
        query,
    )

    return JsonResponse({
        "success": "true",
        "new_method": "exact_ids_by_query",
        "matchingIds": ids
        },
    status=200)


def _none_if_blank(val: Any) -> Optional[str]:
    """Return None if val is None or a blank/whitespace-only string; else stripped string."""
    if val is None:
        return None
    if isinstance(val, str):
        s = val.strip()
        return s or None
    return val  # non-strings pass through

def _none_if_bad_date(val: Any) -> Optional[str]:
    """Expect YYYY-MM-DD; return None if blank or invalid."""
    s = _none_if_blank(val)
    if not s:
        return None
    return s if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s) else None

def _int_or_none(val: Any) -> Optional[int]:
    s = _none_if_blank(val)
    if s is None:
        return None
    try:
        return int(s)
    except (TypeError, ValueError):
        return None

@csrf_exempt
@login_required()
def search_omero_objects_advance(request, conn=None, **kwargs):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    object_type = payload.get("objectType")
    query = payload.get("query")
    search_group = payload.get("searchGroup")
    field = _none_if_blank(payload.get("field"))
    start_date  = _none_if_bad_date(payload.get("startDate"))
    end_date    = _none_if_bad_date(payload.get("endDate"))
    # return filter_dataset(request, conn)

    if object_type is None:
        return JsonResponse({"error": "provide object type"}, status=400)
    
    ids = exact_ids_by_query_advance(
        conn,
        object_type = object_type,      
        query = query,             
        field = field,               
        search_group = search_group,    
        start_date = start_date,      
        end_date = end_date,       
    )

    return JsonResponse({
        "success": "true",
        "new_method": "exact_ids_by_query",
        "matchingIds": ids
        },
    status=200)

@csrf_exempt
@login_required()
def get_object_metadata(request, conn=None, **kwargs):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    ids = payload.get("ids") or []
    object_type = payload.get("objectType")

    # return JsonResponse({
    #     "status": "success",
    #     "object_type": object_type,
    #     "ids": ids
    # })
    return get_object_details(request, conn, ids, object_type)


@csrf_exempt
@login_required()
def get_project_group(request, conn=None, **kwargs):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        payload = json.loads(request.body)
        project_id = int(payload.get("projectId"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "A valid projectId is required"}, status=400)

    conn.SERVICE_OPTS.setOmeroGroup(-1)
    project = conn.getObject("Project", project_id)
    if project is None:
        return JsonResponse({"error": "Project is not accessible"}, status=404)

    group = project.getDetails().getGroup()
    if group is None:
        return JsonResponse({"error": "Project has no OMERO group"}, status=404)

    return JsonResponse({
        "projectId": project.getId(),
        "groupId": group.getId(),
        "groupName": group.getName(),
    })

@csrf_exempt
@login_required()
def search_metadata(request, conn=None, **kwargs):
    """
    API endpoint for searching metadata across OMERO objects.
    
    Query parameters:
    - query: The search query string
    - datatype: List of object types to search (projects, datasets, images, screens, plates, wells)
    - field: List of fields to search in
    - searchGroup: Group ID to restrict search to
    - ownedBy: Owner ID to restrict search to
    - useAcquisitionDate: Use acquisition date instead of import date (true/false)
    - startdateinput/enddateinput: Date range filtering in format YYYY-MM-DD
    - advanced: Use raw lucene query syntax (true/false)
    - advanced_search: Raw lucene query when advanced=true
    
    Returns JSON with search results grouped by object type.
    """
    filter_date = None
    try:
        # Initialize search manager
        manager = BaseSearch(conn)
        foundById = []

        search_qry = verify_search_query(request)
        if search_qry is False:
            return JsonResponse({"error": "Query parameter is required"}, status=400)
        
        # Get query parameters
        r = request.GET
        query_search = search_qry
        
        # Check for advanced search mode
        advanced = toBoolean(r.get("advanced"))
        if advanced:
            query_search = r.get("advanced_search")
            
        # Get object types to search
        onlyTypes = r.getlist("datatype")
        if not onlyTypes:
            onlyTypes = ["images"]
            
        # Get fields to search in
        fields = r.getlist("field")
        
        # Get group and owner restrictions
        searchGroup = r.get("searchGroup", None)
        ownedBy = r.get("ownedBy", None)
        
        # Use acquisition date?
        useAcquisitionDate = toBoolean(r.get("useAcquisitionDate"))

        # Process date range if provided
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
        filter_date = date
        # Add plates acquisitions to search if plates are included
        if "plates" in onlyTypes:
            onlyTypes.append("plateacquisitions")
        
        # Execute the search
        try:
            manager.search(
                query_search,
                onlyTypes,
                fields,
                searchGroup,
                ownedBy,
                useAcquisitionDate,
                date,
                rawQuery=advanced
            )
            
            # If the query is only numbers (separated by commas or spaces)
            # we search for objects by ID
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
        except Exception as x:
            # Handle search exceptions
            searchError = None
            if isinstance(x, omero.ServerError):
                if "TooManyClauses" in str(x):
                    searchError = (
                        "Please try to narrow down your query. The wildcard"
                        " matched too many terms."
                    )
                elif "caused a parse exception" in str(x):
                    searchError = "There was an error parsing your query."
                    if ":" in query_search:
                        searchError += (
                            " Colons ':' are reserved for searches of"
                            " key-value annotations in the form: 'key:value'."
                        )
                    searchError += (
                        " Please refer to https://omero-guides.readthedocs.io/en/"
                        "latest/introduction/docs/search-omero.html "
                        "for more information."
                    )
                else:
                    # For other server errors, return the error message
                    searchError = str(x)
                    
            return JsonResponse({
                "status": "error",
                "searchError": searchError or str(x)
            }, status=500)
        
        # Format the results as JSON
        containers = {}
        # Convert manager.containers objects to dictionaries
        for obj_type, obj_list in manager.containers.items():
            container_list = []
            for obj in obj_list:
                obj_data = {
                    "id": obj.getId(),
                    "name": obj.getName(),
                    "description": obj.getDescription() or ""
                }
                
                # Add owner and group information if available
                try:
                    obj_data["owner"] = {
                        "id": obj.getOwner().getId(),
                        "name": obj.getOwner().getFullName()
                    }
                    obj_data["group"] = {
                        "id": obj.getDetails().getGroup().getId(),
                        "name": obj.getDetails().getGroup().getName()
                    }
                except Exception:
                    pass
                    
                # Add type-specific details
                if obj_type == "images":
                    obj_data["acquisition_date"] = obj.getAcquisitionDate() and obj.getAcquisitionDate().isoformat() or None
                    obj_data["pixels_size_x"] = obj.getPixelSizeX()
                    obj_data["pixels_size_y"] = obj.getPixelSizeY()
                    obj_data["pixels_size_z"] = obj.getPixelSizeZ()
                elif obj_type == "wells":
                    try:
                        plate = obj.getParent()
                        obj_data["plate"] = {
                            "id": plate.getId(),
                            "name": plate.getName()
                        }
                        obj_data["position"] = obj.getWellPos()
                    except Exception:
                        pass
                        
                container_list.append(obj_data)
            containers[obj_type] = container_list
            
        # Format the foundById results
        found_by_id_list = []
        for item in foundById:
            obj = item["obj"]
            obj_data = {
                "type": item["otype"],
                "id": obj.getId(),
                "name": obj.getName(),
                "description": obj.getDescription() or ""
            }
            
            # Add owner and group information if available
            try:
                obj_data["owner"] = {
                    "id": obj.getOwner().getId(),
                    "name": obj.getOwner().getFullName()
                }
                obj_data["group"] = {
                    "id": obj.getDetails().getGroup().getId(),
                    "name": obj.getDetails().getGroup().getName()
                }
            except Exception:
                pass
                
            found_by_id_list.append(obj_data)
            
        # Return results 
        return JsonResponse({
            "status": "success",
            "filter_date": filter_date,
            "query": query_search,
            "containers": containers,
            "foundById": found_by_id_list,
            "resultCount": manager.c_size + len(found_by_id_list),
            "moreResults": manager.moreResults,
            "searchError": None,
            "useAcquisitionDate": toBoolean(r.get("useAcquisitionDate"))
        })
        
    except Exception as e:
        logging.error("Error in search_metadata: %s", e, exc_info=True)
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)
    
def get_group(conn, data):
    groups = {
        group.getId() : group.getName()
        for group in conn.getGroupsMemberOf()
        if group.getId() and group.getName()
    }
    group_id = None
    obj_types = {
        "project_ids": "Project",
        "dataset_ids": "Dataset",
        "screen_ids": "Screen",
        "plate_ids": "Plate",
        "image_ids": "Image",
    }
    for key in obj_types:
        if key in data:
            obj_type = obj_types[key]
            ids = data[key]
            id = None
            if len(ids) > 0 and id is None:
                id = int(ids[0])
                
            if id:
                omero_obj = conn.getObject(obj_type, id)
                if omero_obj:
                    group_id = omero_obj.getDetails().group.id.val
                    if group_id in groups:
                        return int(group_id)
    return None

@csrf_exempt
@login_required()
def annotate_file(request, conn=None, **kwargs):
    try:
        if not conn or not conn.isConnected():
            return JsonResponse({"error": "OMERO connection not established"}, status=500)
        response = append_file(request, conn)

        return JsonResponse({"response": response})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@login_required()
def archive_metadata(request, conn=None, **kwargs):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    excel_file = request.FILES.get("xlsx")
    json_file = request.FILES.get("json")
    if not excel_file or not json_file:
        return JsonResponse({"error": "Both XLSX and JSON files are required"}, status=400)

    try:
        project_ids = {int(value) for value in json.loads(request.POST.get("projectIds", "[]"))}
        dataset_ids = {int(value) for value in json.loads(request.POST.get("datasetIds", "[]"))}
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid project or dataset IDs"}, status=400)

    if not dataset_ids:
        return JsonResponse({"error": "At least one dataset ID is required"}, status=400)

    archive_dir = Path(os.environ.get(
        "METADATA_ARCHIVE_PATH",
        "/home/nci-omero/omero-nci/omero_scripts/metadata_archive",
    ))

    try:
        conn.SERVICE_OPTS.setOmeroGroup(-1)
        targets = []
        for dataset_id in sorted(dataset_ids):
            dataset = conn.getObject("Dataset", dataset_id)
            if dataset is None:
                continue

            group = dataset.getDetails().getGroup()
            parents = list(dataset.listParents())
            if project_ids:
                parents = [project for project in parents if project.getId() in project_ids]

            for project in parents:
                target = archive_dir.joinpath(
                    _safe_archive_segment(group.getName(), f"group-{group.getId()}"),
                    _safe_archive_segment(project.getName(), f"project-{project.getId()}"),
                    _safe_archive_segment(dataset.getName(), f"dataset-{dataset.getId()}"),
                )
                if target not in targets:
                    targets.append(target)

        if not targets:
            logging.warning(
                "No archive hierarchy found for project IDs %s and dataset IDs %s",
                sorted(project_ids),
                sorted(dataset_ids),
            )
            return JsonResponse({"error": "No accessible project/dataset hierarchy found"}, status=400)

        filename_stem = datetime.datetime.now().strftime("%Y%m%d-%H%M-metadata")
        archived_files = []
        for target in targets:
            target.mkdir(parents=True, exist_ok=True)
            paths = {
                "xlsx": target / f"{filename_stem}.xlsx",
                "json": target / f"{filename_stem}.json",
            }

            for file_type, uploaded_file in (("xlsx", excel_file), ("json", json_file)):
                uploaded_file.seek(0)
                temporary_path = paths[file_type].with_suffix(f"{paths[file_type].suffix}.tmp")
                with temporary_path.open("wb") as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                temporary_path.replace(paths[file_type])

            archived_files.append({
                "directory": str(target.relative_to(archive_dir)),
                "files": {file_type: path.name for file_type, path in paths.items()},
            })

        return JsonResponse({
            "archived": True,
            "archives": archived_files,
        })
    except Exception as e:
        logging.error("Unable to archive metadata files: %s", e, exc_info=True)
        for path in locals().get("paths", {}).values():
            try:
                path.unlink(missing_ok=True)
                path.with_suffix(f"{path.suffix}.tmp").unlink(missing_ok=True)
            except OSError:
                pass
        return JsonResponse({"error": "Unable to archive metadata files"}, status=500)


def _safe_archive_segment(value, fallback):
    segment = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", str(value or "")).strip(" .")
    return segment if segment not in ("", ".", "..") else fallback


@csrf_exempt
@login_required()
def submit_form(request, conn=None, **kwargs):
    group_id = None
    parsed_body = None
    try:
        # get connections
        if conn and conn.isConnected():
            decoded_body = request.body.decode("utf-8")
            parsed_body = json.loads(decoded_body)
            
            # set group id from path param
            raw_gid = parsed_body.pop("groupId", None)
            if raw_gid is not None:
                group_id = int(raw_gid)
            # if "groupId" in parsed_body:
            #     group_id = parsed_body.pop("groupId")
            # groups = {group.getId(): group.getName() for group in conn.getGroupsMemberOf()}
            if group_id:
                for group in conn.getGroupsMemberOf():
                    if group.getId() == int(group_id):
                        conn.setGroupForSession(int(group_id))

            # or get group id from the omero object
            if group_id is None:
                grpId = get_group(conn, parsed_body)
                # update if current obj does not belong to logged in group set
                if grpId:
                    if int(grpId) != conn.getEventContext().groupId:
                        group_id = grpId
                        conn.setGroupForSession(int(grpId))
            res = append_metadata(conn, parsed_body)

            # session_data = {key: value for key, value in request.session.items() if key == 'connector'}
            return JsonResponse({
                "res": res,
            })
        else:
            return JsonResponse({"error": "Failed to connect to OMERO"}, status=500)
    except Exception as e:
        session_data = {key: value for key, value in request.session.items() if key == 'connector'}
        logging.error("An error occurred in submit_form: %s", e, exc_info=True)
        err_log = f"{e}"
        return JsonResponse({
            "error": err_log,
            "session_data": session_data,
            "group_id": group_id,
        }, 
        status=500)

@csrf_exempt
@login_required()
def verify_login(request, conn=None, **kwargs):
    try:
        if hasattr(request, "session"):
            session_data = {key: value for key, value in request.session.items() if key == 'connector'}
            connector = session_data["connector"]
            username = ''
            if conn and conn.isConnected():
                user = conn.getUser()
                username = user.getOmeName()
                email = None
                try:
                    # Depending on OMERO version, email may be a string or rstring
                    email_obj = user.getEmail()
                    if email_obj:
                        email = email_obj.val if hasattr(email_obj, "val") else email_obj
                except Exception:
                    email = None
            if connector:
                return JsonResponse({
                    "isLoggedIn": True,
                    "username": username,
                    "email": email,
                }, status = 200)
        return JsonResponse({
            "isVerify": False,
            "res": json.loads(request)
        }, status = 403)
        
    except Exception as e:
        return JsonResponse({
            "isVerify": False,
            "error": f"{str(e)}"
        }, status = 403)


def get_dataset_images(conn, dataset_id):
    """Return all images for a given dataset ID."""
    all_images = []
    dataset = conn.getObject("Dataset", dataset_id)
    if not dataset:
        return all_images  # Dataset not found

    for image in dataset.listChildren():  # image is an ImageWrapper
        all_images.append({
            "object_id": image.getId(),
            "object_name": image.getName(),
            "object_type": "Image",
            "dataset_id": dataset.getId(),
        })
    return all_images


def get_project_images(conn, project_id):
    """Return all images for a given project ID (across all datasets)."""
    all_objects = []
    # set the group
    grpId = get_group(conn, {"project_id": [project_id]})
    if grpId:
        conn.setGroupForSession(int(grpId))

    project = conn.getObject("Project", project_id)
    if not project:
        return all_objects  # Project not found

    for dataset in project.listChildren():  # dataset is a DatasetWrapper
        all_objects.extend(get_dataset_images(conn, dataset.getId()))

    return all_objects

# @csrf_exempt
# @login_required()
# def suggestions_v1(request, conn=None, **kwargs):
#     try:
#         all_objects = []
#         if not hasattr(request, "body"):
#             return JsonResponse({"error": "missing request body"}, status=400)

#         parsed_body = json.loads(request.body.decode("utf-8"))

#         if not (conn and conn.isConnected()):
#             return JsonResponse({"error": "no OMERO connection"}, status=500)

#         # Keep your fast paths as-is
#         if "projectId" in parsed_body:
#             project_id = parsed_body["projectId"]
#             if project_id:
#                 all_objects = get_project_images(conn, project_id)
#                 return JsonResponse({"matches": all_objects}, status=200)

#         if "datasetIds" in parsed_body:
#             dataset_ids = parsed_body["datasetIds"] or []
#             for ds_id in dataset_ids:
#                 all_objects += get_dataset_images(conn, ds_id)
#             return JsonResponse({"matches": all_objects}, status=200)

#         # Optimized suggestions by objectTypes
#         if "objectTypes" in parsed_body:
#             object_types = parsed_body["objectTypes"] or []

#             curr_group_id = conn.getEventContext().groupId
#             explored_ids = set()

#             groups = conn.getGroupsMemberOf()

#             # Optional: overall cap across everything (prevents runaway payload)
#             OVERALL_LIMIT = int(parsed_body.get("limit", 2000))
#             PER_GROUP_LIMIT = int(parsed_body.get("perGroupLimit", 500))

#             try:
#                 for object_type in object_types:
#                     if object_type == "Image":
#                         continue

#                     entity = HQL_ENTITY_MAP.get(object_type)
#                     if not entity:
#                         # ignore unknown/unapproved types
#                         continue

#                     for group in groups:
#                         conn.setGroupForSession(int(group.getId()))

#                         try:
#                             rows = hql_projection_ids_names(conn, entity, limit=PER_GROUP_LIMIT)
#                             for oid, oname in rows:
#                                 oid = int(oid.val) if hasattr(oid, "val") else int(oid)
#                                 if oid in explored_ids:
#                                     continue
#                                 explored_ids.add(oid)

#                                 # oname may be None for some types; keep it safe
#                                 name_val = oname.val if hasattr(oname, "val") else oname
#                                 all_objects.append({
#                                     "object_id": oid,
#                                     "object_name": name_val or "",
#                                     "object_type": object_type,
#                                 })

#                                 if len(all_objects) >= OVERALL_LIMIT:
#                                     return JsonResponse({"matches": all_objects}, status=200)

#                         except Exception:
#                             # keep your behavior: skip failures per group/type
#                             continue

#             finally:
#                 conn.setGroupForSession(int(curr_group_id))

#             return JsonResponse({"matches": all_objects}, status=200)

#         return JsonResponse({"error": "unable to find matching"}, status=500)

#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@login_required()
def suggestions(request, conn=None, **kwargs):
    try:
        all_objects = []
        if hasattr(request, "body"):
            decoded_body = request.body.decode("utf-8")
            parsed_body = json.loads(decoded_body)

            if conn and conn.isConnected():
                if "projectId" in parsed_body:
                    project_id = parsed_body["projectId"]
                    if project_id:
                        all_objects = get_project_images(conn, project_id)
                        return JsonResponse({
                            "matches": all_objects,
                        }, status = 200)
                if "datasetIds" in parsed_body:
                    dataset_ids = parsed_body["datasetIds"]
                    for id in dataset_ids:
                        images = get_dataset_images(conn, id)
                        all_objects += images
                    return JsonResponse({
                        "matches": all_objects,
                    }, status = 200)

            if "objectTypes" in parsed_body:
                # images of dataset only
                object_types = parsed_body["objectTypes"]
                if conn and conn.isConnected():
                    curr_group_id = conn.getEventContext().groupId
                    # iterate over object type
                    for object_type in object_types:
                        if object_type == "Image":
                            continue
                        try:
                            explored_ids = []
                            groups = conn.getGroupsMemberOf()
                            # get omero id for each of the groups
                            for group in groups:
                                conn.setGroupForSession(int(group.getId()))
                                group_objects = conn.getObjects(object_type)
                                for obj in group_objects:
                                    # avoid duplicate objects
                                    id = obj.getId()
                                    if id not in explored_ids:
                                        explored_ids.append(id)
                                        all_objects.append({
                                            "object_id": id,
                                            "object_name": obj.getName(),
                                            "object_type": object_type,
                                        })
                    # Skip images that are linked to WellSample
                        except Exception as e:
                            continue
                    conn.setGroupForSession(int(curr_group_id))
                    return JsonResponse({
                        "matches": all_objects,
                    }, status = 200)
        return JsonResponse({
            "error": "unable to find matching ",
        }, status = 500)
        
    except Exception as e:
        return JsonResponse({
            "error": f"{str(e)}"
        }, status = 500)

@csrf_exempt
@login_required()
def fetch_ncit_term(request, conn=None, **kwargs):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    query = payload.get("query")

    if not query:
        return JsonResponse({"error": "Missing query parameter"}, status=400)

    EVS_BASE_URL = (
        "https://evsexplore.semantics.cancer.gov/"
        "evsexplore/api/v1/concept/search"
    )

    params = {
        "terminology": "ncit",
        "include": "summary,highlights,properties",
        "pageSize": "100",
        "term": query,
        "retmode": "json",
    }

    try:
        r = requests.get(EVS_BASE_URL, params=params, timeout=30)

        if r.status_code != 200:
            return JsonResponse(
                {"error": "EVS request failed"},
                status=r.status_code,
            )

        return JsonResponse(r.json(), status=200)

    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@login_required()
def suggest_by_objectType(request, conn=None, **kwargs):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    object_type = payload.get("objectType")
    query = payload.get("query")
    data = objects_owned_by_user(conn, object_type, query)
    return JsonResponse({
      "data": data,
      "objectType": object_type,
    }, status = 200)

@csrf_exempt
@login_required()
def save_history(request, conn=None, **kwargs):
    try:
        if hasattr(request, "body"):
            response = save_form(request, conn)
            return JsonResponse({
              "response": response,
            }, status = 200)

    except Exception as e:
        return JsonResponse({
            "error": f"{str(e)}",
            "method": "save_history"
        }, status = 500)


@csrf_exempt
@login_required()
def get_history(request, conn=None, **kwargs):
    try:
        response = get_user_history(request, conn)
        return JsonResponse({
          "response": response,
        }, status = 200)

    except Exception as e:
        return JsonResponse({
            "error": f"{str(e)}",
            "method": "save_history"
        }, status = 500)
    

@csrf_exempt
@login_required()
def send_email_notification(request, conn=None, **kwargs):
    try: 
        excel_file = request.FILES.get("file")
        metadata_file = request.FILES.get("metadata")
        subject = request.POST.get("emailSubject")
        content = request.POST.get("emailContent")
        if not excel_file:
            return JsonResponse({"error": "Missing file"}, status=400)
        
        recipients = request.POST.getlist("recipient")

        valid_recipients = []
        for r in recipients:
            try:
                validate_email(r)
                valid_recipients.append(r)
            except ValidationError:
                pass

        if not excel_file:
            return JsonResponse({"error": "Missing excel file (field: file)"}, status=400)
        if not metadata_file:
            return JsonResponse({"error": "Missing metadata JSON file (field: metadata)"}, status=400)
        if not valid_recipients:
            return JsonResponse({"error": "No valid email recipients were provided"}, status=400)

        send_email(excel_file, metadata_file, valid_recipients, subject, content)

        return JsonResponse({
            "response": "email sent",
            "recipients": valid_recipients
        }, status = 200)
    
    except Exception as e:
        logging.error("Unable to send metadata email: %s", e, exc_info=True)
        return JsonResponse({
            "error": f"{str(e)}",
            "method": "send email"
        }, status = 500)
