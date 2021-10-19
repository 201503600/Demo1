## Conexión a SQL Cloud desde server Node

Para la conexión a la base de datos SQL Cloud mediante protocolo TCP es recomendable utilizar certificaciones SSL para cifrar los datos enviados y recibidos desde el cliente hacia la instancia y viceversa, de lo contrario cualquiera podría interceptar los datos y obtener información o bien puede conectarse a la base de datos sin mayor dificultad y alterar la información.

Por lo que, para conectar aplicaciones externas a una base de datos de SQL Cloud se debe configurar un [certificado de cliente](https://cloud.google.com/sql/docs/postgres/configure-ssl-instance#client-certs) en la instancia de base de datos. Al finalizar ese procedimiento se debe contar con 3 archivos:

+ server-ca.pem
+ client-cert.pem
+ client-key.pem

Una vez se cuente con estos archivos debe guardarlos dentro de la carpeta llamada certs. Luego ejecute el comando `npm i` para instalar todas las dependencias necesarias.

Antes de probar la conexión a la base de datos es indispensable crear el archivo `.env` el cual contendrá las variables de entorno en el ámbito de la aplicación. Este archivo debe contener lo siguiente

```
DB_ROOT_CERT = certs/server-ca.pem
DB_KEY = certs/client-key.pem
DB_CERT = certs/client-cert.pem
DB_IP = <your_ip>
DB_PORT = <your_port>
DB_USER = <your_user>
DB_PASS = <your_pass>
DB_NAME = <your_db_name>
PORT = <your_app_port>
```

Una vez realizado las configuraciones anteriores ejecute el comando `npm run dev`. Para realizar la petición *POST* debe enviarse el siguiente cuerpo en formato *JSON*

```json
{
	"cui":"your_cui",
	"nombre":"your_first_name",
	"apellido":"your_last_name",
	"email":"your_email",
	"passwd":"your_password"
}
```