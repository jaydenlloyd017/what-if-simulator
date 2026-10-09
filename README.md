# What If? — AI Reality Simulator

## Run
```
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
# edit .env and set OPENAI_API_KEY (and optionally OPENAI_MODEL)
uvicorn main:app --reload
```
Open http://127.0.0.1:8000

No API key yet? Click **Load demo scenario** on the error screen (or `/api/demo`) to see the full UI with pre-generated data.

## Demo script (60–90s)
1. "What if we could explore how one change might transform the world?"
2. Enter "What if everyone in the UK received £1 million tomorrow?"
3. Walk through Day 1, Year 1, Year 10.
4. Ask the audience: spend, invest, or release gradually?
5. Click an option, then use the **Compare** tab.
6. Close: results are plausible scenarios from assumptions, not predictions.

## Notes
- The API key stays on the server (`.env` is gitignored).
- Model output is validated against Pydantic schemas; one retry on invalid output.
