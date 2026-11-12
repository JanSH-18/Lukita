const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.js');
const app = express();
const port = process.env.PORT || 3000;

app.use("api-docs", swaggerUi.serve, swaggerUi.setup(openapi));
//req(request) res(response) 
app.get('/api/saludo', (req, res) => {
  res.json({ message: 'Hola desde mi API' });
});

app.listen(port, () => console.log("API Lista"));
