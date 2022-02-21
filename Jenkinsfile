pipeline {
    agent {
        docker {
            image 'debian'
        }
    }
    stages {
        stage('test') {
            steps {
                  sh 'echo "Hello World"'
                }
            }
        }
    }
}
