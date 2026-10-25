from django.shortcuts import render
from django.urls import reverse

from omeroweb.decorators import login_required

@login_required()
def index(request, conn=None, **kwargs):
    experimenter = conn.getUser()

    # A dictionary of data to pass to the html template
    context = {'firstName': experimenter.firstName,
               'lastName': experimenter.lastName,
               'experimenterId': experimenter.id}
    print('context', context)
    return render(request, 'webapp/index.html', context)
