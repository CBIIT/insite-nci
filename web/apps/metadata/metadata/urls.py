from django.urls import re_path, path

from . import views

urlpatterns = [
    re_path(r'^$', views.index, name='metadata_index'),
    path('portal', views.portal, name='metadata_portal'),
    path('api/verify', views.verify_login, name='user_verify'),
    path('api/suggestions', views.suggestions, name='suggestions'),
    # path('api/suggestions', views.suggestions_v1, name='suggestions')
    path('api/suggestionsByUser', views.suggest_by_objectType, name='suggestionsByUser'),
    path('api/submit', views.submit_form, name='metadata_submit'),
    path('api/archive-metadata', views.archive_metadata, name='metadata_archive'),
    path('api/upload-file', views.annotate_file, name='upload_metadata_file'),
    path('api/search', views.search_metadata, name='metadata_search'),
    path('api/search-omero-object', views.search_omero_objects, name='metadata_search'),
    path('api/search-omero-object-advance', views.search_omero_objects_advance, name='metadata_search'),
    path('api/object-details', views.get_object_metadata, name='metadata_search_details'),
    path('api/project-group', views.get_project_group, name='metadata_project_group'),
    path('api/thumbnail', views.get_image_by_id, name='shiny_view thumbnail'),
    path('api/sendEmail', views.send_email_notification, name='shiny_view thumbnail'),
    path('api/fetch_ncit_term', views.fetch_ncit_term, name='thesarus api')
]
