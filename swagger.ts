import {definitions} from './swagger-definitions';
import swaggerAutogen from 'swagger-autogen'
const doc = {
  info: {
    title: 'Match Schedule API',
    description: 'Description',
    version: '1.0.0', // Optionally add version
  },
  definitions: definitions,
  basePath: '/api/',
  host: 'localhost:5000',
  schemes: ['http'],
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      in: "header",       // can be "header", "query" or "cookie"
      name: "Authorization",  // name of the header, query parameter or cookie
      description: 'Value: Bearer {jwt}'
    }
  },
  "security": [
    { "Bearer": [] }
  ],

};


const outputFile = './swagger.json';
const endpointsFiles = ['./src/routes/*.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc);

