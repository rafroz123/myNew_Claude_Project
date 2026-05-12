import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_home_status(client):
    assert client.get("/").status_code == 200


def test_meditation_status(client):
    assert client.get("/meditation").status_code == 200


def test_home_content(client):
    html = client.get("/").data.decode()
    assert "Hello Ronova" in html
    assert "Start Meditation" in html


def test_meditation_content(client):
    html = client.get("/meditation").data.decode()
    assert "Breathing Exercise" in html
    assert "Box Breathing" in html


def test_unknown_route_returns_404(client):
    assert client.get("/nonexistent").status_code == 404
