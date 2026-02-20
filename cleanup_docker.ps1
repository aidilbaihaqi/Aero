# Helper script to clean up Docker containers
# Usage: ./cleanup_docker.ps1

docker-compose down --volumes --remove-orphans
docker system prune -f
