"use strict";

/* =========================================================
   DATOS INICIALES: IGUALES AL CUADERNO DE GOOGLE COLAB
   ========================================================= */

const CIUDADES_INICIALES = [
  "Latacunga",
  "Salcedo",
  "Ambato",
  "Baños",
  "Riobamba",
  "Guaranda"
];

const RUTAS_INICIALES = [
  ["Latacunga", "Salcedo", 13.3],
  ["Latacunga", "Ambato", 39.8],
  ["Salcedo", "Ambato", 27.9],
  ["Ambato", "Baños", 38.4],
  ["Ambato", "Riobamba", 58.3],
  ["Baños", "Riobamba", 54.2],
  ["Riobamba", "Guaranda", 57.2],
  ["Ambato", "Guaranda", 91.9]
];

const INFO_CIUDADES = {
  Latacunga: {
    archivo: "latacunga.jpg",
    descripcion: "Ciudad andina de la provincia de Cotopaxi."
  },
  Salcedo: {
    archivo: "salcedo.jpg",
    descripcion: "Ciudad conocida por su ubicación estratégica en Cotopaxi."
  },
  Ambato: {
    archivo: "ambato.jpg",
    descripcion: "Centro de conexión principal dentro de la red EcoVuelo."
  },
  Baños: {
    archivo: "banos.jpg",
    descripcion: "Destino turístico de Tungurahua, asociado a naturaleza y aventura."
  },
  Riobamba: {
    archivo: "riobamba.jpg",
    descripcion: "Ciudad importante de Chimborazo con varias conexiones regionales."
  },
  Guaranda: {
    archivo: "guaranda.jpg",
    descripcion: "Ciudad de Bolívar conectada con Ambato y Riobamba."
  }
};

const NOMBRES_GOOGLE_MAPS = {
  Latacunga: "Latacunga, Cotopaxi, Ecuador",
  Salcedo: "San Miguel de Salcedo, Cotopaxi, Ecuador",
  Ambato: "Ambato, Tungurahua, Ecuador",
  Baños: "Baños de Agua Santa, Tungurahua, Ecuador",
  Riobamba: "Riobamba, Chimborazo, Ecuador",
  Guaranda: "Guaranda, Bolívar, Ecuador"
};

let grafo = crearRedInicial();
let graphRenderCounter = 0;
const graphViews = new Map();

function crearRedInicial() {
  return {
    ciudades: [...CIUDADES_INICIALES],
    rutas: RUTAS_INICIALES.map(([origen, destino, peso]) => ({ origen, destino, peso }))
  };
}

/* =========================================================
   UTILIDADES DEL GRAFO
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function texto(valor) {
  return typeof valor === "string" ? valor : "";
}

function clave(nombre) {
  return texto(nombre).trim().toLocaleLowerCase("es-EC");
}

function tituloPython(nombre) {
  return texto(nombre)
    .trim()
    .toLocaleLowerCase("es-EC")
    .replace(/(^|[\s\-'])\p{L}/gu, (letra) => letra.toLocaleUpperCase("es-EC"));
}

function compararTexto(a, b) {
  return a.toLocaleLowerCase("es-EC").localeCompare(
    b.toLocaleLowerCase("es-EC"),
    "es",
    { sensitivity: "variant" }
  );
}

function encontrarCiudad(nombreCiudad) {
  if (typeof nombreCiudad !== "string") return null;
  const buscada = clave(nombreCiudad);
  return grafo.ciudades.find((ciudad) => clave(ciudad) === buscada) ?? null;
}

function numeroCiudades() {
  return grafo.ciudades.length;
}

function numeroRutas() {
  return grafo.rutas.length;
}

function buscarArista(ciudadA, ciudadB) {
  const a = clave(ciudadA);
  const b = clave(ciudadB);
  return grafo.rutas.find((ruta) => {
    const origen = clave(ruta.origen);
    const destino = clave(ruta.destino);
    return (origen === a && destino === b) || (origen === b && destino === a);
  }) ?? null;
}

function existeArista(ciudadA, ciudadB) {
  return buscarArista(ciudadA, ciudadB) !== null;
}

function vecinos(ciudad) {
  const encontrados = [];
  for (const ruta of grafo.rutas) {
    if (clave(ruta.origen) === clave(ciudad)) encontrados.push(ruta.destino);
    else if (clave(ruta.destino) === clave(ciudad)) encontrados.push(ruta.origen);
  }
  return encontrados;
}

function vecinosOrdenados(ciudad) {
  return vecinos(ciudad).sort(compararTexto);
}

function grado(ciudad) {
  return vecinos(ciudad).length;
}

function ciudadesOrdenadas() {
  return [...grafo.ciudades].sort(compararTexto);
}

function aristasOrdenadas() {
  return [...grafo.rutas].sort((a, b) => {
    const c1 = compararTexto(a.origen, b.origen);
    return c1 !== 0 ? c1 : compararTexto(a.destino, b.destino);
  });
}

function conjuntoComponente(ciudadInicial) {
  const visitados = new Set([ciudadInicial]);
  const cola = [ciudadInicial];
  while (cola.length) {
    const actual = cola.shift();
    for (const vecino of vecinos(actual)) {
      if (!visitados.has(vecino)) {
        visitados.add(vecino);
        cola.push(vecino);
      }
    }
  }
  return visitados;
}

function existeCamino(origen, destino) {
  return conjuntoComponente(origen).has(destino);
}

/* =========================================================
   OPERACIONES 1 A 10: MENSAJES IGUALES A PYTHON
   ========================================================= */

function agregarCiudad(nombreCiudad) {
  if (typeof nombreCiudad !== "string") {
    return "Error: el nombre de la ciudad debe ser un texto.";
  }
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") {
    return "Error: debe ingresar el nombre de una ciudad.";
  }
  const existente = encontrarCiudad(nombreLimpio);
  if (existente !== null) {
    return `Error: la ciudad ${existente} ya está registrada.`;
  }
  const nombreFormateado = tituloPython(nombreLimpio);
  grafo.ciudades.push(nombreFormateado);
  return `Ciudad ${nombreFormateado} agregada correctamente. Total de ciudades: ${numeroCiudades()}.`;
}

