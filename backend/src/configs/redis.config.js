const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.log('Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 50, 1000);
        }
    }
})
redisClient.on('error', err => {
    console.log('Redis Client Error:', err);
    redisClient.isReady = false;
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
    redisClient.isReady = true;
});

redisClient.connect().catch(console.error);

module.exports = redisClient;