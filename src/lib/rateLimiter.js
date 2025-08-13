const { RateLimiterMemory } = require('rate-limiter-flexible');

const apiRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const messageRateLimiter = new RateLimiterMemory({
  keyGenerator: () => 'global_messages',
  points: parseInt(process.env.RATE_LIMIT_MSGS_PER_MIN) || 12,
  duration: 60,
});

const rateLimiter = async (req, res, next) => {
  try {
    await apiRateLimiter.consume(req.ip);
    next();
  } catch (rateLimitError) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rateLimitError.msBeforeNext / 1000) || 1
    });
  }
};

module.exports = {
  rateLimiter,
  apiRateLimiter,
  messageRateLimiter
};
