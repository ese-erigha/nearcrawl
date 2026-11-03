import os

import pytest

from src.config import ConfigError, load_config


def test_when_the_database_url_uses_the_pooler_host_then_startup_fails() -> None:
    env = dict(os.environ)
    env["DATABASE_URL"] = "postgres://user:pass@ep-example-pooler.neon.tech/nearcrawl"
    with pytest.raises(ConfigError, match="direct host"):
        load_config(env)
