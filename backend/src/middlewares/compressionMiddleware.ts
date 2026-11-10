import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

/**
 * Native Zero-Dependency Gzip/Deflate Compression Middleware
 * Automatically compresses JSON and text responses >= 1KB when client supports it.
 */
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = (req.headers['accept-encoding'] as string) || '';
  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
    return next();
  }

  const originalSend = res.send;

  res.send = function (body: any): Response {
    if (res.headersSent) {
      return originalSend.call(this, body);
    }

    // Only compress string or Buffer payloads
    let buffer: Buffer | null = null;
    let contentType = res.getHeader('Content-Type') as string | undefined;

    if (typeof body === 'string') {
      buffer = Buffer.from(body);
      if (!contentType) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    } else if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (typeof body === 'object' && body !== null) {
      const jsonStr = JSON.stringify(body);
      buffer = Buffer.from(jsonStr);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    // Do not compress tiny payloads (< 1024 bytes) to avoid CPU overhead
    if (!buffer || buffer.length < 1024) {
      return originalSend.call(this, body);
    }

    // Remove Content-Length so compressed size is calculated correctly
    res.removeHeader('Content-Length');

    try {
      if (acceptEncoding.includes('gzip')) {
        const compressed = zlib.gzipSync(buffer, { level: 6 });
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        return originalSend.call(this, compressed);
      } else if (acceptEncoding.includes('deflate')) {
        const compressed = zlib.deflateSync(buffer, { level: 6 });
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Vary', 'Accept-Encoding');
        return originalSend.call(this, compressed);
      }
    } catch {
      // If compression fails, fall back smoothly to uncompressed body
      return originalSend.call(this, body);
    }

    return originalSend.call(this, body);
  };

  next();
};

