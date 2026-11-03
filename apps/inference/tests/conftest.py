import os

os.environ.update(
    {
        "DATABASE_URL": "postgres://user:pass@localhost/nearcrawl",
        "SENTRY_DSN": "https://local@sentry.test/1",
        "SENTRY_ENVIRONMENT": "test",
        "FEED_RETENTION_DAYS": "14",
        "BRIEF_ARTICLE_CAP": "12",
        "BRIEF_BODY_CHARS": "2000",
        "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
        "OPENROUTER_MODEL": "openai/gpt-4.1-mini",
        "OPENROUTER_API_KEY": "test-openrouter",
        "INFERENCE_SECRET": "test-inference-secret",
        "GEOAPIFY_BASE_URL": "https://api.geoapify.com/v1/geocode/search",
        "GEOAPIFY_API_KEY": "test-geoapify",
    }
)
