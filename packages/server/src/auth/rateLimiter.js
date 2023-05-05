const redisClient = require("../redis/redis.js");
/**
 * Rate limiter middleware that limits the number of requests from a given IP address within a specified time window.
 * @param limitAmount - The maximum number of requests allowed within the time window.
 * @returns {function(*, *, *): Promise<void>} - Middleware function that either sends an error response if the limit is exceeded or calls the next middleware or route handler.
 */
module.exports.rateLimiter = (secondsLimit, limitAmount) => async (req, res, next) => {
    const ip = req.connection.remoteAddress;
    [response] = await redisClient
        .multi()
        .incr(ip)
        .expire(ip, secondsLimit)
        .exec();
    if (response[1] > limitAmount) {
        res.json({
            loggedIn: false,
            message: "Slow down!! Try again in a minute.",
        });
        res.sendStatus(429);
    }
    else next();
};