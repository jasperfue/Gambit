const redisClient = require("./redis.js");
module.exports.rateLimiter = async (req, res, next) => {
    const ip = req.connection.remoteAddress;
    const response = await redisClient.multi().incr(ip).expire(60).exec();
    console.log(response);
}