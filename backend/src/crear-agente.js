import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Busqueda } from "../lib/busqueda.js";

const busqueda = new Busqueda();

const systemPrompt = `
Sos un asistente para consultar información sobre balnearios y ciudades.
Tu tarea es ayudar a consultar o mostrar datos de balnearios y la ciudad donde se encuentran.

Usá las herramientas disponibles para:
- Buscar balnearios por ciudad
- Mostrar la lista completa de balnearios con su ciudad

Respondé de forma clara y breve.
`.trim();

const ollamaLLM = new Ollama({
    model: "qwen3:1.7b",
    temperature: 0.75,
    timeout: 2 * 60 * 1000,
});

const buscarBalneariosPorCiudadTool = tool({
    name: "buscarBalneariosPorCiudad",
    description: "Usa esta función para encontrar balnearios en una ciudad específica",
    parameters: z.object({
      ciudad: z.string().describe("El nombre de la ciudad a buscar"),
    }),
    // Es async porque consulta Supabase
    execute: async ({ ciudad }) => {
      try {
        const balnearios = await busqueda.buscarBalneariosPorCiudad(ciudad);
        if (!balnearios || balnearios.length === 0) return "No se encontraron balnearios en esa ciudad.";
        return balnearios.map(bal => 
          `Balneario: ${bal.nombre}, Dirección: ${bal.direccion}, Teléfono: ${bal.telefono || "No informado"}`
        ).join('\n');
      } catch (error) {
        return `Error al buscar balnearios: ${error.message}`;
      }
    },
});

const listarBalneariosTool = tool({
    name: "listarBalnearios",
    description: "Muestra todos los balnearios y la ciudad donde se encuentran",
    parameters: z.object({}),
    execute: async () => {
      try {
        const lista = await busqueda.listarBalneariosConCiudades();
        if (!lista || lista.length === 0) return "No hay balnearios registrados.";
        return lista.map(bal => 
          `Balneario: ${bal.nombre}, Ciudad: ${bal.ciudad}, Dirección: ${bal.direccion}, Teléfono: ${bal.telefono || "No informado"}`
        ).join('\n');
      } catch (error) {
        return `Error al listar balnearios: ${error.message}`;
      }
    },
});

// SOLO exportá la función, no crees ni ejecutes el agente acá
export function crearAgenteBalnearios({ verbose = true } = {}) {
    return agent({
        tools: [buscarBalneariosPorCiudadTool, listarBalneariosTool],
        llm: ollamaLLM,
        verbose,
        systemPrompt,
    });
}