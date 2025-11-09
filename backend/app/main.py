from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import crises, charities

app = FastAPI(title="Global Problems API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crises.router)
app.include_router(charities.router)

@app.get("/health")
def health():
    return {"status": "ok"}