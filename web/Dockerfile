FROM --platform=linux/amd64 rockylinux:9 

ARG GS_REPO_USER
ARG GS_REPO_PASSWORD
ARG UID=1000
ARG GID=1000

ENV GS_REPO_USER=${GS_REPO_USER}
ENV GS_REPO_PASSWORD=${GS_REPO_PASSWORD}

RUN dnf -y update \
    && dnf -y install \
    dos2unix \
    python3 \
    python3-pip \
    gcc \
    gcc-c++ \
    gettext \
    bzip2-devel \
    openssl-devel \
  && dnf clean all

ENV OMERO_PREFIX=/opt/omero

WORKDIR ${OMERO_PREFIX}

# Install OMERO.venv (contains OMERO.web)
ENV OMERO_VENV=$OMERO_PREFIX/OMERO.venv
ENV OMERODIR=$OMERO_PREFIX/OMERO.web
ENV PATH=$OMERO_VENV/bin:$PATH

# Python environment setup
COPY web/pip.conf /etc/pip.conf.template
RUN envsubst < /etc/pip.conf.template > /etc/pip.conf
COPY web/requirements.txt .

RUN python3 -m venv ${OMERO_VENV} \
    && ${OMERO_VENV}/bin/pip install --upgrade pip setuptools wheel \
    && ${OMERO_VENV}/bin/pip install -r requirements.txt \
    && mkdir -p ${OMERODIR}

# Create omero user (should match the UID and GID of the /OMERO volume owner)
RUN groupadd -g ${GID} omero && \
    useradd -m -d /home/omero -s /bin/bash -u ${UID} -g ${GID} omero \
    && chown -R omero:omero ${OMERO_PREFIX}

COPY web/entrypoint.sh /bin/entrypoint.sh

RUN chmod +x /bin/entrypoint.sh

RUN dos2unix /bin/entrypoint.sh

USER omero

WORKDIR ${OMERODIR}

COPY --chown=omero:omero web/apps apps/
COPY --chown=omero:omero web/static static/
COPY --chown=omero:omero web/templates templates/
COPY --chown=omero:omero . /omero-nci

CMD entrypoint.sh
