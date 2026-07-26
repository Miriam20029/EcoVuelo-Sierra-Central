"use strict";

const INITIAL_CITIES = [
  {
    name: "Latacunga",
    description: "Ciudad andina de Cotopaxi y punto de conexión con Salcedo y Ambato.",
    images: ["imagenes/latacunga.jpg", "imágenes/latacunga.jpg"]
  },
  {
    name: "Salcedo",
    description: "Ciudad de Cotopaxi reconocida por su ubicación estratégica en la Sierra Central.",
    images: ["imagenes/salcedo.jpg", "imágenes/salcedo.jpg"]
  },
  {
    name: "Ambato",
    description: "Nodo principal de la red y ciudad con mayor conectividad de EcoVuelo.",
    images: ["imagenes/ambato.jpg", "imágenes/ambato.jpg"]
  },
  {
    name: "Baños",
    description: "Destino turístico de Tungurahua asociado con naturaleza, cascadas y aventura.",
    images: ["imagenes/banos.jpg", "imágenes/banos.jpg", "imágenes/baños.jpg", "imagenes/baños.jpg"]
  },
  {
    name: "Riobamba",
    description: "Ciudad de Chimborazo conectada con Ambato, Baños y Guaranda.",
    images: ["imagenes/riobamba.jpg", "imágenes/riobamba.jpg"]
  },
  {
    name: "Guaranda",
    description: "Ciudad de Bolívar conectada directamente con Ambato y Riobamba.",
    images: ["imagenes/guaranda.jpg", "imágenes/guaranda.jpg"]
  }
];

const INITIAL_ROUTES = [
  { a: "Latacunga", b: "Salcedo", distance: 13.3 },
  { a: "Latacunga", b: "Ambato", distance: 39.8 },
  { a: "Salcedo", b: "Ambato", distance: 27.9 },
  { a: "Ambato", b: "Baños", distance: 38.4 },
  { a: "Ambato", b: "Riobamba", distance: 58.3 },
  { a: "Baños", b: "Riobamba", distance: 54.2 },
  { a: "Riobamba", b: "Guaranda", distance: 57.2 },
  { a: "Ambato", b: "Guaranda", distance: 91.9 }
];

const FIXED_POSITIONS = {
  Latacunga: { x: 790, y: 155 },
  Salcedo: { x: 790, y: 480 },
  Ambato: { x: 485, y: 320 },
  Baños: { x: 195, y: 515 },
  Riobamba: { x: 220, y: 260 },
  Guaranda: { x: 330, y: 80 }
};

let state = loadState();
let highlightedPath = [];
let selectedCity = null;
let graphTransform = { scale: 1, x: 0, y: 0 };

const $ = (id) => document.getElementById(id);

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialState() {
  return { cities: deepCopy(INITIAL_CITIES), routes: deepCopy(INITIAL_ROUTES) };
}

function loadState() {
  try {
    const saved = localStorage.getItem("ecovuelo-state-v1");
    if (!saved) return initialState();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.cities) || !Array.isArray(parsed.routes)) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

