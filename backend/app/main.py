from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from .routers import auth_router, tags_router, recipes_router, rules_router, plans_router

app = FastAPI(
    title="MealPrepBuddy API",
    description="API for weekly dinner planning with recipe management and calendar export",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(tags_router)
app.include_router(recipes_router)
app.include_router(rules_router)
app.include_router(plans_router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mealprepbuddy-api"}


# Lambda handler
handler = Mangum(app, api_gateway_base_path="/dev/api")
