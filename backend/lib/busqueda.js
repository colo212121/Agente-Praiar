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

  // Lista todas las ciudades
  async listarCiudades() {
    const { data, error } = await supabase
      .from('ciudades')
      .select('id_ciudad, nombre, img');

    if (error) throw error;
    return data || [];
  }

  // --- NUEVAS FUNCIONES BASADAS EN server.js ---

  // Obtener el perfil de un usuario por su auth_id
  async obtenerPerfil(auth_id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', auth_id)
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar el perfil de un usuario
  async actualizarPerfil(auth_id, datos) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(datos)
      .eq('auth_id', auth_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Listar los balnearios de un usuario
  async listarMisBalnearios(auth_id) {
    const { data, error } = await supabase
      .from('balnearios')
      .select('*')
      .eq('id_usuario', auth_id);

    if (error) throw error;
    return data || [];
  }

  // Obtener info de un balneario
  async obtenerInfoBalneario(id_balneario) {
    const { data, error } = await supabase
      .from('balnearios')
      .select('*')
      .eq('id_balneario', id_balneario)
      .single();

    if (error) throw error;
    return data;
  }

  // Listar carpas de un balneario
  async listarCarpasDeBalneario(id_balneario) {
    const { data, error } = await supabase
      .from('ubicaciones')
      .select('*')
      .eq('id_balneario', id_balneario);

    if (error) throw error;
    return data || [];
  }

  // Listar elementos de un balneario
  async listarElementosDeBalneario(id_balneario) {
    const { data, error } = await supabase
      .from('elementos_ubicacion')
      .select('*')
      .eq('id_balneario', id_balneario);

    if (error) throw error;
    return data || [];
  }

  // Listar todos los servicios (de todos los balnearios)
  async listarServicios() {
    const { data, error } = await supabase
      .from('servicios')
      .select('id_servicio, nombre, imagen');

    if (error) throw error;
    return data || [];
  }

  // Listar reservas de un balneario (puede filtrar por fechas)
  async listarReservasDeBalneario(id_balneario, fechaInicio = null, fechaFin = null) {
    let query = supabase
      .from('reservas')
      .select('id_ubicacion, fecha_inicio, fecha_salida')
      .eq('id_balneario', id_balneario);

    if (fechaInicio && fechaFin) {
      query = query
        .lte('fecha_inicio', fechaFin)
        .gte('fecha_salida', fechaInicio);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Listar reservas de un usuario (puede filtrar por fechas)
  async listarReservasDeUsuario(auth_id, fechaInicio = null, fechaFin = null) {
    let query = supabase
      .from('reservas')
      .select(`
        *,
        ubicaciones (
          id_carpa,
          posicion
        ),
        balnearios (
          nombre
        )
      `)
      .eq('id_usuario', auth_id);

    if (fechaInicio && fechaFin) {
      query = query
        .lte('fecha_inicio', fechaFin)
        .gte('fecha_salida', fechaInicio);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Obtener información de una ubicación (carpa) y su balneario
  async obtenerInfoUbicacion(id_ubicacion) {
    const { data, error } = await supabase
      .from('ubicaciones')
      .select('*, balnearios: id_balneario (id_balneario, nombre, direccion, id_ciudad)')
      .eq('id_carpa', id_ubicacion)
      .single();

    if (error) throw error;
    return data;
  }

  // NUEVA FUNCIÓN: Filtrar balnearios por servicios
  /**
   * Filtra todos los balnearios que tienen TODOS los servicios especificados (match all).
   * @param {Array<number>} idsServicios - Array de ids de servicios a filtrar.
   * @returns {Promise<Array>} lista de balnearios que cumplen con los servicios
   */
  async filtrarBalneariosPorServicios(idsServicios) {
    if (!Array.isArray(idsServicios) || idsServicios.length === 0) return [];

    // Traer balnearios que tengan todos los servicios indicados
    // Asumiendo tabla balneario_servicio con id_balneario, id_servicio
    // Estrategia: contar cuántos servicios matchea cada balneario
    const { data, error } = await supabase
      .from('balneario_servicio')
      .select('id_balneario')
      .in('id_servicio', idsServicios);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Contar ocurrencias de cada balneario
    const balnearioCount = {};
    data.forEach(row => {
      balnearioCount[row.id_balneario] = (balnearioCount[row.id_balneario] || 0) + 1;
    });

    // Filtrar los balnearios que tengan la cantidad exacta de servicios requeridos
    const balneariosMatch = Object.entries(balnearioCount)
      .filter(([_, count]) => count === idsServicios.length)
      .map(([id]) => parseInt(id));

    if (balneariosMatch.length === 0) return [];

    // Traer info de los balnearios filtrados
    const { data: balnearios, error: errorBal } = await supabase
      .from('balnearios')
      .select('id_balneario, nombre, direccion, telefono, imagen, id_ciudad')
      .in('id_balneario', balneariosMatch);

    if (errorBal) throw errorBal;
    return balnearios || [];
  }
}

export { Busqueda };