function buscarCiudad(nombreCiudad) {
  if (typeof nombreCiudad !== "string") {
    return "Error: el nombre de la ciudad debe ser un texto.";
  }
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") {
    return "Error: debe ingresar el nombre de una ciudad.";
  }
  const encontrada = encontrarCiudad(nombreLimpio);
  if (encontrada !== null) {
    return `La ciudad ${encontrada} sí está registrada en EcoVuelo.`;
  }
  return `La ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
}

function eliminarCiudad(nombreCiudad) {
  if (typeof nombreCiudad !== "string") {
    return "Error: el nombre de la ciudad debe ser un texto.";
  }
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") {
    return "Error: debe ingresar el nombre de una ciudad.";
  }
  const encontrada = encontrarCiudad(nombreLimpio);
  if (encontrada === null) {
    return `Error: la ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
  }
  const cantidadRutas = grafo.rutas.filter(
    (ruta) => clave(ruta.origen) === clave(encontrada) || clave(ruta.destino) === clave(encontrada)
  ).length;
  grafo.rutas = grafo.rutas.filter(
    (ruta) => clave(ruta.origen) !== clave(encontrada) && clave(ruta.destino) !== clave(encontrada)
  );
  grafo.ciudades = grafo.ciudades.filter((ciudad) => clave(ciudad) !== clave(encontrada));
  return `Ciudad ${encontrada} eliminada correctamente. Rutas eliminadas: ${cantidadRutas}. Ciudades restantes: ${numeroCiudades()}. Rutas restantes: ${numeroRutas()}.`;
}

function agregarRuta(ciudadOrigen, ciudadDestino, distancia) {
  if (typeof ciudadOrigen !== "string") {
    return "Error: la ciudad de origen debe ingresarse como texto.";
  }
  if (typeof ciudadDestino !== "string") {
    return "Error: la ciudad de destino debe ingresarse como texto.";
  }
  const origenLimpio = ciudadOrigen.trim();
  const destinoLimpio = ciudadDestino.trim();
  if (origenLimpio === "") return "Error: debe ingresar la ciudad de origen.";
  if (destinoLimpio === "") return "Error: debe ingresar la ciudad de destino.";

  const origen = encontrarCiudad(origenLimpio);
  const destino = encontrarCiudad(destinoLimpio);
  if (origen === null) return `Error: la ciudad ${tituloPython(origenLimpio)} no está registrada en EcoVuelo.`;
  if (destino === null) return `Error: la ciudad ${tituloPython(destinoLimpio)} no está registrada en EcoVuelo.`;
  if (origen === destino) return "Error: no se puede crear una ruta desde una ciudad hacia la misma ciudad.";
  if (typeof distancia !== "number" || !Number.isFinite(distancia)) {
    return Number.isFinite(distancia) ? "Error: la distancia debe ser un valor numérico." : "Error: la distancia debe ser un valor numérico.";
  }
  if (distancia <= 0) return "Error: la distancia debe ser mayor que cero kilómetros.";
  const existente = buscarArista(origen, destino);
  if (existente) {
    return `Error: la ruta entre ${origen} y ${destino} ya está registrada con una distancia de ${existente.peso.toFixed(1)} km.`;
  }
  grafo.rutas.push({ origen, destino, peso: Number(distancia) });
  return `Ruta ${origen} ↔ ${destino} agregada correctamente con una distancia de ${Number(distancia).toFixed(1)} km. Total de rutas: ${numeroRutas()}.`;
}

function buscarRuta(ciudadA, ciudadB) {
  if (typeof ciudadA !== "string") return "Error: la primera ciudad debe ingresarse como texto.";
  if (typeof ciudadB !== "string") return "Error: la segunda ciudad debe ingresarse como texto.";
  const nombreA = ciudadA.trim();
  const nombreB = ciudadB.trim();
  if (nombreA === "") return "Error: debe ingresar la primera ciudad.";
  if (nombreB === "") return "Error: debe ingresar la segunda ciudad.";
  const a = encontrarCiudad(nombreA);
  const b = encontrarCiudad(nombreB);
  if (a === null) return `Error: la ciudad ${tituloPython(nombreA)} no está registrada en EcoVuelo.`;
  if (b === null) return `Error: la ciudad ${tituloPython(nombreB)} no está registrada en EcoVuelo.`;
  if (a === b) return "Error: debe seleccionar dos ciudades diferentes para buscar una ruta.";
  const ruta = buscarArista(a, b);
  if (ruta) return `Sí existe una ruta directa entre ${a} y ${b}. Distancia: ${ruta.peso.toFixed(1)} km.`;
  return `No existe una ruta directa entre ${a} y ${b}.`;
}

function eliminarRuta(ciudadA, ciudadB) {
  if (typeof ciudadA !== "string") return "Error: la primera ciudad debe ingresarse como texto.";
  if (typeof ciudadB !== "string") return "Error: la segunda ciudad debe ingresarse como texto.";
  const nombreA = ciudadA.trim();
  const nombreB = ciudadB.trim();
  if (nombreA === "") return "Error: debe ingresar la primera ciudad.";
  if (nombreB === "") return "Error: debe ingresar la segunda ciudad.";
  const a = encontrarCiudad(nombreA);
  const b = encontrarCiudad(nombreB);
  if (a === null) return `Error: la ciudad ${tituloPython(nombreA)} no está registrada en EcoVuelo.`;
  if (b === null) return `Error: la ciudad ${tituloPython(nombreB)} no está registrada en EcoVuelo.`;
  if (a === b) return "Error: debe seleccionar dos ciudades diferentes para eliminar una ruta.";
  const ruta = buscarArista(a, b);
  if (!ruta) return `Error: no existe una ruta directa entre ${a} y ${b}.`;
  const peso = ruta.peso;
  grafo.rutas = grafo.rutas.filter((item) => item !== ruta);
  return `Ruta ${a} ↔ ${b} eliminada correctamente. Distancia eliminada: ${peso.toFixed(1)} km. Rutas restantes: ${numeroRutas()}.`;
}

