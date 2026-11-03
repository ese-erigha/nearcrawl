import os
from collections.abc import Mapping
from dataclasses import dataclass
from urllib.parse import urlparse


class ConfigError(Exception):
    pass


@dataclass(frozen=True)
class Config:
    database_url: str
    sentry_dsn: str
    sentry_environment: str
    feed_retention_days: int
    brief_article_cap: int
    brief_body_chars: int
    openrouter_base_url: str
    openrouter_api_key: str
    openrouter_model: str
    inference_secret: str
    geoapify_base_url: str
    geoapify_api_key: str


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = load_config(os.environ)
    return _config


def load_config(env: Mapping[str, str]) -> Config:
    database_url = _required(env, "DATABASE_URL")
    _reject_pooler(database_url)
    return Config(
        database_url=database_url,
        sentry_dsn=_required(env, "SENTRY_DSN"),
        sentry_environment=_required(env, "SENTRY_ENVIRONMENT"),
        feed_retention_days=_positive_int(env, "FEED_RETENTION_DAYS"),
        brief_article_cap=_positive_int(env, "BRIEF_ARTICLE_CAP"),
        brief_body_chars=_positive_int(env, "BRIEF_BODY_CHARS"),
        openrouter_base_url=_required(env, "OPENROUTER_BASE_URL").rstrip("/"),
        openrouter_api_key=_required(env, "OPENROUTER_API_KEY"),
        openrouter_model=_required(env, "OPENROUTER_MODEL"),
        inference_secret=_required(env, "INFERENCE_SECRET"),
        geoapify_base_url=_required(env, "GEOAPIFY_BASE_URL"),
        geoapify_api_key=_required(env, "GEOAPIFY_API_KEY"),
    )


def _reject_pooler(database_url: str) -> None:
    host = urlparse(database_url).hostname or ""
    if "-pooler" in host:
        raise ConfigError("DATABASE_URL uses the direct host")


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if value == "":
        raise ConfigError(f"{name} is required")
    return value


def _positive_int(env: Mapping[str, str], name: str) -> int:
    raw = _required(env, name)
    if not raw.isdigit() or raw.startswith("0"):
        raise ConfigError(f"{name} must be a positive integer")
    return int(raw)
