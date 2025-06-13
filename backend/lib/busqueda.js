import { supabase } from '../supabaseClient.js';

class Busqueda {
  // Busca balnearios según el nombre de la ciudad (búsqueda parcial, case insensitive)
  async buscarBalneariosPorCiudad(nombreCiudad) {
    // Agregar % para búsqueda parcial (contains)
    const { data: ciudades, error: errorCiudad } = await supabase
      .from('ciudades')
      .select('id_ciudad')
      .ilike('nombre', `%${nombreCiudad}%`);

    if (errorCiudad) throw errorCiudad;
    if (!ciudades || ciudades.length === 0) return [];

    // Tomamos la primera ciudad que coincida
    const idCiudad = ciudades[0].id_ciudad;

    // Busca balnearios con ese id_ciudad
    const { data: balnearios, error: errorBalnearios } = await supabase
      .from('balnearios')
      .select('id_balneario, nombre, direccion, telefono, imagen, id_ciudad')
      .eq('id_ciudad', idCiudad);

    if (errorBalnearios) throw errorBalnearios;
    return balnearios || [];
  }

  // Lista todos los balnearios con info de ciudad
  async listarBalneariosConCiudades() {
    const { data, error } = await supabase
      .from('balnearios')
      .select(`
        id_balneario,
        nombre,
        direccion,
        telefono,
        imagen,
        id_ciudad,
        ciudades (
          id_ciudad,
          nombre,
          img
        )
      `);

    if (error) throw error;

    return (data || []).map(balneario => ({
      id_balneario: balneario.id_balneario,
      nombre: balneario.nombre,
      direccion: balneario.direccion,
      telefono: balneario.telefono,
      imagen: balneario.imagen,
      ciudad: balneario.ciudades ? balneario.ciudades.nombre : null,
      ciudad_img: balneario.ciudades ? balneario.ciudades.img : null,
    }));
  }

  // Nueva función: lista todas las ciudades
  async listarCiudades() {
    const { data, error } = await supabase
      .from('ciudades')
      .select('id_ciudad, nombre, img');

    if (error) throw error;
    return data || [];
  }
}

export { Busqueda };