function mostrarDestinosDirectos(nombreCiudad) {
  if (typeof nombreCiudad !== "string") return "Error: el nombre de la ciudad debe ser un texto.";
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") return "Error: debe ingresar el nombre de una ciudad.";
  const ciudad = encontrarCiudad(nombreLimpio);
  if (ciudad === null) return `Error: la ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
  const destinos = vecinosOrdenados(ciudad).map((destino) => [destino, buscarArista(ciudad, destino).peso]);
  if (destinos.length === 0) return `La ciudad ${ciudad} está registrada, pero no tiene destinos directos.`;
  const lineas = [`Destinos directos desde ${ciudad}:`];
  destinos.forEach(([destino, distancia], i) => lineas.push(`${i + 1}. ${destino}: ${distancia.toFixed(1)} km`));
  lineas.push(`\nTotal de destinos directos: ${destinos.length}.`);
  return lineas.join("\n");
}

function consultarDistancia(ciudadA, ciudadB) {
  if (typeof ciudadA !== "string") return "Error: la primera ciudad debe ingresarse como texto.";
  if (typeof ciudadB !== "string") return "Error: la segunda ciudad debe ingresarse como texto.";
  const nombreA = ciudadA.trim();
  const nombreB = ciudadB.trim();
  if (nombreA === "") return "Error: debe ingresar la primera ciudad.";
  if (nombreB === "") return "Error: debe ingresar la segunda ciudad.";
  const a = encontrarCiudad(nombreA);
  const b = encontrarCiudad(nombreB);
  if (a === null) return `Error: la ciudad ${tituloPython(nombreA)} no está registrada en EcoVuelo.`;
  if (b === null) return `Error: la ciudad ${tituloPython(nombreB)} no está registrada en EcoVuelo.`;
  if (a === b) return "Error: debe seleccionar dos ciudades diferentes para consultar una distancia.";
  const ruta = buscarArista(a, b);
  if (!ruta) return `No existe una ruta directa entre ${a} y ${b}; por lo tanto, no existe una distancia directa registrada.`;
  if (ruta.peso === null || ruta.peso === undefined) return `Error: la ruta entre ${a} y ${b} no tiene una distancia registrada.`;
  return `La distancia directa entre ${a} y ${b} es de ${ruta.peso.toFixed(1)} km.`;
}

function calcularConectividad(nombreCiudad) {
  if (typeof nombreCiudad !== "string") return "Error: el nombre de la ciudad debe ser un texto.";
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") return "Error: debe ingresar el nombre de una ciudad.";
  const ciudad = encontrarCiudad(nombreLimpio);
  if (ciudad === null) return `Error: la ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
  const valorGrado = grado(ciudad);
  const conectadas = vecinosOrdenados(ciudad);
  if (valorGrado === 0) return `La ciudad ${ciudad} tiene un grado de 0. No posee rutas directas y se encuentra aislada dentro de la red.`;
  return `La ciudad ${ciudad} tiene un grado de ${valorGrado}. Esto significa que posee ${valorGrado} rutas directas. Ciudades conectadas: ${conectadas.join(", ")}.`;
}

function obtenerBfsPorNiveles(ciudadInicial) {
  const visitados = new Set([ciudadInicial]);
  const cola = [[ciudadInicial, 0]];
  const orden = [];
  const niveles = new Map();
  while (cola.length) {
    const [actual, nivel] = cola.shift();
    orden.push(actual);
    if (!niveles.has(nivel)) niveles.set(nivel, []);
    niveles.get(nivel).push(actual);
    for (const vecino of vecinosOrdenados(actual)) {
      if (!visitados.has(vecino)) {
        visitados.add(vecino);
        cola.push([vecino, nivel + 1]);
      }
    }
  }
  return { orden, niveles };
}

