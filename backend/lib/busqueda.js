import { supabase } from '../supabaseClient.js';

class Busqueda {
  // Busca balnearios según el nombre de la ciudad
  async buscarBalneariosPorCiudad(nombreCiudad) {
    // Obtiene la ciudad por nombre
    const { data: ciudad, error: errorCiudad } = await supabase
      .from('ciudades')
      .select('id_ciudad')
      .ilike('nombre', nombreCiudad); // ilike para que no sea case sensitive

    if (errorCiudad) throw errorCiudad;
    if (!ciudad || ciudad.length === 0) return [];

    const idCiudad = ciudad[0].id_ciudad;

    // Busca balnearios con ese id_ciudad
    const { data: balnearios, error: errorBalnearios } = await supabase
      .from('balnearios')
      .select('id_balneario, nombre, direccion, telefono, imagen, id_ciudad')
      .eq('id_ciudad', idCiudad);

    if (errorBalnearios) throw errorBalnearios;
    return balnearios || [];
  }

  // Lista todos los balnearios y la ciudad a la que pertenecen
  async listarBalneariosConCiudades() {
    // Trae todos los balnearios con la info de ciudad usando join
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

    // Opcional: formatea el resultado para que sea más legible
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
}

export { Busqueda };