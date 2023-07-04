import redis from 'redis';
import { User } from './proto/randomPackage/User';
const client = redis.createClient();

client.on('error', console.error);
client.on('connect', console.log);

const REDIST_KEYS = {
    boradcastRoom: "room:0:messages",
    users: "users",
};

// Creating a type definition for error cb 
// Passing in type `T` which is a generic 
type ErrCB<T> = (err: Error |null, data: T ) => void;

// user object: type User imported from the compiled code
export const addUser = (user: User, fn?: ErrCB<number>) => {
    client.rPush(REDIST_KEYS.users, JSON.stringify(user), fn);
};
// 0 start -1 end, gets you entire range (like python)
export const listUsers =  (fn: ErrCB<Array<User>>) => {
    client.lRange(REDIST_KEYS.users, 0, -1, (err, rows)=> {
        if(err) return fn(err, []) 
        const users: Array<User> = []
        for(const row of rows){
            const user = JSON.parse(row) as User 
            users.push(user)
        }
       fn(err, users);
    })
};

// Go through all users and check for that specific user 
export const updateUser = (user: User, fn: ErrCB<unknown>) => {
    listUsers((err, users) => {
        if(err) return fn(err,null);
        // To update list, we need a specific index 
        const i = users.findIndex(u => u.id === user.id);
        if(i === -1) return fn(new Error('User was not found'),null);
        client.lSetet(REDIST_KEYS.users, i, JSON.stringify(user), (err, ok)=> fn);
    });
};