function recorridoBfs(nombreCiudad) {
  if (typeof nombreCiudad !== "string") return "Error: la ciudad inicial debe ingresarse como texto.";
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") return "Error: debe ingresar una ciudad inicial.";
  const inicial = encontrarCiudad(nombreLimpio);
  if (inicial === null) return `Error: la ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
  const { orden, niveles } = obtenerBfsPorNiveles(inicial);
  const lineas = [
    `RECORRIDO BFS DESDE ${inicial.toLocaleUpperCase("es-EC")}`,
    "",
    "Orden de visita:",
    orden.join(" → "),
    "",
    "Recorrido por niveles:"
  ];
  [...niveles.keys()].sort((a, b) => a - b).forEach((nivel) => {
    lineas.push(`Nivel ${nivel}: ${niveles.get(nivel).join(", ")}`);
  });
  lineas.push("");
  lineas.push(`Ciudades visitadas: ${orden.length} de ${numeroCiudades()}.`);
  if (orden.length === numeroCiudades()) {
    lineas.push("Resultado: desde la ciudad inicial se alcanzaron todas las ciudades de la red.");
  } else {
    const noVisitadas = grafo.ciudades.filter((c) => !orden.includes(c)).sort(compararTexto);
    lineas.push("Resultado: no se alcanzaron todas las ciudades.");
    lineas.push(`Ciudades no visitadas: ${noVisitadas.join(", ")}.`);
  }
  return lineas.join("\n");
}

function obtenerOrdenDfs(ciudadInicial) {
  const visitados = new Set();
  const orden = [];
  function explorar(actual) {
    visitados.add(actual);
    orden.push(actual);
    for (const vecino of vecinosOrdenados(actual)) {
      if (!visitados.has(vecino)) explorar(vecino);
    }
  }
  explorar(ciudadInicial);
  return orden;
}

function recorridoDfs(nombreCiudad) {
  if (typeof nombreCiudad !== "string") return "Error: la ciudad inicial debe ingresarse como texto.";
  const nombreLimpio = nombreCiudad.trim();
  if (nombreLimpio === "") return "Error: debe ingresar una ciudad inicial.";
  const inicial = encontrarCiudad(nombreLimpio);
  if (inicial === null) return `Error: la ciudad ${tituloPython(nombreLimpio)} no está registrada en EcoVuelo.`;
  const orden = obtenerOrdenDfs(inicial);
  const lineas = [
    `RECORRIDO DFS DESDE ${inicial.toLocaleUpperCase("es-EC")}`,
    "",
    "Orden de visita:",
    orden.join(" → "),
    "",
    `Ciudades visitadas: ${orden.length} de ${numeroCiudades()}.`
  ];
  if (orden.length === numeroCiudades()) {
    lineas.push("Resultado: desde la ciudad inicial se alcanzaron todas las ciudades de la red.");
  } else {
    const noVisitadas = grafo.ciudades.filter((c) => !orden.includes(c)).sort(compararTexto);
    lineas.push("Resultado: no se alcanzaron todas las ciudades.");
    lineas.push(`Ciudades no visitadas: ${noVisitadas.join(", ")}.`);
  }
  return lineas.join("\n");
}

function restaurarRedInicial() {
  grafo = crearRedInicial();
  return `Red inicial restaurada correctamente. Ciudades: ${numeroCiudades()}. Rutas: ${numeroRutas()}.`;
}

/* =========================================================
   DIJKSTRA Y GOOGLE MAPS
   ========================================================= */

function calcularRutaInteligente(ciudadOrigen, ciudadDestino) {
  if (typeof ciudadOrigen !== "string") {
    const mensaje = "Error: la ciudad de origen debe ser un texto.";
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  if (typeof ciudadDestino !== "string") {
    const mensaje = "Error: la ciudad de destino debe ser un texto.";
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  const origenLimpio = ciudadOrigen.trim();
  const destinoLimpio = ciudadDestino.trim();
  if (origenLimpio === "") {
    const mensaje = "Error: debe ingresar la ciudad de origen.";
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  if (destinoLimpio === "") {
    const mensaje = "Error: debe ingresar la ciudad de destino.";
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  const origen = encontrarCiudad(origenLimpio);
  const destino = encontrarCiudad(destinoLimpio);
  if (origen === null) {
    const mensaje = `Error: la ciudad ${tituloPython(origenLimpio)} no está registrada en EcoVuelo.`;
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  if (destino === null) {
    const mensaje = `Error: la ciudad ${tituloPython(destinoLimpio)} no está registrada en EcoVuelo.`;
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  if (origen === destino) {
    const mensaje = "Error: seleccione dos ciudades diferentes.";
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }
  if (!existeCamino(origen, destino)) {
    const mensaje = `No existe ningún recorrido entre ${origen} y ${destino}.`;
    return { mensaje, panel: crearPanelError(mensaje), camino: [] };
  }

  const distancias = new Map(grafo.ciudades.map((ciudad) => [ciudad, Infinity]));
  const anteriores = new Map();
  const pendientes = new Set(grafo.ciudades);
  distancias.set(origen, 0);

  while (pendientes.size) {
    let actual = null;
    let mejor = Infinity;
    for (const ciudad of pendientes) {
      const valor = distancias.get(ciudad);
      if (valor < mejor) {
        mejor = valor;
        actual = ciudad;
      }
    }
    if (actual === null || mejor === Infinity) break;
    pendientes.delete(actual);
    if (actual === destino) break;
    for (const vecino of vecinos(actual)) {
      if (!pendientes.has(vecino)) continue;
      const peso = buscarArista(actual, vecino).peso;
      const alternativa = distancias.get(actual) + peso;
      if (alternativa < distancias.get(vecino)) {
        distancias.set(vecino, alternativa);
        anteriores.set(vecino, actual);
      }
    }
  }

  const camino = [];
  let cursor = destino;
  while (cursor !== undefined) {
    camino.unshift(cursor);
    if (cursor === origen) break;
    cursor = anteriores.get(cursor);
  }
  const distanciaTotal = distancias.get(destino);
  const mensaje = [
    `RUTA INTELIGENTE ENTRE ${origen.toLocaleUpperCase("es-EC")} Y ${destino.toLocaleUpperCase("es-EC")}`,
    "",
    "Recorrido de menor distancia:",
    camino.join(" → "),
    "",
    `Distancia total dentro de EcoVuelo: ${distanciaTotal.toFixed(1)} km.`,
    "",
    `Ciudades utilizadas: ${camino.length}.`,
    `Tramos utilizados: ${camino.length - 1}.`
  ].join("\n");
  return { mensaje, panel: crearPanelGoogleMaps(origen, destino, camino), camino };
}

function obtenerNombreGoogleMaps(nombreCiudad) {
  const ciudad = encontrarCiudad(nombreCiudad);
  if (ciudad === null) return `${texto(nombreCiudad).trim()}, Ecuador`;
  return NOMBRES_GOOGLE_MAPS[ciudad] ?? `${ciudad}, Ecuador`;
}

function crearUrlGoogleMaps(origen, destino, puntosIntermedios = []) {
  let url = "https://www.google.com/maps/dir/?api=1";
  url += `&origin=${encodeURIComponent(obtenerNombreGoogleMaps(origen))}`;
  url += `&destination=${encodeURIComponent(obtenerNombreGoogleMaps(destino))}`;
  url += "&travelmode=driving";
  if (puntosIntermedios.length) {
    url += `&waypoints=${encodeURIComponent(puntosIntermedios.map(obtenerNombreGoogleMaps).join("|"))}`;
  }
  return url;
}

function crearPanelError(mensaje) {
  return `<div class="map-error">${escaparHtml(mensaje)}</div>`;
}

function crearPanelGoogleMaps(ciudadOrigen, ciudadDestino, camino = null) {
  if (typeof ciudadOrigen !== "string" || typeof ciudadDestino !== "string") {
    return '<div class="map-error">Debe ingresar ciudades válidas.</div>';
  }
  const origen = encontrarCiudad(ciudadOrigen);
  const destino = encontrarCiudad(ciudadDestino);
  if (origen === null || destino === null) {
    return '<div class="map-error">Una o ambas ciudades no están registradas.</div>';
  }
  if (origen === destino) {
    return '<div class="map-error">Seleccione dos ciudades diferentes.</div>';
  }
  const recorrido = camino ?? [origen, destino];
  const url = crearUrlGoogleMaps(origen, destino, recorrido.slice(1, -1));
  const rutaDirecta = buscarArista(origen, destino);
  const textoDistancia = rutaDirecta ? `${rutaDirecta.peso.toFixed(1)} km` : "No existe una ruta directa";
  return `
    <div class="google-map-panel">
      <div class="google-map-title">Verificación geográfica</div>
      <div class="google-map-grid">
        <div><span class="google-map-label">Origen</span><strong>${escaparHtml(origen)}</strong></div>
        <div><span class="google-map-label">Destino</span><strong>${escaparHtml(destino)}</strong></div>
        <div><span class="google-map-label">Distancia directa en EcoVuelo</span><strong>${escaparHtml(textoDistancia)}</strong></div>
      </div>
      <div class="google-map-route"><span class="google-map-label">Recorrido seleccionado</span><strong>${escaparHtml(recorrido.join(" → "))}</strong></div>
      <a class="google-map-button" href="${escaparHtml(url)}" target="_blank" rel="noopener noreferrer">Abrir recorrido en Google Maps</a>
      <p class="google-map-note">Google Maps mostrará su propia distancia y duración por carretera. Ese valor puede diferir del peso usado en EcoVuelo.</p>
    </div>`;
}

/* =========================================================
   ESTADO Y TARJETAS VISUALES
   ========================================================= */

function obtenerEstadoRed() {
  const lineas = [
    "ESTADO ACTUAL DE ECOVUELO",
    "",
    `Total de ciudades: ${numeroCiudades()}`,
    `Total de rutas: ${numeroRutas()}`,
    "",
    "Ciudades registradas:"
  ];
  const ciudades = ciudadesOrdenadas();
  if (ciudades.length) ciudades.forEach((ciudad, i) => lineas.push(`${i + 1}. ${ciudad}`));
  else lineas.push("- No existen ciudades registradas.");
  lineas.push("");
  lineas.push("Rutas registradas:");
  const rutas = aristasOrdenadas();
  if (rutas.length) {
    rutas.forEach((ruta, i) => {
      const distancia = ruta.peso === null || ruta.peso === undefined ? "sin distancia" : `${ruta.peso.toFixed(1)} km`;
      lineas.push(`${i + 1}. ${ruta.origen} ↔ ${ruta.destino}: ${distancia}`);
    });
  } else lineas.push("- No existen rutas registradas.");
  return lineas.join("\n");
}

function escaparHtml(valor) {
  return texto(valor).replace(/[&<>'"]/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[caracter]);
}

function candidatosImagen(ciudad) {
  const base = INFO_CIUDADES[ciudad]?.archivo;
  if (!base) return [];
  const nombres = new Set([base]);
  if (ciudad === "Baños") nombres.add("baños.jpg");
  const carpetas = ["imagenes", "imágenes"];
  const candidatos = [];
  for (const carpeta of carpetas) {
    for (const nombre of nombres) candidatos.push(`${carpeta}/${nombre}`);
  }
  const usuario = "miriam20029";
  const repo = "EcoVuelo-Sierra-Central";
  for (const rama of ["principal", "main"]) {
    for (const carpeta of carpetas) {
      for (const nombre of nombres) {
        candidatos.push(`https://raw.githubusercontent.com/${usuario}/${repo}/${rama}/${encodeURIComponent(carpeta)}/${encodeURIComponent(nombre)}`);
      }
    }
  }
  return candidatos;
}

