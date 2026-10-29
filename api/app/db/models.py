"""The tab table. One database serves every environment (laptop dev and the server read the same rows), but an app's
address differs per environment, so URLs live in tab_url keyed by env ("laptop", "server", ...), with "default" as
the fallback for a tab that has the same address everywhere."""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TabRow(Base):
    __tablename__ = "tab"
    __table_args__ = (
        CheckConstraint("id ~ '^[a-z0-9][a-z0-9-]{0,39}$'", name="tab_id_check"),
        CheckConstraint("title <> ''", name="tab_title_check"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=1000, server_default="1000")
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    urls: Mapped[list["TabUrlRow"]] = relationship(back_populates="tab", cascade="all, delete-orphan", lazy="selectin")


class TabUrlRow(Base):
    __tablename__ = "tab_url"
    __table_args__ = (CheckConstraint("url ~ '^https?://[^/]+'", name="tab_url_url_check"),)

    tab_id: Mapped[str] = mapped_column(
        Text, ForeignKey("tab.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True
    )
    env: Mapped[str] = mapped_column(Text, primary_key=True, default="default", server_default="default")
    url: Mapped[str] = mapped_column(Text)

    tab: Mapped[TabRow] = relationship(back_populates="urls")
