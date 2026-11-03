import hmac
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from uuid import uuid4

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.responses import Response

from src.answers.compare import load_comparison
from src.answers.explain import load_explanation
from src.answers.schema import ComparisonBody, ExplanationBody, SearchBody
from src.answers.search import load_search
from src.answers.stream import start_answer
from src.config import get_config
from src.errors import NotFoundError, UnauthorizedError, UnavailableError
from src.sentry import init_sentry

logger = logging.getLogger("nearcrawl.inference")
_SERVER_FAILURE = 500


def create_app() -> FastAPI:
    init_sentry(get_config())
    logging.basicConfig(level=logging.INFO)
    app = FastAPI()
    _install_middleware(app)
    _install_errors(app)
    _install_routes(app)
    return app


def _install_middleware(app: FastAPI) -> None:
    app.middleware("http")(_request_id)


async def _request_id(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    status = response.status_code
    if status >= 400:
        report_failure(_stored_error(request), request, status)
    response.headers["x-request-id"] = request_id
    return response


def _stored_error(request: Request) -> BaseException:
    error = getattr(request.state, "sentry_error", None)
    if isinstance(error, BaseException):
        return error
    return Exception("HTTP")


def _install_errors(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def invalid(request: Request, exc: RequestValidationError) -> JSONResponse:
        request.state.sentry_error = exc
        return JSONResponse(
            {"error": "Validation failed", "details": _details(exc)},
            status_code=400,
        )

    @app.exception_handler(UnauthorizedError)
    async def unauthorized(request: Request, exc: UnauthorizedError) -> JSONResponse:
        request.state.sentry_error = exc
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    @app.exception_handler(NotFoundError)
    async def missing(request: Request, exc: NotFoundError) -> JSONResponse:
        request.state.sentry_error = exc
        return JSONResponse({"error": str(exc)}, status_code=404)

    @app.exception_handler(UnavailableError)
    async def unavailable(request: Request, exc: UnavailableError) -> JSONResponse:
        request.state.sentry_error = exc
        return JSONResponse({"error": "Inference service is unavailable"}, status_code=503)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        request.state.sentry_error = exc
        return JSONResponse({"error": "Internal server error"}, status_code=500)


def _install_routes(app: FastAPI) -> None:
    # Render health checks call GET /health. A request for / returns 404.
    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/explanations")
    async def explanations(body: ExplanationBody, request: Request) -> StreamingResponse:
        require_bearer(request)
        prepared = await load_explanation(str(body.article_id))
        return _stream(await start_answer(prepared))

    @app.post("/comparisons")
    async def comparisons(body: ComparisonBody, request: Request) -> StreamingResponse:
        require_bearer(request)
        prepared = await load_comparison(body.story_id)
        return _stream(await start_answer(prepared))

    @app.post("/search")
    async def search(body: SearchBody, request: Request) -> StreamingResponse:
        require_bearer(request)
        prepared = await load_search(body.query)
        return _stream(await start_answer(prepared))


def require_bearer(request: Request) -> None:
    header = request.headers.get("authorization", "")
    expected = f"Bearer {get_config().inference_secret}"
    if len(header) != len(expected) or not hmac.compare_digest(header, expected):
        raise UnauthorizedError


def report_failure(error: BaseException, request: Request, status: int) -> None:
    message = "Request failed" if status >= _SERVER_FAILURE else "Request rejected"
    line = json.dumps(
        {
            "message": message,
            "route": request.url.path,
            "method": request.method,
            "requestId": getattr(request.state, "request_id", ""),
            "status": status,
        }
    )
    if status >= _SERVER_FAILURE:
        logger.error(line)
        sentry_sdk.capture_exception(error)
        return
    logger.warning(line)


def _details(exc: RequestValidationError) -> list[dict[str, str]]:
    details: list[dict[str, str]] = []
    for error in exc.errors():
        parts = [str(part) for part in error["loc"] if part != "body"]
        details.append({"path": ".".join(parts), "message": str(error["msg"])})
    return details


def _stream(iterator: AsyncIterator[bytes]) -> StreamingResponse:
    return StreamingResponse(
        iterator,
        media_type="text/event-stream",
        headers={"cache-control": "no-cache"},
    )


app = create_app()
