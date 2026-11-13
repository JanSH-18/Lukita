const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.js');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de Swagger (con el slash inicial corregido)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));

// req (request) res (response) 
app.get('/api/saludo', (req, res) => {
  res.json({ message: 'Hola desde mi API' });
});

// --- RETO CLASE: Nivel 1 ---
app.get('/api/yo', (req, res) => {
    res.json({
        nombre: "David Leonardo Sangama Saenz",
        carrera: "Ingeniería de Software con Inteligencia Artificial"
    });
});

// --- RETO CLASE: Nivel 2 ---
app.get('/api/edad/:anio', (req, res) => {
    const anioNacimiento = parseInt(req.params.anio);
    const anioActual = new Date().getFullYear();

    if (isNaN(anioNacimiento)) {
        return res.status(400).json({ error: "El año ingresado no es válido." });
    }

    const edad = anioActual - anioNacimiento;
    res.json({
        anioNacimiento: anioNacimiento,
        edadCalculada: edad
    });
});

app.listen(port, () => console.log("API Lista"));