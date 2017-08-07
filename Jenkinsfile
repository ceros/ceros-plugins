pipeline {
    agent {
        label 'jenkins-ecs-slave'
    }
    parameters {
        string(defaultValue: "feature/jenkins-server", description: 'Branch to deploy', name: 'BRANCH')
    }
    stages {
       stage('Checkout Git on Branch Parameter') {
          steps {
              script {
                  def CONFIG_FILE="dev-plugins"
                  withCredentials([file(credentialsId: CONFIG_FILE, variable: 'FILE')]) {
                    sh 'cp $FILE file'
                    def props = readProperties file: 'file'
                    sh 'rm file'
                    env.AWS_ACCESS_KEY=props.AWS_ACCESS_KEY
                    env.AWS_SECRET_KEY=props.AWS_SECRET_KEY
                    env.AWS_REGION=props.AWS_REGION
                    env.AWS_S3_BUCKET=props.AWS_S3_BUCKET
                    env.DEV_AWS_ACCESS_KEY=props.DEV_AWS_ACCESS_KEY
                    env.DEV_AWS_SECRET_KEY=props.DEV_AWS_SECRET_KEY
                    env.DEV_AWS_S3_BUCKET=props.DEV_AWS_S3_BUCKET
                    env.FASTLY_KEY=props.FASTLY_KEY
                    env.FASTLY_HOST=props.FASTLY_HOST
                    env.DEV_FASTLY_HOST=props.DEV_FASTLY_HOST
                  }        
                  slackSend (color: '#FFFF00', message: "STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
	              dir('branch') {
	                   git([url: env.GITURL, branch: params.BRANCH, credentialsId: env.CREDENTIALS])
	              }
              }
           }      
       }
       stage('Build Ceros Plugin'){
          steps {
                 script {
                    sh 'docker build -t ceros-plugins -f branch/Dockerfile branch'  
                 }
          } 
       }
       stage('Build and Deploy plugins'){
          steps {
                 script {
                     docker.image('ceros-plugins').inside {
                        sh 'npm install -g grunt-cli'
                        dir('ceros-plugin') {
                           sh 'npm install'
                           sh 'grunt'
                           sh 'grunt dev-release --aws.accessKey=$DEV_AWS_ACCESS_KEY --aws.secretKey=$DEV_AWS_SECRET_KEY --aws.region=$AWS_REGION --fastly.key=$FASTLY_KEY --fastly.host=$DEV_FASTLY_HOST --aws.s3Bucket=$DEV_AWS_S3_BUCKET --branch=$CI_BRANCH'branch
                     }
                 }
              }
          }
      }
      }
      post {
        success {
            slackSend (color: '#00FF00', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
        }
        unstable { 
            slackSend (color: '#FF0000', message: "UNSTABLE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
        }
        failure { 
            slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
        }
      }
}