function saveState() {
  localStorage.setItem("ecovuelo-state-v1", JSON.stringify(state));
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function titleCase(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|\s|[-'])\p{L}/gu, (m) => m.toLocaleUpperCase("es"));
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function findCity(name) {
  const key = normalize(name);
  return state.cities.find((city) => normalize(city.name) === key) || null;
}

function routeBetween(a, b) {
  const ka = normalize(a);
  const kb = normalize(b);
  return state.routes.find((route) => {
    const ra = normalize(route.a);
    const rb = normalize(route.b);
    return (ra === ka && rb === kb) || (ra === kb && rb === ka);
  }) || null;
}

function neighbors(name) {
  const city = findCity(name);
  if (!city) return [];
  return state.routes
    .filter((r) => normalize(r.a) === normalize(city.name) || normalize(r.b) === normalize(city.name))
    .map((r) => normalize(r.a) === normalize(city.name) ? r.b : r.a)
    .sort((a, b) => a.localeCompare(b, "es"));
}

function degree(name) {
  return neighbors(name).length;
}

function isConnected() {
  if (state.cities.length === 0) return true;
  return bfsOrder(state.cities[0].name).length === state.cities.length;
}

function bfsOrder(startName) {
  const start = findCity(startName);
  if (!start) return [];
  const visited = new Set([normalize(start.name)]);
  const queue = [start.name];
  const order = [];

  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const next of neighbors(current)) {
      const key = normalize(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return order;
}

function bfsLevels(startName) {
  const start = findCity(startName);
  if (!start) return [];
  const visited = new Set([normalize(start.name)]);
  const queue = [{ name: start.name, level: 0 }];
  const levels = [];

  while (queue.length) {
    const current = queue.shift();
    levels[current.level] ||= [];
    levels[current.level].push(current.name);
    for (const next of neighbors(current.name)) {
      const key = normalize(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ name: next, level: current.level + 1 });
      }
    }
  }
  return levels;
}

function dfsOrder(startName) {
  const start = findCity(startName);
  if (!start) return [];
  const visited = new Set();
  const order = [];

  function visit(name) {
    visited.add(normalize(name));
    order.push(name);
    for (const next of neighbors(name)) {
      if (!visited.has(normalize(next))) visit(next);
    }
  }

  visit(start.name);
  return order;
}

function dijkstra(startName, endName) {
  const start = findCity(startName);
  const end = findCity(endName);
  if (!start || !end) return null;

  const distances = new Map(state.cities.map((c) => [c.name, Infinity]));
  const previous = new Map();
  const unvisited = new Set(state.cities.map((c) => c.name));
  distances.set(start.name, 0);

  while (unvisited.size) {
    let current = null;
    let best = Infinity;
    for (const city of unvisited) {
      const d = distances.get(city);
      if (d < best) {
        best = d;
        current = city;
      }
    }

    if (current === null || best === Infinity) break;
    unvisited.delete(current);
    if (normalize(current) === normalize(end.name)) break;

    for (const next of neighbors(current)) {
      if (!unvisited.has(next)) continue;
      const edge = routeBetween(current, next);
      const candidate = distances.get(current) + edge.distance;
      if (candidate < distances.get(next)) {
        distances.set(next, candidate);
        previous.set(next, current);
      }
    }
  }

  const total = distances.get(end.name);
  if (!Number.isFinite(total)) return null;

  const path = [];
  let cursor = end.name;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor);
  }
  return { path, distance: total };
}

function cityImageElement(city) {
  const img = document.createElement("img");
  img.alt = `Vista representativa de ${city.name}`;
  img.loading = "lazy";
  const candidates = Array.isArray(city.images) ? city.images : [];
  let index = 0;

  function tryNext() {
    if (index >= candidates.length) {
      const fallback = document.createElement("div");
      fallback.className = "city-card__fallback";
      fallback.textContent = `📍 ${city.name}`;
      img.replaceWith(fallback);
      return;
    }
    img.src = candidates[index++];
  }

  img.addEventListener("error", tryNext);
  tryNext();
  return img;
}

function renderGallery() {
  const gallery = $("cityGallery");
  gallery.innerHTML = "";

  for (const city of [...state.cities].sort((a, b) => a.name.localeCompare(b.name, "es"))) {
    const card = document.createElement("article");
    card.className = "city-card";
    card.addEventListener("click", () => selectCity(city.name));

    const media = document.createElement("div");
    media.className = "city-card__media";
    media.appendChild(cityImageElement(city));

    const body = document.createElement("div");
    body.className = "city-card__body";
    body.innerHTML = `
      <h3>${escapeHtml(city.name)}</h3>
      <p>${escapeHtml(city.description || "Ciudad registrada en EcoVuelo.")}</p>
      <div class="city-card__meta">
        <span>Grado ${degree(city.name)}</span>
        <span>${neighbors(city.name).length} destinos</span>
      </div>
    `;

    card.append(media, body);
    gallery.appendChild(card);
  }
}

function dynamicPositions() {
  const result = {};
  const dynamic = state.cities.filter((c) => !FIXED_POSITIONS[c.name]);
  for (const city of state.cities) {
    if (FIXED_POSITIONS[city.name]) result[city.name] = FIXED_POSITIONS[city.name];
  }
  const radius = 210;
  dynamic.forEach((city, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(dynamic.length, 1) - Math.PI / 2;
    result[city.name] = { x: 480 + Math.cos(angle) * radius, y: 310 + Math.sin(angle) * radius };
  });
  return result;
}

