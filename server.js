const http = require('http');
const fs = require("fs").promises;
const superagent = require('superagent');
const { program } = require('commander');

// Налаштування командного рядка
program
  .requiredOption('-h, --host <host>', 'address of the server')
  .requiredOption('-p, --port <port>', 'port of the server')
  .requiredOption('-c, --cache <path>', 'path to the cache directory');

program.parse();

const { host, port, cache } = program.opts();

const server = http.createServer(async function (req, res) {
  console.log(`Received request: ${req.method} ${req.url}`);
  const statusCode = req.url.slice(1);
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
        console.log(`Failed to fetch from http.cat, trying to serve 404 image:`);
        try {
          const image404 = await fs.readFile(`${cache}/404.jpg`);
          console.log(`Successfully fetched 404 image from cache`);
          res.writeHead(404, { 'Content-Type': 'image/jpeg' });
          res.end(image404);
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 image not found');
        }
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
