module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API para saludar y conocer datos del estudiante', 
  },
  paths: {
    "/api/saludo": {
      get: {
        summary: 'Devuelve un saludo',
        responses: {
          200: {
            description: 'Saludo devuelto correctamente',
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
    },
    "/api/yo": {
      get: {
        summary: 'Devuelve tu nombre y carrera (Nivel 1)',
        responses: {
          200: {
            description: 'Datos personales devueltos con éxito',
            content: {
              "application/json": {
                example: {
                  nombre: "David Leonardo Sangama Saenz",
                  carrera: "Ingeniería de Software con Inteligencia Artificial"
                }
              }
            }
          }
        }
      }
    },
    "/api/edad/{anio}": {
      get: {
        summary: 'Calcula tu edad según el año de nacimiento (Nivel 2)',
        parameters: [
          {
            name: 'anio',
            in: 'path',
            required: true,
            description: 'Año de nacimiento para calcular la edad',
            schema: {
              type: 'integer'
            },
            example: 2007
          }
        ],
        responses: {
          200: {
            description: 'Edad calculada correctamente',
            content: {
              "application/json": {
                example: {
                  anioNacimiento: 2007,
                  edadCalculada: 19
                }
              }
            }
          },
          400: {
            description: 'Error si el año no es válido'
          }
        }
      }
    }
  }
};