// src/middlewares/cacheMiddleware.js
import { getCache } from '../utils/cache.js';

/**
 * makeCacheMiddleware(prefixFn)
 * prefixFn: function (req) => key string
 *
 * Example usage:
 * router.get('/', cacheMiddleware(req => `courses:list:${req.query.q || ''}:page:${req.query.page||1}`), controller)
 */
export const cacheMiddleware = (keyFn) => {
  return async (req, res, next) => {
    try {
      const key = keyFn(req);
      const cached = await getCache(key);
      if (cached) {
        // Return cached JSON response
        return res.json(cached);
      }
      // attach cacheKey to req so controller can set cache after DB fetch
      req.cacheKey = key;
      next();
    } catch (err) {
      console.error('cacheMiddleware error', err);
      next();
    }
  };
};
