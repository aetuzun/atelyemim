let projects = typeof sampleProjects === "undefined" ? [] : sampleProjects;
const byId = id => document.getElementById(id);
const collator = new Intl.Collator('tr');
const normalize = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ı', 'i');
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const projectLink = project => {
  if (!project.url) return element('span', project.title);
  const link = element('a', project.title);
  link.href = project.url;
  return link;
};
const areaLabel = project => project.area == null ? '—' :
  typeof project.area === 'number' ? project.area.toLocaleString('tr-TR') + ' m²' : project.area;
let view = 'list';

function populateFilters() {
  for (const [id, field] of [['type', 'type'], ['city', 'city']]) {
    const select = byId(id);
    const selected = select.value;
    select.length = 1;
    const values = [...new Set(projects.map(project => project[field]).filter(Boolean))].sort(collator.compare);
    for (const value of values) select.add(new Option(value, value));
    if (values.includes(selected)) select.value = selected;
  }
}

function renderList(rows) {
  const wrapper = element('div', '', 'table-wrap');
  wrapper.tabIndex = 0;
  wrapper.setAttribute('aria-label', 'Proje tablosu');
  const table = element('table');
  const header = table.createTHead().insertRow();
  for (const title of ['Proje Kodu', 'Proje', 'Yıl', 'Tipoloji', 'Konum', 'İşveren', 'Proje Alanı']) {
    const cell = element('th', title);
    cell.scope = 'col';
    header.append(cell);
  }
  const body = table.createTBody();
  for (const project of rows) {
    const row = body.insertRow();
    const code = row.insertCell();
    code.textContent = project.id;
    code.className = 'code';
    row.insertCell().append(projectLink(project));
    for (const value of [project.years, project.type, project.location, project.client, areaLabel(project)]) {
      row.insertCell().textContent = value || '—';
    }
  }
  wrapper.append(table);
  return wrapper;
}

function renderGallery(rows) {
  const grid = element('div', '', 'cards');
  for (const project of rows) {
    const card = element('article', '', 'card');
    const link = projectLink(project);
    const image = element('img');
    image.src = project.image;
    image.alt = '';
    image.loading = 'lazy';
    if (project.url) link.prepend(image);
    else card.append(image);
    const title = element('h2');
    title.append(link);
    card.append(title, element('p', [project.years, project.location].filter(Boolean).join(' · ')));
    grid.append(card);
  }
  return grid;
}

function render() {
  const query = normalize(byId('search').value.trim()).split(/\s+/);
  const type = byId('type').value;
  const city = byId('city').value;
  const order = byId('order').value;
  const rows = projects.filter(project =>
    (!type || project.type === type) && (!city || project.city === city) &&
    query.every(term => normalize([project.title, project.location, project.id, project.client].join(' ')).includes(term)));
  if (view === 'gallery') rows.splice(0, rows.length, ...rows.filter(project => project.image));
  rows.sort((a, b) => {
    const titleOrder = collator.compare(a.title, b.title);
    if (order === 'name') return titleOrder;
    if (!a.years || !b.years) return Number(Boolean(b.years)) - Number(Boolean(a.years)) || titleOrder;
    const difference = Number(a.years.slice(0, 4)) - Number(b.years.slice(0, 4));
    return (order === 'asc' ? difference : -difference) || titleOrder;
  });
  byId('count').textContent = rows.length + ' proje';
  byId('results').replaceChildren(rows.length ? (view === 'list' ? renderList(rows) : renderGallery(rows)) : element('p', 'Aramanıza uygun proje bulunamadı.'));
}

byId('search').addEventListener('input', render);
for (const id of ['type', 'city', 'order']) byId(id).addEventListener('change', render);
function applyView() {
  view = location.hash === '#grid' ? 'gallery' : 'list';
  for (const mode of ['list', 'gallery']) byId(mode).setAttribute('aria-pressed', String(view === mode));
  render();
}

byId('list').addEventListener('click', () => { location.hash = 'list'; });
byId('gallery').addEventListener('click', () => { location.hash = 'grid'; });
window.addEventListener('hashchange', applyView);
populateFilters();
applyView();

fetch('./projects.json')
  .then(response => response.ok ? response.json() : null)
  .then(data => {
    if (!Array.isArray(data)) return;
    projects = data;
    populateFilters();
    render();
  })
  .catch(() => {});
