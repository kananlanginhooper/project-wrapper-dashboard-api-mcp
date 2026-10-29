"""Settings: the only place the environment (.env) is read. Nothing about a host, port or scheme is hard-coded."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    public_url: str = "http://localhost:8097"
    ui_base_path: str = "/"
    frame_ancestors: str = ""  # origins allowed to frame the wrapper itself (space or comma separated)
    ui_dir: str = "/app/ui"

    # tab list: the Postgres table when db_host is set, otherwise this JSON file
    tabs_file: str = "/config/tabs.json"
    tabs_env: str = "default"  # which URL each tab gets: laptop, server, ...
    db_host: str = ""
    db_port: int = 5432
    db_name: str = "home_dashboards"
    db_user: str = "home_dashboards"
    db_password: str = ""

    login: str = "off"
    oidc_issuer: str = ""
    oidc_client_id: str = ""

    @property
    def base_path(self) -> str:
        """'/' or '/prefix/'."""
        p = self.ui_base_path.strip("/")
        return f"/{p}/" if p else "/"

    @property
    def frame_ancestor_list(self) -> list[str]:
        return self.frame_ancestors.replace(",", " ").split()

    @property
    def login_enabled(self) -> bool:
        return self.login.lower() in ("on", "1", "true", "yes")

    @property
    def use_db(self) -> bool:
        return bool(self.db_host)


@lru_cache
def get_settings() -> Settings:
    return Settings()
