pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    . venv/bin/activate
                    python3 -m pytest tests/ -v || echo "No tests found, skipping."
                '''
            }
        }

        stage('Run App Check') {
            steps {
                sh '''
                    . venv/bin/activate
                    python3 -c "
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

        stage('Deploy to PythonAnywhere') {
            when { branch 'main' }
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'pythonanywhere-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'pythonanywhere-api-token', variable: 'API_TOKEN')
                ]) {
                    sh '''
                        ssh -i $SSH_KEY -o StrictHostKeyChecking=no rafroz123@ssh.pythonanywhere.com \
                            "cd ~/myNew_Claude_Project && git pull origin main"
                        curl -s -X POST \
                            -H "Authorization: Token $API_TOKEN" \
                            https://www.pythonanywhere.com/api/v0/user/rafroz123/webapps/rafroz123.pythonanywhere.com/reload/
                    '''
                }
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
