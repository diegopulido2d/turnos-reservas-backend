import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const servicesPath = join(__dirname, "../data/services.json");

class ServiceManager {
  constructor() {
    this.services = [];
    this.nextId = 1;
  }

  // Cargar servicios desde el archivo JSON
  async loadServices() {
    try {
      const data = await fs.readFile(servicesPath, "utf-8");
      this.services = JSON.parse(data);
      // Calcular el próximo ID disponible
      if (this.services.length > 0) {
        const maxId = Math.max(...this.services.map((s) => s.id));
        this.nextId = maxId + 1;
      }
      return this.services;
    } catch (error) {
      if (error.code === "ENOENT") {
        this.services = [];
        await this.saveServices();
        return this.services;
      }
      throw error;
    }
  }

  // Guardar servicios en el archivo JSON
  async saveServices() {
    const data = JSON.stringify(this.services, null, 2);
    await fs.writeFile(servicesPath, data, "utf-8");
  }

  // ✅ Obtener todos los servicios (excluye eliminados)
  getServices() {
    return this.services.filter((s) => !s.deleted);
  }

  // ✅ Obtener servicio por ID (excluye eliminados)
  getServiceById(id) {
    const service = this.services.find((s) => s.id === id && !s.deleted);
    return service || null;
  }

  // Agregar un nuevo servicio
  async addService(serviceData) {
    const requiredFields = [
      "name",
      "description",
      "duration",
      "price",
      "category",
      "available",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        serviceData[field] === undefined ||
        serviceData[field] === null ||
        serviceData[field] === "",
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
      };
    }

    if (typeof serviceData.name !== "string") {
      return { success: false, error: "name debe ser un texto" };
    }
    if (typeof serviceData.description !== "string") {
      return { success: false, error: "description debe ser un texto" };
    }
    if (typeof serviceData.duration !== "number" || serviceData.duration <= 0) {
      return { success: false, error: "duration debe ser un número positivo" };
    }
    if (typeof serviceData.price !== "number" || serviceData.price < 0) {
      return { success: false, error: "price debe ser un número no negativo" };
    }
    if (typeof serviceData.category !== "string") {
      return { success: false, error: "category debe ser un texto" };
    }
    if (typeof serviceData.available !== "boolean") {
      return {
        success: false,
        error: "available debe ser un booleano (true/false)",
      };
    }

    const newService = {
      id: this.nextId++,
      name: serviceData.name,
      description: serviceData.description,
      duration: serviceData.duration,
      price: serviceData.price,
      category: serviceData.category,
      available: serviceData.available,
      deleted: false, // 👈 Inicializar como no eliminado
      deletedAt: null,
    };

    this.services.push(newService);
    await this.saveServices();

    return {
      success: true,
      service: newService,
    };
  }

  // Actualizar un servicio existente
  async updateService(id, updatedData) {
    // ✅ Solo buscar en servicios no eliminados
    const index = this.services.findIndex((s) => s.id === id && !s.deleted);
    if (index === -1) {
      return {
        success: false,
        error: `Servicio con ID ${id} no encontrado`,
      };
    }

    if (updatedData.id !== undefined && updatedData.id !== id) {
      return {
        success: false,
        error: "No está permitido modificar el ID del servicio",
      };
    }

    // ✅ No permitir modificar campos de sistema
    if (
      updatedData.deleted !== undefined ||
      updatedData.deletedAt !== undefined
    ) {
      return {
        success: false,
        error: "No está permitido modificar campos de sistema",
      };
    }

    const validFields = [
      "name",
      "description",
      "duration",
      "price",
      "category",
      "available",
    ];
    const invalidFields = Object.keys(updatedData).filter(
      (key) => !validFields.includes(key) && key !== "id",
    );

    if (invalidFields.length > 0) {
      return {
        success: false,
        error: `Campos inválidos: ${invalidFields.join(", ")}`,
      };
    }

    if (
      updatedData.name !== undefined &&
      typeof updatedData.name !== "string"
    ) {
      return { success: false, error: "name debe ser un texto" };
    }
    if (
      updatedData.description !== undefined &&
      typeof updatedData.description !== "string"
    ) {
      return { success: false, error: "description debe ser un texto" };
    }
    if (
      updatedData.duration !== undefined &&
      (typeof updatedData.duration !== "number" || updatedData.duration <= 0)
    ) {
      return { success: false, error: "duration debe ser un número positivo" };
    }
    if (
      updatedData.price !== undefined &&
      (typeof updatedData.price !== "number" || updatedData.price < 0)
    ) {
      return { success: false, error: "price debe ser un número no negativo" };
    }
    if (
      updatedData.category !== undefined &&
      typeof updatedData.category !== "string"
    ) {
      return { success: false, error: "category debe ser un texto" };
    }
    if (
      updatedData.available !== undefined &&
      typeof updatedData.available !== "boolean"
    ) {
      return {
        success: false,
        error: "available debe ser un booleano (true/false)",
      };
    }

    const updatedService = {
      ...this.services[index],
      ...updatedData,
      id: this.services[index].id,
      deleted: this.services[index].deleted,
      deletedAt: this.services[index].deletedAt,
    };

    this.services[index] = updatedService;
    await this.saveServices();

    return {
      success: true,
      service: updatedService,
    };
  }

  // ✅ Soft delete - Marcar como eliminado
  async deleteService(id) {
    const index = this.services.findIndex((s) => s.id === id && !s.deleted);
    if (index === -1) {
      return {
        success: false,
        error: `Servicio con ID ${id} no encontrado`,
      };
    }

    this.services[index].deleted = true;
    this.services[index].deletedAt = new Date().toISOString();
    this.services[index].available = false;

    await this.saveServices();

    return {
      success: true,
      service: this.services[index],
    };
  }
}

export default ServiceManager;
