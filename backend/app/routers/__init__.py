from .auth import router as auth_router
from .tags import router as tags_router
from .recipes import router as recipes_router
from .rules import router as rules_router
from .plans import router as plans_router

__all__ = ["auth_router", "tags_router", "recipes_router", "rules_router", "plans_router"]
