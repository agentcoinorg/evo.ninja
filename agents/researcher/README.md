# Installation

```bash
poetry install
poetry shell
```

# Run

With Evo:

```bash
poetry run python ./evo_researcher/main.py --prompt="Is nayib bukele going to run for president again?" --agent="evo"
```

With Autonolas:

```bash
poetry run python ./evo_researcher/main.py --prompt="Is nayib bukele going to run for president again?" --agent="autonolas"
```

# Test

## Run all questions

```bash
pytest
```

## Run specific questions

Use `pytest`'s `-k` flag and a string matcher. Example:

```bash
pytest -k "Vladimir"
```
