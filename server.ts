import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {ProtoGrpcType} from './proto/random';
import { ChatServiceHandlers } from './proto/randomPackage/ChatService';
import {listUsers, addUser,updateUser} from './data';
import {Status} from './proto/randomPackage/Status'
import { User } from './proto/randomPackage/User';
const PORT = 8082;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

function main() {
  const server = getServer();

  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      return;
    };
    console.log(`Your server as started on port ${port}`);
    server.start();
  });
};

// const callObjByUsername = new Map<string, grpc.ServerDuplexStream<ChatRequest, ChatResponse>>()

function getServer() {
  const server = new grpc.Server();
  server.addService(randomPackage.ChatService.service, {
    ChatInitiate: (call, callback) => {
      
      const sessionName = call.request.name || '';
      const avatar = call.request.avatarUrl || '';

      if(!sessionName || !avatar) return callback(new Error("Name and avatar required"))

      listUsers((err: Partial<grpc.StatusObject> | grpc.ServerErrorResponse | null, users: any[])=> {
        // Handle errors first
        if(err) return callback(err);
        const dbUser = users.find( u => u.name?.toLowerCase() === sessionName);
        // If user does NOT exist 
        if(!dbUser){
          const user:User = {
            id: Math.floor(Math.random() * 10000),
            status: Status.ONLINE,
            name: sessionName, 
            avatarUrl: avatar
          };
          addUser(user, (err)=> {
            if(err) return callback(err);
            return callback(null, {id: user.id})
          })
        }
        // If user DOES exist, check if their status is online 
        if(dbUser.status === Status.ONLINE){
           callback(new Error("User Exists"))
           return 
        }
        dbUser.status = Status.ONLINE
        updateUser(dbUser, (err:any)=> {
          if(err)return callback(err)
          return callback(null, {id: dbUser.id})
        })
      })
      // If valid data, reach into database.
        // Check if user with name already exists and is online.
          // If online, return error.
          // If not, get them online and send back the user number


    }
  } as ChatServiceHandlers)

  return server
}

main();