chmod +x script.sh
git pull origin master
docker compose down
docker compose build
docker compose up -d
docker ps