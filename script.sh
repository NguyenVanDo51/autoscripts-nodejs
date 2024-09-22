chmod +x script.sh
git pull origin master
docker compose up -d --build
docker ps