function renderGraph() {
  const layer = $("graphLayer");
  layer.innerHTML = "";
  const positions = dynamicPositions();
  layer.setAttribute("transform", `translate(${graphTransform.x} ${graphTransform.y}) scale(${graphTransform.scale})`);

  for (const route of state.routes) {
    const p1 = positions[route.a];
    const p2 = positions[route.b];
    if (!p1 || !p2) continue;
    const key = new Set([normalize(route.a), normalize(route.b)]);
    const highlighted = highlightedPath.some((name, i) => {
      if (i === highlightedPath.length - 1) return false;
      return key.has(normalize(highlightedPath[i])) && key.has(normalize(highlightedPath[i + 1]));
    });

    const line = svg("line", {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      class: `graph-edge${highlighted ? " is-highlighted" : ""}`
    });
    line.appendChild(svgTitle(`${route.a} ↔ ${route.b}: ${route.distance.toFixed(1)} km`));
    layer.appendChild(line);

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const label = svg("text", { x: mx, y: my - 7, "text-anchor": "middle", class: "graph-edge-label" });
    label.textContent = `${route.distance.toFixed(1)} km`;
    layer.appendChild(label);
  }

  for (const city of state.cities) {
    const p = positions[city.name];
    if (!p) continue;
    const index = highlightedPath.findIndex((name) => normalize(name) === normalize(city.name));
    const classes = ["graph-node"];
    if (index >= 0) classes.push("is-path");
    if (index === 0) classes.push("is-start");
    if (index === highlightedPath.length - 1 && index > 0) classes.push("is-end");
    if (selectedCity && normalize(selectedCity) === normalize(city.name)) classes.push("is-selected");

    const group = svg("g", { class: classes.join(" "), transform: `translate(${p.x} ${p.y})`, tabindex: "0", role: "button" });
    group.addEventListener("click", () => selectCity(city.name));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") selectCity(city.name);
    });
    group.appendChild(svg("circle", { r: 48 }));

    const nameText = svg("text", { "text-anchor": "middle", y: -2 });
    nameText.textContent = city.name;
    group.appendChild(nameText);

    const sub = svg("text", { "text-anchor": "middle", y: 18, class: "node-subtext" });
    sub.textContent = `grado ${degree(city.name)}`;
    group.appendChild(sub);

    group.appendChild(svgTitle(`${city.name}. Conectividad: ${degree(city.name)}. Destinos: ${neighbors(city.name).join(", ") || "ninguno"}`));
    layer.appendChild(group);
  }
}

function svg(tag, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
}

function svgTitle(text) {
  const title = svg("title");
  title.textContent = text;
  return title;
}

function renderStats() {
  $("statCities").textContent = state.cities.length;
  $("statRoutes").textContent = state.routes.length;
  if (state.cities.length) {
    const hub = [...state.cities].sort((a, b) => degree(b.name) - degree(a.name) || a.name.localeCompare(b.name, "es"))[0];
    $("statHub").textContent = `${hub.name} (${degree(hub.name)})`;
  } else {
    $("statHub").textContent = "Sin ciudades";
  }
  $("statConnectivity").textContent = isConnected() ? "Conectada" : "Desconectada";
}

function renderAll() {
  saveState();
  renderStats();
  renderGraph();
  renderGallery();
}

function selectCity(name) {
  const city = findCity(name);
  if (!city) return;
  selectedCity = city.name;
  highlightedPath = [];
  showResult(
    `Ciudad: ${city.name}`,
    `Conectividad: ${degree(city.name)}\nDestinos directos: ${neighbors(city.name).join(", ") || "ninguno"}.`,
    "info",
    cityDetailHtml(city)
  );
  renderGraph();
}

function cityDetailHtml(city) {
  return `
    <div class="detail-card">
      <h4>${escapeHtml(city.name)}</h4>
      <p>${escapeHtml(city.description || "Ciudad registrada en EcoVuelo.")}</p>
      <p><strong>Grado:</strong> ${degree(city.name)}</p>
      <p><strong>Destinos:</strong> ${escapeHtml(neighbors(city.name).join(", ") || "Sin conexiones")}</p>
    </div>
  `;
}