function configurarImagen(img, ciudad, placeholder) {
  const candidatos = candidatosImagen(ciudad);
  let indice = 0;
  function probar() {
    if (indice >= candidatos.length) {
      img.remove();
      placeholder.hidden = false;
      return;
    }
    img.src = candidatos[indice++];
  }
  img.addEventListener("error", probar);
  img.addEventListener("load", () => { placeholder.hidden = true; img.hidden = false; });
  img.hidden = true;
  probar();
}

function crearTarjetaCiudad(ciudad) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "eco-city-card";

  const imagen = document.createElement("img");
  imagen.className = "eco-city-photo";
  imagen.alt = ciudad;

  const placeholder = document.createElement("div");
  placeholder.className = "eco-city-placeholder";
  placeholder.textContent = `📍 ${ciudad}`;

  const cuerpo = document.createElement("div");
  cuerpo.className = "eco-city-body";
  const nombre = document.createElement("div");
  nombre.className = "eco-city-name";
  nombre.textContent = ciudad;
  const descripcion = document.createElement("div");
  descripcion.className = "eco-city-description";
  descripcion.textContent = INFO_CIUDADES[ciudad]?.descripcion ?? "Ciudad registrada en EcoVuelo.";
  cuerpo.append(nombre, descripcion);
  tarjeta.append(imagen, placeholder, cuerpo);
  configurarImagen(imagen, ciudad, placeholder);
  return tarjeta;
}

function crearPanelTarjetas(ciudades = null, titulo = "Ciudades destacadas") {
  const lista = ciudades === null ? ciudadesOrdenadas() : [...new Set(ciudades.filter(Boolean))];
  const panel = document.createElement("div");
  panel.className = "eco-visual-panel";
  const encabezado = document.createElement("div");
  encabezado.className = "eco-visual-title";
  encabezado.textContent = titulo;
  panel.appendChild(encabezado);
  const grid = document.createElement("div");
  grid.className = "eco-city-grid";
  if (!lista.length) {
    const vacio = document.createElement("div");
    vacio.className = "eco-empty-panel";
    vacio.textContent = "No hay ciudades para mostrar en este apartado.";
    grid.appendChild(vacio);
  } else {
    lista.forEach((ciudad) => grid.appendChild(crearTarjetaCiudad(ciudad)));
  }
  panel.appendChild(grid);
  return panel;
}

function renderizarDetalleVisual({ titulo = "Detalle visual", ciudades = null, camino = null, mensajeExtra = "" } = {}) {
  const destino = $("visual-detail");
  destino.innerHTML = "";
  if (mensajeExtra) {
    const extra = document.createElement("div");
    extra.className = "eco-extra-info";
    extra.textContent = mensajeExtra;
    destino.appendChild(extra);
  }
  if (camino && camino.length) {
    const caja = document.createElement("div");
    caja.className = "eco-route-box";
    const tituloRuta = document.createElement("div");
    tituloRuta.className = "eco-route-title";
    tituloRuta.textContent = "Ruta resaltada";
    const flujo = document.createElement("div");
    flujo.className = "eco-route-flow";
    camino.forEach((ciudad, i) => {
      const paso = document.createElement("div");
      paso.className = "eco-step";
      paso.style.animationDelay = `${i * 100}ms`;
      paso.innerHTML = `<span class="eco-step-number">${i + 1}</span><span class="eco-step-city">${escaparHtml(ciudad)}</span>`;
      flujo.appendChild(paso);
    });
    caja.append(tituloRuta, flujo);
    destino.appendChild(caja);
  }
  destino.appendChild(crearPanelTarjetas(ciudades, titulo));
}

function renderizarGaleriaInicial() {
  const contenedor = $("initial-gallery");
  contenedor.innerHTML = "";
  contenedor.appendChild(crearPanelTarjetas(ciudadesOrdenadas(), "Ciudades de la red EcoVuelo"));
}

/* =========================================================
   GRAFO SVG INTERACTIVO, ZOOM, PAN Y ANIMACIÓN
   ========================================================= */

const POSICIONES_FIJAS = {
  Guaranda: [260, 135],
  Riobamba: [180, 330],
  Baños: [150, 535],
  Ambato: [505, 355],
  Latacunga: [840, 250],
  Salcedo: [840, 530]
};

function obtenerPosiciones() {
  const resultado = new Map();
  for (const ciudad of grafo.ciudades) {
    if (POSICIONES_FIJAS[ciudad]) resultado.set(ciudad, [...POSICIONES_FIJAS[ciudad]]);
  }
  const extras = grafo.ciudades.filter((c) => !resultado.has(c));
  extras.forEach((ciudad, i) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, extras.length);
    resultado.set(ciudad, [500 + Math.cos(angulo) * 310, 350 + Math.sin(angulo) * 245]);
  });
  return resultado;
}

function claveArista(a, b) {
  return [clave(a), clave(b)].sort().join("||");
}

