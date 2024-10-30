const http = require('http');
const fs = require('fs').promises;
const superagent = require('superagent');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'address of the server')
  .requiredOption('-p, --port <port>', 'port of the server')
  .requiredOption('-c, --cache <path>', 'path to the cache directory');

program.parse();

const { host, port, cache } = program.opts();

const server = http.createServer(async function (req, res) {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Якщо запит на /favicon.ico, повертаємо порожній контент або власну іконку
  if (req.url === '/favicon.ico') {
    try {
      const favicon = await fs.readFile('./favicon.ico');  // Читаємо власний favicon.ico, якщо він є
      res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      res.end(favicon);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
    return;
  }

  const statusCode = req.url.slice(1);

  // Відфільтруємо некоректні статус-коди
  if (isNaN(statusCode)) {
    console.log(`Invalid status code: ${statusCode}`);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid status code');
    return;
  }

  const filePath = `${cache}/${statusCode}.jpg`;

  if (req.method === 'GET') {
    console.log(`Processing GET request for status code: ${statusCode}`);
    try {
      const image = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(image);
    } catch (err) {
      console.log(`Image not found in cache, fetching from http.cat`);
      try {
        const response = await superagent.get(`https://http.cat/${statusCode}`);
        const image = response.body;
        await fs.writeFile(filePath, image);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(image);
      } catch (err) {
        console.log(`Failed to fetch from http.cat: ${err}`);
        try {
          const image404 = await fs.readFile(`${cache}/404.jpg`);
          res.writeHead(404, { 'Content-Type': 'image/jpeg' });
          res.end(image404);
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 image not found');
        }
      }
    }
  } else if (req.method === 'PUT') {
    console.log(`Processing PUT request for status code: ${statusCode}`);
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
      body = Buffer.concat(body);
      try {
        await fs.writeFile(filePath, body);
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end('Image saved');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error saving image');
      }
    });
  } else if (req.method === 'DELETE') {
    console.log(`Processing DELETE request for status code: ${statusCode}`);
    try {
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Image deleted');
    } catch (err) {
      try {
        const image404 = await fs.readFile(`${cache}/404.jpg`);
        res.writeHead(404, { 'Content-Type': 'image/jpeg' });
        res.end(image404);
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 image not found');
      }
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
