const http = require('http'); // Підключення модуль для створення HTTP-сервера
const { Command } = require('commander'); // Підключення бібліотеку для роботи з командним рядком
const program = new Command(); // Створення нового об'єкта для командного рядка

// Налаштування параметрів командного рядка 
program
  .requiredOption('-h, --host <type>', 'server host') // Обов'язковий параметр для хоста (адреси сервера)
  .requiredOption('-p, --port <type>', 'server port') // Обов'язковий параметр для порту (на якому працюватиме сервер)
  .requiredOption('-c, --cache <type>', 'cache directory') // Обов'язковий параметр для шляху до кешу
  .parse(process.argv); // Читання параметрів із командного рядка

// Отримання значення параметрів
const { host, port, cache } = program.opts(); // Збереження значення командних параметрів

// Створення HTTP-сервер
const server = http.createServer((req, res) => {
  res.statusCode = 200; // Встановлення код відповіді 200 що є успіхом
  res.setHeader('Content-Type', 'text/plain'); // Встановлення заголовку відповіді як тексту
  res.end('Proxy server is running\n'); // Відповідь клієнту
});

// Запуск сервера і вивід повідомлення, коли він почне працювати
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`); // Де працює сервер
  console.log(`Cache directory is ${cache}`); // Де зберігатимуться кешовані файли
});