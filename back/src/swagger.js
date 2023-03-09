import swaggerAutogen from 'swagger-autogen'

const outputFile = '../swagger_output.json'
const endpointsFiles = ['./src/api/about.js', './src/api/auth.js', './src/api/oauth.js', './src/api/me.js', './src/api/actions.js', './src/index.js']

swaggerAutogen(outputFile, endpointsFiles)