function showResult(title, body, type = "info", detailHtml = "") {
  $("resultTitle").textContent = title;
  $("resultBody").textContent = body;
  $("visualDetail").innerHTML = detailHtml;
  showToast(title, type);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " toast--error" : type === "success" ? " toast--success" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2300);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addCity() {
  const input = $("addCityName");
  const raw = input.value.trim();
  if (!raw) return showResult("Dato incompleto", "Debe ingresar el nombre de una ciudad.", "error");
  if (findCity(raw)) return showResult("Ciudad repetida", `La ciudad ${findCity(raw).name} ya está registrada.`, "error");

  const name = titleCase(raw);
  const slug = slugify(name);
  const city = {
    name,
    description: "Ciudad añadida por el usuario al Sistema EcoVuelo.",
    images: [`imagenes/${slug}.jpg`, `imágenes/${slug}.jpg`]
  };
  state.cities.push(city);
  highlightedPath = [];
  selectedCity = city.name;
  input.value = "";
  renderAll();
  showResult("Ciudad agregada", `${name} se agregó correctamente. Total de ciudades: ${state.cities.length}.`, "success", cityDetailHtml(city));
}

function searchCity() {
  const city = findCity($("searchCityName").value);
  if (!city) return showResult("Ciudad no encontrada", "La ciudad consultada no está registrada en EcoVuelo.", "error");
  selectCity(city.name);
}

function deleteCity() {
  const input = $("deleteCityName");
  const city = findCity(input.value);
  if (!city) return showResult("Ciudad no encontrada", "No es posible eliminar una ciudad que no está registrada.", "error");
  if (!$("deleteCityConfirm").checked) return showResult("Confirmación requerida", "Marque la casilla para confirmar la eliminación de la ciudad y sus rutas.", "error");

  const removedRoutes = state.routes.filter((r) => normalize(r.a) === normalize(city.name) || normalize(r.b) === normalize(city.name)).length;
  state.routes = state.routes.filter((r) => normalize(r.a) !== normalize(city.name) && normalize(r.b) !== normalize(city.name));
  state.cities = state.cities.filter((c) => normalize(c.name) !== normalize(city.name));
  highlightedPath = [];
  selectedCity = null;
  input.value = "";
  $("deleteCityConfirm").checked = false;
  renderAll();
  showResult("Ciudad eliminada", `${city.name} fue eliminada junto con ${removedRoutes} ruta(s).`, "success");
}

function addRoute() {
  const cityA = findCity($("routeAddA").value);
  const cityB = findCity($("routeAddB").value);
  const distance = Number($("routeAddDistance").value);
  if (!cityA || !cityB) return showResult("Ciudad inexistente", "Las dos ciudades deben estar registradas antes de crear una ruta.", "error");
  if (normalize(cityA.name) === normalize(cityB.name)) return showResult("Ruta inválida", "Una ciudad no puede conectarse consigo misma.", "error");
  if (!Number.isFinite(distance) || distance <= 0) return showResult("Distancia inválida", "La distancia debe ser un número mayor que cero.", "error");
  if (routeBetween(cityA.name, cityB.name)) return showResult("Ruta repetida", "La conexión ya está registrada.", "error");

  state.routes.push({ a: cityA.name, b: cityB.name, distance });
  highlightedPath = [cityA.name, cityB.name];
  renderAll();
  showResult("Ruta agregada", `${cityA.name} ↔ ${cityB.name}: ${distance.toFixed(1)} km.`, "success");
}

function searchRoute() {
  const cityA = findCity($("routeSearchA").value);
  const cityB = findCity($("routeSearchB").value);
  if (!cityA || !cityB) return showResult("Ciudad inexistente", "Una o ambas ciudades no están registradas.", "error");
  const route = routeBetween(cityA.name, cityB.name);
  if (!route) {
    highlightedPath = [];
    renderGraph();
    return showResult("Ruta no encontrada", `No existe una ruta directa entre ${cityA.name} y ${cityB.name}.`, "error");
  }
  highlightedPath = [cityA.name, cityB.name];
  renderGraph();
  showResult("Ruta encontrada", `${cityA.name} ↔ ${cityB.name}: ${route.distance.toFixed(1)} km.`, "success");
}

function deleteRoute() {
  const cityA = findCity($("routeDeleteA").value);
  const cityB = findCity($("routeDeleteB").value);
  if (!cityA || !cityB) return showResult("Ciudad inexistente", "Una o ambas ciudades no están registradas.", "error");
  const route = routeBetween(cityA.name, cityB.name);
  if (!route) return showResult("Ruta no encontrada", "La ruta directa no está registrada.", "error");
  if (!$("deleteRouteConfirm").checked) return showResult("Confirmación requerida", "Marque la casilla para confirmar la eliminación de la ruta.", "error");

  state.routes = state.routes.filter((r) => r !== route);
  highlightedPath = [];
  $("deleteRouteConfirm").checked = false;
  renderAll();
  showResult("Ruta eliminada", `${cityA.name} ↔ ${cityB.name} fue eliminada. Las ciudades permanecen registradas.`, "success");
}

