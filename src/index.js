// Estos modulos los instalamos por aparte
require('dotenv').config()
const express = require('express');
const mysql = require('promise-mysql'); // Modulo necesario para la conexion a la base de datos
const fs = require('fs');

// INICIAMOS LA API
const app = express(); // Creamos una instancia de express para manejar nuestra API
// IMPORTANTE! Le decimos a express que necesitamos trabajar con intercambio de datos JSON
app.use(express.json({extended: true}));

// Establecer Content-Type para todas las respuestas para estas rutas. 
app.use((req, res, next) => {
  res.set('Content-Type', 'application/json');
  next();
});

// Declaramos una variable global que tendra nuestro pool de conexion.
let pool;

// Iniciar conexion a sql cloud con tcp y sslcert
const createTcpPoolSslCerts = async config => {
  // Se establece la conexion
  return mysql.createPool({ 
    user: process.env.DB_USER, // 'db-user'
    password: process.env.DB_PASS, // 'db-password'
    database: process.env.DB_NAME, // 'database'
    host: process.env.DB_IP, // 'ip'
    port: process.env.DB_PORT, // 'port'
    ssl: {
      sslmode: 'verify-full',
      ca: fs.readFileSync(process.env.DB_ROOT_CERT), // '/path/server-ca.pem'
      key: fs.readFileSync(process.env.DB_KEY), // '/path/client-key.pem'
      cert: fs.readFileSync(process.env.DB_CERT), // '/path/client-cert.pem'
    },
    // ... Especificar propiedades adicionales
    ...config,
  });
};

const createPool = async () => {
  const config = {
    // Indicamos el maximo numero de conexiones permitidas al pool.
    connectionLimit: 5,
    // Indicamos el numero maximo de milisegundos antes del tiempo de espera
    // Ocurre durante la conexion inicial a la base de datos
    connectTimeout: 10000, // 10 seconds
    // Indicamos el numero maximo de milisegundos que se debe esperar para comprobar 
    // la conexion antes de un error por tiempo de espera
    acquireTimeout: 10000, // 10 seconds
    // Se determina la accion del pool de conexion cuando no hay conexiones existentes
    waitForConnections: true, // Default: true
    // Indicamos el numero maximo de solicitudes de conexion al pool. Si es 0, no hay limite
    queueLimit: 0, // Default: 0
  };
  return createTcpPoolSslCerts(config);
};

// Unico método para devolver un estado HTTP random
app.get('/admin/:cui', async (req, res) => {
  pool = pool || (await createPool());
  try {
    // Primera forma de realizar una consulta
    const recentAdministrators = pool.query(
      'SELECT * FROM administrador ORDER BY cui LIMIT 5' // <--- Insertar consulta
    );

    // Segunda forma de realizar una consulta
    const stmt = 'SELECT COUNT(*) as count FROM administrador WHERE cui = ?'; // <--- Insertar consulta
    // Ejecutamos la consulta enviando un parametro
    const adminQuery = pool.query(stmt, [req.params.cui]); 

    // Ejecutamos las consultas concurrentemente y esperamos a que se completen
    // Esto es mas rapido que esperar cada objeto
    const recentAdministrator = await recentAdministrators;
    const [admin] = await adminQuery;

    res.status(200).json({
      "administradores":recentAdministrator,
      "admin": admin.count
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        "response":'No se pudo cargar la página. Consulte las consolas de la aplicación para obtener más detalles.'
      });
  }
});

// Endpoint para insertar admin
app.post('/admin', async (req, res) => {
  const newAdmin = req.body; // Obtenemos el json del cuerpo de la peticion

  pool = pool || (await createPool());
  // Iniciamos la conexion
  try {
      const stmt = 'INSERT INTO administrador (cui, nombre, apellido, email, passwd) VALUES (?, ?, ?, ?, ?)';
      // pool.query comprueba, utiliza y libera automaticamente una conexion del pool
      // asegurandose que siempre se devuelva correctamente
      await pool.query(stmt, 
                        [newAdmin.cui, newAdmin.nombre, 
                          newAdmin.apellido, newAdmin.email, 
                          newAdmin.passwd]); // Se envia como parametros los datos contenidos en el json 
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        "response":'¡Ha ocurrido un error! Consulte las consolas de la aplicación para obtener más detalles.'
      });
  }

  res.status(200).json({"response":`Insertado correctamente ${newAdmin}`});
});

const PORT = process.env.PORT || 3000;
// Levantamos el servidor y lo exponemos en el puerto 3000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

process.on('unhandledRejection', err => {
  console.error(err);
  throw err;
});
