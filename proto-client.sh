mkdir -p ./my-app/src/proto
protoc -I=. ./proto/*.proto \
  --js_out=import_style=commonjs:./my-app/src \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:./my-app/src