module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API para saludar', 
  },
  paths: {
    "/api/saludo": {
      get: {
        summary: 'Devuelve un saludo',
        responses: {
          200: {
            description: 'Saludo de vuelta correctamente',
            content: {
              "application/json": {
                example: {
                  message: 'Hola desde mi API'
                }
              }
            }
          }
        }
      }
    }
  }
};