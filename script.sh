set -e

echo ">> pull code"
git pull origin master

chmod +x script.sh

echo ">> build docker image"
docker build -t nodetest:v1 . 

echo ">> create pre version"
docker commit nodetest nodetest:pre

echo ">> stop current image"
docker stop nodetest

echo ">> delete current image"
docker rm nodetest

docker run --net host -d  --name nodetest nodetest:v1

docker ps

docker logs nodetest