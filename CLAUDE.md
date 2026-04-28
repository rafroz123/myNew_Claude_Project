# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Python (Flask) + HTML/CSS/JS

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run the dev server (http://127.0.0.1:5000)
python app.py
```

## Architecture

- `app.py` — Flask app entry point; define routes here
- `templates/` — Jinja2 HTML templates rendered by Flask via `render_template()`
- `static/css/` — Stylesheets linked in templates with `url_for('static', ...)`
- `static/js/` — Client-side JavaScript
- `requirements.txt` — Python dependencies

Routes pass data to templates as keyword arguments to `render_template()`. Templates use `{{ variable }}` for output and `{% %}` for control flow.
