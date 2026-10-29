from typing import Literal

from pydantic import BaseModel, Field

TAB_ID = r"^[a-z0-9][a-z0-9-]{0,39}$"


class Tab(BaseModel):
    """One dashboard tab: a standalone app shown in an iframe."""

    id: str = Field(pattern=TAB_ID, description="URL path segment: /<id>")
    title: str = Field(min_length=1)
    url: str = Field(description="The app's own address for this environment, loaded in the iframe")
    order: int = 1000
    description: str = ""


class TabList(BaseModel):
    tabs: list[Tab]
    problems: list[str] = Field(default_factory=list, description="Rows that were skipped, and why")
    source: Literal["db", "file", "demo"]
