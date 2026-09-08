# Serves the static campaign on port 8000, which is the port the ZopCloud
# service is configured to expect. Only visitor-facing files are copied in;
# PRODUCT.md, the handoff record, docs/ and the QA harness stay out of the image.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css audit.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 8000
