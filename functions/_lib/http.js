export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(init.headers || {})
    }
  });
}

export function errorResponse(message, status = 400) {
  return json({ error: message }, { status });
}

export async function readJsonBody(request, maxBytes = 200_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new HttpError('Request body too large.', 413);
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError('Invalid JSON body.', 400);
  }
}

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

// Wraps a Pages Functions handler so HttpError -> proper status/JSON, and any
// unexpected exception -> 500 without leaking internals to the client.
export function withErrorHandling(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (err) {
      if (err instanceof HttpError) {
        return errorResponse(err.message, err.status);
      }
      console.error(err);
      return errorResponse('Internal server error.', 500);
    }
  };
}
