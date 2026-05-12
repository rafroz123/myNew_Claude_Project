import pytest
import threading
from app import app as flask_app


@pytest.fixture(scope="session", autouse=True)
def start_server():
    """Start the Flask dev server once for all E2E tests."""
    server = threading.Thread(
        target=lambda: flask_app.run(port=5000, use_reloader=False)
    )
    server.daemon = True
    server.start()


BASE_URL = "http://127.0.0.1:5000"


def test_home_page_loads(page):
    page.goto(BASE_URL)
    assert page.title() == "Hello Ronova"


def test_home_page_has_heading(page):
    page.goto(BASE_URL)
    heading = page.locator("h1")
    assert heading.inner_text() == "Hello Ronova"


def test_home_page_has_start_button(page):
    page.goto(BASE_URL)
    btn = page.locator("a.btn")
    assert btn.is_visible()
    assert "Start Meditation" in btn.inner_text()


def test_navigate_to_meditation(page):
    page.goto(BASE_URL)
    page.click("a.btn")
    assert page.url == f"{BASE_URL}/meditation"
    assert page.title() == "Meditation & Breathing"


def test_meditation_has_start_button(page):
    page.goto(f"{BASE_URL}/meditation")
    btn = page.locator("#startBtn")
    assert btn.is_visible()
    assert btn.inner_text() == "Start"


def test_meditation_start_button_shows_stop(page):
    page.goto(f"{BASE_URL}/meditation")
    page.click("#startBtn")
    stop_btn = page.locator("#stopBtn")
    assert stop_btn.is_visible()


def test_back_link_returns_home(page):
    page.goto(f"{BASE_URL}/meditation")
    page.click("a.back-link")
    assert page.url == f"{BASE_URL}/"