function renderizarGrafo(idContenedor, { camino = [], nodosDestacados = [], titulo = null, motion = false } = {}) {
  const contenedor = $(idContenedor);
  if (!contenedor) return;
  const vistaAnterior = graphViews.get(idContenedor) ?? { escala: 1, x: 0, y: 0 };
  const identificador = ++graphRenderCounter;
  const posiciones = obtenerPosiciones();
  const nodosActivos = new Set(nodosDestacados ?? []);
  const aristasCamino = new Map();
  for (let i = 0; i < camino.length - 1; i++) aristasCamino.set(claveArista(camino[i], camino[i + 1]), i);
  const inicio = camino.length >= 1 ? camino[0] : null;
  const final = camino.length >= 2 ? camino.at(-1) : null;

  contenedor.innerHTML = `
    <div class="graph-toolbar">
      <button class="graph-tool" data-action="minus" title="Alejar">−</button>
      <button class="graph-tool" data-action="reset" title="Restablecer">⌂</button>
      <button class="graph-tool" data-action="plus" title="Acercar">+</button>
    </div>
    <svg viewBox="0 0 1000 650" role="img" aria-label="${escaparHtml(titulo ?? (camino.length ? "Ruta inteligente resaltada" : "Visualización interactiva de EcoVuelo"))}">
      <rect width="1000" height="650" fill="#f8fbff"></rect>
      <text x="500" y="31" text-anchor="middle" class="graph-title">${escaparHtml(titulo ?? (camino.length ? "Ruta inteligente resaltada" : "Visualización interactiva de EcoVuelo"))}</text>
      <text x="500" y="54" text-anchor="middle" class="graph-subtitle">Sistema de Rutas Aéreas EcoVuelo · Red ponderada de la Sierra Central</text>
      <g class="viewport-layer"></g>
    </svg>`;

  const svg = contenedor.querySelector("svg");
  const capa = contenedor.querySelector(".viewport-layer");
  const ns = "http://www.w3.org/2000/svg";

  if (numeroCiudades() === 0) {
    const mensaje = document.createElementNS(ns, "text");
    mensaje.setAttribute("x", "500"); mensaje.setAttribute("y", "335");
    mensaje.setAttribute("text-anchor", "middle"); mensaje.setAttribute("class", "graph-empty");
    mensaje.textContent = "La red no contiene ciudades.";
    capa.appendChild(mensaje);
  } else {
    grafo.rutas.forEach((ruta) => {
      const p0 = posiciones.get(ruta.origen);
      const p1 = posiciones.get(ruta.destino);
      if (!p0 || !p1) return;
      const key = claveArista(ruta.origen, ruta.destino);
      const indiceCamino = aristasCamino.get(key);
      const grupo = document.createElementNS(ns, "g");
      const linea = document.createElementNS(ns, "line");
      linea.setAttribute("x1", p0[0]); linea.setAttribute("y1", p0[1]);
      linea.setAttribute("x2", p1[0]); linea.setAttribute("y2", p1[1]);
      linea.setAttribute("class", `graph-edge${indiceCamino !== undefined ? " highlighted" : ""}${motion && indiceCamino !== undefined ? " motion" : ""}`);
      if (motion && indiceCamino !== undefined) linea.style.animationDelay = `${indiceCamino * 330}ms`;
      linea.dataset.tooltip = `${ruta.origen} ↔ ${ruta.destino}\nDistancia: ${ruta.peso.toFixed(1)} km`;
      const etiqueta = document.createElementNS(ns, "text");
      etiqueta.setAttribute("x", (p0[0] + p1[0]) / 2);
      etiqueta.setAttribute("y", (p0[1] + p1[1]) / 2 - 7);
      etiqueta.setAttribute("text-anchor", "middle");
      etiqueta.setAttribute("class", "graph-edge-label");
      etiqueta.textContent = `${ruta.peso.toFixed(1)} km`;
      grupo.append(linea, etiqueta);
      capa.appendChild(grupo);
    });

    grafo.ciudades.forEach((ciudad) => {
      const [x, y] = posiciones.get(ciudad);
      const grupo = document.createElementNS(ns, "g");
      grupo.setAttribute("class", "node-group");
      grupo.dataset.city = ciudad;
      let clase = "normal";
      let radio = 29;
      if (ciudad === inicio) { clase = "start"; radio = 42; }
      else if (ciudad === final) { clase = "end"; radio = 42; }
      else if (camino.includes(ciudad)) { clase = "path"; radio = 35; }
      else if (nodosActivos.has(ciudad)) { clase = "active"; radio = 33; }

      const circulo = document.createElementNS(ns, "circle");
      circulo.setAttribute("cx", x); circulo.setAttribute("cy", y); circulo.setAttribute("r", radio);
      circulo.setAttribute("class", `graph-node ${clase}${motion && camino.includes(ciudad) ? " motion" : ""}`);
      if (motion && camino.includes(ciudad)) circulo.style.animationDelay = `${Math.max(0, camino.indexOf(ciudad)) * 330}ms`;
      circulo.dataset.tooltip = `${ciudad}\nConectividad: ${grado(ciudad)}\nDestinos: ${vecinosOrdenados(ciudad).join(", ") || "Sin conexiones"}`;

      const etiqueta = document.createElementNS(ns, "text");
      etiqueta.setAttribute("x", x); etiqueta.setAttribute("y", y - radio - 10);
      etiqueta.setAttribute("text-anchor", "middle"); etiqueta.setAttribute("class", "graph-node-label");
      etiqueta.textContent = ciudad;
      grupo.append(circulo, etiqueta);

      if (camino.includes(ciudad)) {
        const indice = camino.indexOf(ciudad);
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", x - 27); rect.setAttribute("y", y + radio + 7);
        rect.setAttribute("width", 54); rect.setAttribute("height", 20); rect.setAttribute("rx", 5);
        rect.setAttribute("class", "graph-step-badge");
        const paso = document.createElementNS(ns, "text");
        paso.setAttribute("x", x); paso.setAttribute("y", y + radio + 21);
        paso.setAttribute("text-anchor", "middle"); paso.setAttribute("class", "graph-step-text");
        paso.textContent = `Paso ${indice + 1}`;
        grupo.append(rect, paso);
      }
      capa.appendChild(grupo);
    });
  }

  let vista = { ...vistaAnterior };
  graphViews.set(idContenedor, vista);
  function aplicarTransformacion() {
    capa.setAttribute("transform", `translate(${vista.x} ${vista.y}) scale(${vista.escala})`);
    graphViews.set(idContenedor, { ...vista });
  }
  aplicarTransformacion();

  contenedor.querySelector('[data-action="plus"]').addEventListener("click", () => {
    vista.escala = Math.min(2.6, vista.escala + 0.15); aplicarTransformacion();
  });
  contenedor.querySelector('[data-action="minus"]').addEventListener("click", () => {
    vista.escala = Math.max(0.55, vista.escala - 0.15); aplicarTransformacion();
  });
  contenedor.querySelector('[data-action="reset"]').addEventListener("click", () => {
    vista = { escala: 1, x: 0, y: 0 }; aplicarTransformacion();
  });
  svg.addEventListener("wheel", (evento) => {
    evento.preventDefault();
    vista.escala = Math.max(0.55, Math.min(2.6, vista.escala + (evento.deltaY < 0 ? 0.1 : -0.1)));
    aplicarTransformacion();
  }, { passive: false });

  let arrastrando = false;
  let ultimo = null;
  svg.addEventListener("pointerdown", (evento) => {
    if (evento.target.closest(".graph-toolbar")) return;
    arrastrando = true;
    ultimo = { x: evento.clientX, y: evento.clientY };
    svg.setPointerCapture(evento.pointerId);
  });
  svg.addEventListener("pointermove", (evento) => {
    if (!arrastrando || !ultimo) return;
    const escalaPantalla = svg.getBoundingClientRect().width / 1000;
    vista.x += (evento.clientX - ultimo.x) / escalaPantalla;
    vista.y += (evento.clientY - ultimo.y) / escalaPantalla;
    ultimo = { x: evento.clientX, y: evento.clientY };
    aplicarTransformacion();
  });
  svg.addEventListener("pointerup", () => { arrastrando = false; ultimo = null; });
  svg.addEventListener("pointercancel", () => { arrastrando = false; ultimo = null; });

  const tooltip = $("graph-tooltip");
  contenedor.querySelectorAll("[data-tooltip]").forEach((elemento) => {
    elemento.addEventListener("pointerenter", (evento) => {
      tooltip.textContent = elemento.dataset.tooltip;
      tooltip.hidden = false;
      moverTooltip(evento);
    });
    elemento.addEventListener("pointermove", moverTooltip);
    elemento.addEventListener("pointerleave", () => { tooltip.hidden = true; });
  });

  function moverTooltip(evento) {
    tooltip.style.left = `${evento.clientX + 14}px`;
    tooltip.style.top = `${evento.clientY + 14}px`;
  }

  contenedor.querySelectorAll(".node-group").forEach((grupo) => {
    grupo.addEventListener("click", () => {
      const ciudad = grupo.dataset.city;
      renderizarDetalleVisual({ titulo: "Detalle de la ciudad", ciudades: [ciudad] });
    });
  });
}