function showDirectDestinations() {
  const city = findCity($("directCity").value);
  if (!city) return showResult("Ciudad no encontrada", "La ciudad consultada no está registrada.", "error");
  const list = neighbors(city.name);
  highlightedPath = [];
  selectedCity = city.name;
  renderGraph();
  showResult(
    `Destinos directos desde ${city.name}`,
    list.length ? list.map((name, i) => `${i + 1}. ${name}: ${routeBetween(city.name, name).distance.toFixed(1)} km`).join("\n") : "La ciudad está aislada y no tiene destinos directos.",
    "success",
    cityDetailHtml(city)
  );
}

function consultDistance() {
  const a = findCity($("distanceA").value);
  const b = findCity($("distanceB").value);
  if (!a || !b) return showResult("Ciudad inexistente", "Una o ambas ciudades no están registradas.", "error");
  const route = routeBetween(a.name, b.name);
  if (!route) {
    highlightedPath = [];
    renderGraph();
    return showResult("Sin distancia directa", `No existe una ruta directa entre ${a.name} y ${b.name}.`, "error");
  }
  highlightedPath = [a.name, b.name];
  renderGraph();
  showResult("Distancia consultada", `La distancia directa entre ${a.name} y ${b.name} es ${route.distance.toFixed(1)} km.`, "success");
}

function consultDegree() {
  const city = findCity($("degreeCity").value);
  if (!city) return showResult("Ciudad no encontrada", "La ciudad consultada no está registrada.", "error");
  selectedCity = city.name;
  highlightedPath = [];
  renderGraph();
  showResult("Conectividad calculada", `${city.name} tiene grado ${degree(city.name)}. Ciudades conectadas: ${neighbors(city.name).join(", ") || "ninguna"}.`, "success", cityDetailHtml(city));
}

function executeBFS() {
  const city = findCity($("bfsStart").value);
  if (!city) return showResult("Ciudad no encontrada", "La ciudad inicial no está registrada.", "error");
  const order = bfsOrder(city.name);
  const levels = bfsLevels(city.name);
  highlightedPath = [];
  selectedCity = city.name;
  renderGraph();
  const levelText = levels.map((cities, index) => `Nivel ${index}: ${cities.join(", ")}`).join("\n");
  showResult("Recorrido BFS", `Orden: ${order.join(" → ")}\n\n${levelText}\n\nVisitadas: ${order.length} de ${state.cities.length}.`, "success");
}

function executeDFS() {
  const city = findCity($("dfsStart").value);
  if (!city) return showResult("Ciudad no encontrada", "La ciudad inicial no está registrada.", "error");
  const order = dfsOrder(city.name);
  highlightedPath = [];
  selectedCity = city.name;
  renderGraph();
  showResult("Recorrido DFS", `Orden: ${order.join(" → ")}\n\nVisitadas: ${order.length} de ${state.cities.length}.`, "success");
}

function executeDijkstra() {
  const a = findCity($("smartA").value);
  const b = findCity($("smartB").value);
  if (!a || !b) return showResult("Ciudad inexistente", "Una o ambas ciudades no están registradas.", "error");
  if (normalize(a.name) === normalize(b.name)) return showResult("Consulta inválida", "Seleccione dos ciudades diferentes.", "error");

  const result = dijkstra(a.name, b.name);
  if (!result) {
    highlightedPath = [];
    renderGraph();
    $("smartRouteTitle").textContent = "No existe un recorrido";
    $("smartRouteSteps").innerHTML = "";
    $("smartRouteDistance").textContent = "";
    $("mapsLink").classList.add("is-hidden");
    return showResult("Ruta no disponible", `No existe un camino entre ${a.name} y ${b.name}.`, "error");
  }

  highlightedPath = result.path;
  selectedCity = null;
  renderGraph();
  renderSmartSteps(result.path);
  $("smartRouteTitle").textContent = `${a.name} → ${b.name}`;
  $("smartRouteDistance").textContent = `Distancia total en EcoVuelo: ${result.distance.toFixed(1)} km`;

  const maps = $("mapsLink");
  maps.href = googleMapsUrl(result.path);
  maps.classList.remove("is-hidden");
  showResult("Ruta inteligente calculada", `${result.path.join(" → ")}\nDistancia total: ${result.distance.toFixed(1)} km.`, "success");
}

