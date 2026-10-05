pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  environment {
    COMPOSE_PROJECT_NAME = 'contact-information-system'
    TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Test') {
      steps {
        sh '''
          docker build --target test -t myapp/service-a:test ./service-a
          docker build --target test -t myapp/service-b:test ./service-b
        '''
      }
    }

    stage('Build Images') {
      steps { sh 'docker compose build' }
    }

    stage('Deploy') {
      steps {
        withCredentials([file(credentialsId: 'myapp-env', variable: 'ENV_FILE')]) {
          sh 'cp "$ENV_FILE" .env'
          sh 'docker compose up -d --no-build --remove-orphans'
        }
      }
    }

    stage('Smoke Test') {
      steps { sh 'sh scripts/smoke-test.sh' }
    }
  }

  post {
    success { echo "Build ${env.BUILD_NUMBER} deployed and passed the smoke test" }
    failure { echo "Build ${env.BUILD_NUMBER} failed" }
    always  { sh 'rm -f .env' }
  }
}
