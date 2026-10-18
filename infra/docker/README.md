# Infrastructure — Docker

This directory will contain all Dockerfiles and Docker Compose configurations (Phase 7).
It includes separate Compose files for development (with hot-reload volumes) and production (with Nginx reverse proxy and Let's Encrypt TLS).
Named volumes, network isolation, and environment variable wiring are all defined here.
