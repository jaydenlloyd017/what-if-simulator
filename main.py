import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()
import simulator  # noqa: E402  (after load_dotenv)
from models import SimRequest, BranchRequest  # noqa: E402

BASE = Path(__file__).parent
app = FastAPI(title="What If?")

@app.exception_handler(simulator.SimError)
async def sim_error(_: Request, e: simulator.SimError):
    return JSONResponse({"error": e.msg}, status_code=e.status)

@app.exception_handler(RequestValidationError)
async def bad_input(_: Request, e: RequestValidationError):
    return JSONResponse({"error": "Please enter a scenario between 10 and 500 characters."}, status_code=400)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/demo")
async def demo():
    return json.loads((BASE / "fallback.json").read_text(encoding="utf-8"))

@app.post("/api/simulate")
async def simulate(req: SimRequest):
    return await simulator.simulate(req)

@app.post("/api/branch")
async def branch(req: BranchRequest):
    return await simulator.branch(req)

app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="static")
