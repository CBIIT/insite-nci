#!/bin/bash
set -ex

pushd ${OMERODIR}
source activate 

# Load configuration
omero load -k --glob "config/*.omero"

# Install apps
for app in apps/*; do
  if [ -d "$app" ]; then
    pip install -e "$app" || true
  fi
done

omero web start --foreground
