# OMERO Image Proxy via NGINX

This section shows how NGINX is configured to proxy OMERO so that images can be viewed inside an external app (e.g., GitHub App IO) using the same domain.

> **Note:** The key is to route `/omero/` (and image-rendering paths) through NGINX to the internal OMERO.web service on **rana22**, while preserving headers and cookies so the OMERO session works correctly.

```nginx

    location = /omero_plus/return-to-external {
        return 302 https://rana22.github.io/svelte-app/#/omero;  # your external app route
    }
    location ~ ^/(webclient|iviewer)/ {
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_redirect off;
       proxy_buffering off;
       error_page 502 =502 @maintenance_omero;
 
       proxy_pass http://omeroweb;
 
       # Remove any frame-blocking headers from upstream
       proxy_hide_header X-Frame-Options;
       proxy_hide_header Content-Security-Policy;
       # Allow embedding from your external site
       add_header X-Frame-Options "ALLOW-FROM https://rana22.github.io" always;
       add_header Content-Security-Policy "frame-ancestors 'self' https://rana22.github.io" always;
    }
    location ~ ^/(webclient|iviewer|webgateway)/ {
       # same block as above
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_redirect off;
       proxy_buffering off;
       error_page 502 =502 @maintenance_omero;
      proxy_pass http://omeroweb;
       # Remove any frame-blocking headers from upstream
       proxy_hide_header X-Frame-Options;
       proxy_hide_header Content-Security-Policy;
       # Allow embedding from your external site
       add_header X-Frame-Options "ALLOW-FROM https://rana22.github.io" always;
       add_header Content-Security-Policy "frame-ancestors 'self' https://rana22.github.io" always;
    }

    location ^~ /webgateway/ {
        # --- CORS for external Svelte app ---
        add_header Access-Control-Allow-Origin "https://rana22.github.io" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;
        # Handle preflight directly
        if ($request_method = OPTIONS) {
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        # proxy to OMERO web
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_buffering off;
        error_page 502 =502 @maintenance_omero;
    
        proxy_pass http://omeroweb;
    }

```

```bash
# On the OMERO.web host (as the omero user)
bin/omero config set omero.web.session_cookie_secure False
bin/omero config set omero.web.secure_proxy False
bin/omero web restart
```