/* =========================================================
   SALIDAS DE LA INTERFAZ
   ========================================================= */

function actualizarSalidaGeneral(mensaje, { ciudades = null, camino = null, tituloDetalle = "Detalle visual", mensajeExtra = "" } = {}) {
  $("general-result").textContent = mensaje;
  $("network-state").textContent = obtenerEstadoRed();
  renderizarGrafo("general-graph", { camino: camino ?? [], nodosDestacados: ciudades ?? [], motion: Boolean(camino?.length) });
  renderizarDetalleVisual({ titulo: tituloDetalle, ciudades, camino, mensajeExtra });
}

function interfazAgregarCiudad() {
  const nombre = $("city-add").value;
  const mensaje = agregarCiudad(nombre);
  const ciudad = encontrarCiudad(nombre);
  actualizarSalidaGeneral(mensaje, { ciudades: ciudad ? [ciudad] : null, tituloDetalle: "Ciudad agregada o consultada" });
}

function interfazBuscarCiudad() {
  const nombre = $("city-search").value;
  const mensaje = buscarCiudad(nombre);
  const ciudad = encontrarCiudad(nombre);
  actualizarSalidaGeneral(mensaje, { ciudades: ciudad ? [ciudad] : null, tituloDetalle: "Resultado de búsqueda" });
}

function interfazEliminarCiudad() {
  const nombre = $("city-delete").value;
  const ciudad = encontrarCiudad(nombre);
  if (!$("city-delete-confirm").checked) {
    actualizarSalidaGeneral(
      "Operación cancelada: debe marcar la casilla de confirmación para eliminar una ciudad.",
      { ciudades: ciudad ? [ciudad] : null, tituloDetalle: "Eliminación cancelada" }
    );
    return;
  }
  const mensaje = eliminarCiudad(nombre);
  actualizarSalidaGeneral(mensaje, { ciudades: null, tituloDetalle: "Estado actualizado" });
}

