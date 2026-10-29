# Build the Angular shell, then serve it and the API from one small Python image.
FROM node:22-slim AS ui
WORKDIR /ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY ui/ ./
RUN npx ng build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UI_DIR=/app/ui
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/wrapper ./wrapper
COPY --from=ui /ui/dist/home-dashboards-ui/browser ./ui
RUN useradd --uid 10001 --no-create-home wrapper
USER wrapper
EXPOSE 8097
HEALTHCHECK --interval=15s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8097/healthz')"
CMD ["sh", "-c", "exec uvicorn wrapper.main:app --host 0.0.0.0 --port 8097 --proxy-headers --forwarded-allow-ips \"${FORWARDED_ALLOW_IPS:-127.0.0.1}\""]
