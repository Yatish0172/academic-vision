from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse


class RequestSizeLimit:
    """Limit actual bytes received, including chunked multipart requests."""
    def __init__(self, app, limit=82 * 1024 * 1024):
        self.app = app
        self.limit = limit

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        headers = dict(scope.get('headers', []))
        try:
            declared = int(headers.get(b'content-length', b'0'))
        except ValueError:
            return await JSONResponse({'detail': 'Invalid Content-Length.'}, status_code=400)(scope, receive, send)
        if declared > self.limit:
            return await JSONResponse({'detail': 'Request exceeds the 82 MB upload limit.'}, status_code=413)(scope, receive, send)
        size = 0

        async def limited_receive():
            nonlocal size
            message = await receive()
            size += len(message.get('body', b''))
            if size > self.limit:
                raise HTTPException(413, 'Request exceeds the upload limit.')
            return message

        await self.app(scope, limited_receive, send)