function leerDistancia() {
  const valor = $("route-add-distance").value.trim();
  if (valor === "") return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

function interfazAgregarRuta() {
  const origenTexto = $("route-add-origin").value;
  const destinoTexto = $("route-add-destination").value;
  const distancia = leerDistancia();
  const mensaje = agregarRuta(origenTexto, destinoTexto, distancia);
  const a = encontrarCiudad(origenTexto);
  const b = encontrarCiudad(destinoTexto);
  const ciudades = [a, b].filter(Boolean);
  const camino = ciudades.length === 2 && existeArista(ciudades[0], ciudades[1]) ? ciudades : null;
  actualizarSalidaGeneral(mensaje, { ciudades: ciudades.length ? ciudades : null, camino, tituloDetalle: "Ruta agregada o revisada" });
}

function interfazBuscarRuta() {
  const textoA = $("route-search-a").value;
  const textoB = $("route-search-b").value;
  const mensaje = buscarRuta(textoA, textoB);
  const a = encontrarCiudad(textoA);
  const b = encontrarCiudad(textoB);
  const ciudades = [a, b].filter(Boolean);
  const camino = ciudades.length === 2 && existeArista(ciudades[0], ciudades[1]) ? ciudades : null;
  actualizarSalidaGeneral(mensaje, { ciudades: ciudades.length ? ciudades : null, camino, tituloDetalle: "Consulta de ruta" });
}

function interfazEliminarRuta() {
  const textoA = $("route-delete-a").value;
  const textoB = $("route-delete-b").value;
  const a = encontrarCiudad(textoA);
  const b = encontrarCiudad(textoB);
  const ciudades = [a, b].filter(Boolean);
  if (!$("route-delete-confirm").checked) {
    actualizarSalidaGeneral(
      "Operación cancelada: debe marcar la casilla de confirmación para eliminar una ruta.",
      { ciudades, tituloDetalle: "Eliminación cancelada" }
    );
    return;
  }
  const mensaje = eliminarRuta(textoA, textoB);
  actualizarSalidaGeneral(mensaje, { ciudades, tituloDetalle: "Ruta eliminada" });
}

function interfazDestinosDirectos() {
  const nombre = $("direct-city").value;
  const mensaje = mostrarDestinosDirectos(nombre);
  const ciudad = encontrarCiudad(nombre);
  const ciudades = ciudad ? [ciudad, ...vecinosOrdenados(ciudad)] : null;
  actualizarSalidaGeneral(mensaje, { ciudades, tituloDetalle: "Destinos directos" });
}

function interfazConsultarDistancia() {
  const textoA = $("distance-a").value;
  const textoB = $("distance-b").value;
  const mensaje = consultarDistancia(textoA, textoB);
  const a = encontrarCiudad(textoA);
  const b = encontrarCiudad(textoB);
  const ciudades = [a, b].filter(Boolean);
  const camino = ciudades.length === 2 && existeArista(ciudades[0], ciudades[1]) ? ciudades : null;
  actualizarSalidaGeneral(mensaje, { ciudades: ciudades.length ? ciudades : null, camino, tituloDetalle: "Consulta de distancia" });
}

function interfazCalcularConectividad() {
  const nombre = $("degree-city").value;
  const mensaje = calcularConectividad(nombre);
  const ciudad = encontrarCiudad(nombre);
  const ciudades = ciudad ? [ciudad, ...vecinosOrdenados(ciudad)] : null;
  actualizarSalidaGeneral(mensaje, { ciudades, tituloDetalle: "Conectividad de la ciudad" });
}

function interfazBfs() {
  const nombre = $("bfs-city").value;
  const mensaje = recorridoBfs(nombre);
  const ciudad = encontrarCiudad(nombre);
  const orden = ciudad ? obtenerBfsPorNiveles(ciudad).orden : null;
  actualizarSalidaGeneral(mensaje, {
    ciudades: orden,
    tituloDetalle: "Recorrido BFS",
    mensajeExtra: "Las tarjetas se muestran en el orden de visita del recorrido."
  });
}

function interfazDfs() {
  const nombre = $("dfs-city").value;
  const mensaje = recorridoDfs(nombre);
  const ciudad = encontrarCiudad(nombre);
  const orden = ciudad ? obtenerOrdenDfs(ciudad) : null;
  actualizarSalidaGeneral(mensaje, {
    ciudades: orden,
    tituloDetalle: "Recorrido DFS",
    mensajeExtra: "Las tarjetas se muestran en el orden de visita del recorrido."
  });
}

function interfazRestaurar() {
  const mensaje = restaurarRedInicial();
  actualizarSalidaGeneral(mensaje, { ciudades: ciudadesOrdenadas(), tituloDetalle: "Red restaurada" });
  mostrarToast("Red inicial restaurada");
}

function interfazActualizar() {
  actualizarSalidaGeneral(
    "La información y la visualización fueron actualizadas correctamente.",
    { ciudades: ciudadesOrdenadas(), tituloDetalle: "Vista general actualizada" }
  );
}

function interfazGoogleMaps() {
  $("maps-panel").innerHTML = crearPanelGoogleMaps($("maps-origin").value, $("maps-destination").value);
}

function interfazRutaInteligente() {
  const resultado = calcularRutaInteligente($("smart-origin").value, $("smart-destination").value);
  $("smart-result").textContent = resultado.mensaje;
  $("smart-maps-panel").innerHTML = resultado.panel;
  renderizarGrafo("smart-graph", {
    camino: resultado.camino,
    nodosDestacados: resultado.camino,
    titulo: resultado.camino.length ? "Ruta inteligente resaltada" : "Visualización interactiva de EcoVuelo",
    motion: resultado.camino.length > 0
  });
  renderizarDetalleVisual({
    titulo: "Ruta inteligente",
    ciudades: resultado.camino.length ? resultado.camino : null,
    camino: resultado.camino.length ? resultado.camino : null,
    mensajeExtra: "La ruta resaltada representa el recorrido de menor distancia calculado con Dijkstra."
  });
}

/* =========================================================
   INICIALIZACIÓN Y EVENTOS
   ========================================================= */

function configurarPestanas() {
  document.querySelectorAll(".tab-button").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      boton.classList.add("active");
      $(`tab-${boton.dataset.tab}`).classList.add("active");
    });
  });
}

function mostrarToast(mensaje) {
  const anterior = document.querySelector(".toast");
  if (anterior) anterior.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function enlazarEventos() {
  $("btn-update").addEventListener("click", interfazActualizar);
  $("btn-restore").addEventListener("click", interfazRestaurar);
  $("btn-city-add").addEventListener("click", interfazAgregarCiudad);
  $("btn-city-search").addEventListener("click", interfazBuscarCiudad);
  $("btn-city-delete").addEventListener("click", interfazEliminarCiudad);
  $("btn-route-add").addEventListener("click", interfazAgregarRuta);
  $("btn-route-search").addEventListener("click", interfazBuscarRuta);
  $("btn-route-delete").addEventListener("click", interfazEliminarRuta);
  $("btn-direct").addEventListener("click", interfazDestinosDirectos);
  $("btn-distance").addEventListener("click", interfazConsultarDistancia);
  $("btn-degree").addEventListener("click", interfazCalcularConectividad);
  $("btn-bfs").addEventListener("click", interfazBfs);
  $("btn-dfs").addEventListener("click", interfazDfs);
  $("btn-maps").addEventListener("click", interfazGoogleMaps);
  $("btn-smart").addEventListener("click", interfazRutaInteligente);

  document.querySelectorAll("input[type='text'], input[type='number']").forEach((entrada) => {
    entrada.addEventListener("keydown", (evento) => {
      if (evento.key !== "Enter") return;
      const tarjeta = entrada.closest(".input-card");
      const boton = tarjeta?.querySelector("button");
      if (boton) boton.click();
    });
  });
}

function iniciar() {
  configurarPestanas();
  enlazarEventos();
  renderizarGaleriaInicial();
  $("network-state").textContent = obtenerEstadoRed();
  renderizarDetalleVisual({
    titulo: "Vista general",
    ciudades: ciudadesOrdenadas(),
    mensajeExtra: "Este panel cambia visualmente según la operación que ejecutes."
  });
  renderizarGrafo("general-graph");
  renderizarGrafo("smart-graph");
}

iniciar();

/* Exposición mínima para pruebas automáticas, sin afectar la interfaz. */
window.EcoVuelo = {
  agregarCiudad,
  buscarCiudad,
  eliminarCiudad,
  agregarRuta,
  buscarRuta,
  eliminarRuta,
  mostrarDestinosDirectos,
  consultarDistancia,
  calcularConectividad,
  recorridoBfs,
  recorridoDfs,
  calcularRutaInteligente,
  restaurarRedInicial,
  obtenerEstadoRed
};
