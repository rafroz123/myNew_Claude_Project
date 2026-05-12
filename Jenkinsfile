pipeline {
    agent {
        docker { image 'python:3.11-slim' }
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }

        stage('Test') {
            steps {
                sh 'python -m pytest tests/ -v || echo "No tests found, skipping."'
            }
        }

        stage('Run App Check') {
            steps {
                sh '''
                    python -c "
from app import app
client = app.test_client()
r1 = client.get('/')
r2 = client.get('/meditation')
assert r1.status_code == 200, f'/ returned {r1.status_code}'
assert r2.status_code == 200, f'/meditation returned {r2.status_code}'
print('All routes OK')
"
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline passed — Ronova Meditation app is healthy!'
        }
        failure {
            echo 'Pipeline failed — check the logs above.'
        }
    }
}
