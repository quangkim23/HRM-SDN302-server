const jwt = require("jsonwebtoken");
const asyncHandler = require("./async-handler-middleware");
const CustomError = require("../core/custom-error");
const ErrorTypes = require("../constants/error-type");
const ErrorMessages = require("../constants/error-message");
const redisClient = require("../configs/redis.config");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith(`Bearer`)) {
    const token = req.headers.authorization.trim().split(` `)[1];

    if (redisClient.isReady) {
      const [cacheUser, isBlacklisted] = await Promise.all([
        redisClient.get(`token_${token}`),
        redisClient.get(`bl_token_${token}`),
      ]);

      console.log(isBlacklisted);

      if (isBlacklisted == 'true')
        throw new CustomError(
          ErrorTypes.InvalidToken,
          ErrorMessages.InvalidToken,
          403
        );

      if (cacheUser) {
        req.user = JSON.parse(cacheUser);
        return next();
      }
    }

    try {
      var decode = await jwt.verify(token, process.env.JWT_SECRET);

      if (redisClient.isReady) {
        await redisClient.set(`token_${token}`, JSON.stringify(decode), {
          EX: 900,
          NX: true,
        });
      }
      req.user = decode;
      return next();
    } catch (error) {
      throw new CustomError(
        ErrorTypes.InvalidToken,
        ErrorMessages.InvalidToken,
        403
      );
    }
  } else {
    throw new CustomError(
      ErrorTypes.RequireAuthentication,
      ErrorMessages.RequireAuthentication,
      401
    );
  }
});

module.exports = {
  verifyAccessToken,
};