function renderSmartSteps(path) {
  const container = $("smartRouteSteps");
  container.innerHTML = "";
  path.forEach((name, index) => {
    const step = document.createElement("span");
    step.className = "route-step";
    step.style.animationDelay = `${index * 110}ms`;
    step.textContent = `${index + 1}. ${name}`;
    container.appendChild(step);
    if (index < path.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "route-arrow";
      arrow.textContent = "→";
      container.appendChild(arrow);
    }
  });
}

function googleMapsUrl(path) {
  const places = path.map((name) => googleName(name));
  const origin = encodeURIComponent(places[0]);
  const destination = encodeURIComponent(places.at(-1));
  const waypoints = places.slice(1, -1).map(encodeURIComponent).join("%7C");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving${waypoints ? `&waypoints=${waypoints}` : ""}`;
}

function googleName(name) {
  const mapping = {
    Latacunga: "Latacunga, Cotopaxi, Ecuador",
    Salcedo: "San Miguel de Salcedo, Cotopaxi, Ecuador",
    Ambato: "Ambato, Tungurahua, Ecuador",
    Baños: "Baños de Agua Santa, Tungurahua, Ecuador",
    Riobamba: "Riobamba, Chimborazo, Ecuador",
    Guaranda: "Guaranda, Bolívar, Ecuador"
  };
  return mapping[name] || `${name}, Ecuador`;
}

function resetNetwork() {
  state = initialState();
  highlightedPath = [];
  selectedCity = null;
  localStorage.removeItem("ecovuelo-state-v1");
  renderAll();
  $("smartRouteTitle").textContent = "Esperando una consulta";
  $("smartRouteSteps").innerHTML = "";
  $("smartRouteDistance").textContent = "";
  $("mapsLink").classList.add("is-hidden");
  showResult("Red restaurada", "EcoVuelo volvió a la configuración inicial de 6 ciudades y 8 rutas.", "success");
}

function setupTabs() {
  document.querySelectorAll(".nav-btn[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      $(button.dataset.tab).classList.add("is-active");
    });
  });
}

function setupGraphControls() {
  $("zoomIn").addEventListener("click", () => setZoom(graphTransform.scale + 0.12));
  $("zoomOut").addEventListener("click", () => setZoom(graphTransform.scale - 0.12));
  $("zoomReset").addEventListener("click", () => {
    graphTransform = { scale: 1, x: 0, y: 0 };
    renderGraph();
  });

  const viewport = $("graphViewport");
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    setZoom(graphTransform.scale + (event.deltaY < 0 ? 0.08 : -0.08));
  }, { passive: false });

  let dragging = false;
  let startX = 0;
  let startY = 0;
  viewport.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX - graphTransform.x;
    startY = event.clientY - graphTransform.y;
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    graphTransform.x = event.clientX - startX;
    graphTransform.y = event.clientY - startY;
    renderGraph();
  });
  viewport.addEventListener("pointerup", () => { dragging = false; });
}

function setZoom(value) {
  graphTransform.scale = Math.min(1.8, Math.max(0.55, value));
  renderGraph();
}

function bindEvents() {
  $("addCityBtn").addEventListener("click", addCity);
  $("searchCityBtn").addEventListener("click", searchCity);
  $("deleteCityBtn").addEventListener("click", deleteCity);
  $("addRouteBtn").addEventListener("click", addRoute);
  $("searchRouteBtn").addEventListener("click", searchRoute);
  $("deleteRouteBtn").addEventListener("click", deleteRoute);
  $("directBtn").addEventListener("click", showDirectDestinations);
  $("distanceBtn").addEventListener("click", consultDistance);
  $("degreeBtn").addEventListener("click", consultDegree);
  $("bfsBtn").addEventListener("click", executeBFS);
  $("dfsBtn").addEventListener("click", executeDFS);
  $("smartBtn").addEventListener("click", executeDijkstra);
  $("resetNetwork").addEventListener("click", resetNetwork);
}

setupTabs();
setupGraphControls();
bindEvents();
renderAll();
