import "dotenv/config";
import config from "./config/env.config.js";
import http from "http";
import ServiceManager from "./managers/ServiceManager.js";

const serviceManager = new ServiceManager();
await serviceManager.loadServices();

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // GET /services - Obtener todos los servicios (NO eliminados)
  if (req.method === "GET" && path === "/services") {
    const services = serviceManager.getServices();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: services }));
    return;
  }

  // GET /services/:id - Obtener servicio por ID (NO eliminados)
  if (req.method === "GET" && path.startsWith("/services/")) {
    const id = parseInt(path.split("/")[2]);
    if (isNaN(id)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "ID inválido" }));
      return;
    }

    const service = serviceManager.getServiceById(id);
    if (!service) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Servicio con ID ${id} no encontrado`,
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: service }));
    return;
  }

  // POST /services - Agregar nuevo servicio
  if (req.method === "POST" && path === "/services") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const serviceData = JSON.parse(body);
        const result = await serviceManager.addService(serviceData);

        if (!result.success) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: result.error }));
          return;
        }

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: result.service }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "JSON inválido" }));
      }
    });
    return;
  }

  // PUT /services/:id - Actualizar servicio
  if (req.method === "PUT" && path.startsWith("/services/")) {
    const id = parseInt(path.split("/")[2]);
    if (isNaN(id)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "ID inválido" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const updatedData = JSON.parse(body);
        const result = await serviceManager.updateService(id, updatedData);

        if (!result.success) {
          const statusCode = result.error.includes("no encontrado") ? 404 : 400;
          res.writeHead(statusCode, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: result.error }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: result.service }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "JSON inválido" }));
      }
    });
    return;
  }

  // DELETE /services/:id - Soft delete
  if (req.method === "DELETE" && path.startsWith("/services/")) {
    const id = parseInt(path.split("/")[2]);
    if (isNaN(id)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "ID inválido" }));
      return;
    }

    const result = await serviceManager.deleteService(id);
    if (!result.success) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: result.error }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: result.service }));
    return;
  }

  // Ruta no encontrada
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, error: "Ruta no encontrada" }));
});

server.listen(config.port, () => {
  console.log(`🚀 Server is listening on http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`📋 Servicios cargados: ${serviceManager.getServices().length}`);
});
