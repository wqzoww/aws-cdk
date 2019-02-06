set -e
#set -x

docker run -p 8000:8000 amazon/dynamodb-local &

function cleanup() {
  echo Shutting down DynamoDB Local
  kill $(ps aux | grep "\-p 8000" | grep -v grep | awk '{print $2}')
}
trap cleanup EXIT

export tableName=TestTable

aws dynamodb create-table \
  --endpoint-url http://localhost:8000/\
  --table-name $tableName\
  --key-schema AttributeName=id,KeyType=HASH\
  --attribute-definitions AttributeName=id,AttributeType=S\
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

npm run build

cdk synth -a ./index.js > template.yml

echo sam local invoke --no-event ApiHandler5E7490E8
sam local invoke --no-event ApiHandler5E7490E8 2>/dev/null

echo "echo '[1, 2]' | sam local invoke TwitterProcessor142FC142"
echo '[1, 2]' | sam local invoke TwitterProcessor142FC142 2>/dev/null

echo sam local invoke --no-event ApiHandler5E7490E8
sam local invoke --no-event ApiHandler5E7490E8 2>/dev/null
