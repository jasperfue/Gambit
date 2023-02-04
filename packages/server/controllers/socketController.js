const redisClient = require('../src/redis.js');

module.exports.authorizeUser = (socket, next) => {
    if(!socket.request.session) {
        console.log('No session');
        next(new Error('No session'));
    } else if (!socket.request.session.user){
        console.log(socket.request.session.user);
        console.log('user not logged In');
        next();
    } else {
        socket.user = {...socket.request.session.user};
        redisClient.hset(`userid:${socket.user.username}`, "userid", socket.user.userid);
        next();
    }
}

module.exports.addFriend = async (socket, requestName, cb) => {
    console.log(socket.request.session.user.username);
    if(requestName === socket.request.session.user.username) {
        cb({done:false, errorMsg: "You can not add yourself as a Friend"});
        return;
    }
    const requestNameId = await redisClient.hget(`userid:${requestName}`, "userid");
    if(!requestNameId) {
        cb({done:false, errorMsg: "User doesn't exist"});
        return;
    }
    const currentFriendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
    if(currentFriendList && currentFriendList.indexOf(requestName) !== -1) {
        cb({done:false, errorMsg: "You are already friends with that user"});
        return;
    }
    await redisClient.lpush(`friend:${socket.request.session.user.username}`, requestName);
    cb({done:true});
    return;


}