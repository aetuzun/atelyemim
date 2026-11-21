let projects = typeof sampleProjects === 'undefined' ? [] : sampleProjects;
const byId = id => document.getElementById(id);
const collator = new Intl.Collator('tr', { numeric: true });
const normalize = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ı', 'i');
const columns = [
  ['number', 'No'], ['years', 'Yıl'], ['title', 'Proje'],
  ['type', 'Tipoloji'], ['location', 'Konum'], ['client', 'İşveren'], ['area', 'Alan'],
];
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const areaLabel = area => area == null ? '—' :
  typeof area === 'number' ? area.toLocaleString('tr-TR') + ' m²' : area;
const display = (project, field) => field === 'area' ? areaLabel(project.area) : project[field] || '—';
let view = 'list';
let sortKey = 'number';
let ascending = true;
const year = project => Number(project.years.match(/\b\d{4}\b/)?.[0]) || null;

function numberProjects(records) {
  return [...records].sort((a, b) =>
    (year(a) ?? Infinity) - (year(b) ?? Infinity) ||
    collator.compare(a.title, b.title) || collator.compare(a.id, b.id))
    .map((project, index) => ({ ...project, number: index + 1 }));
}

projects = numberProjects(projects);

function updateMobileSort() {
  const control = byId('mobile-sort');
  const value = sortKey + (ascending ? ':asc' : ':desc');
  if (Array.from(control.options).some(option => option.value === value)) control.value = value;
}


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

function projectInfo(project) {
  const details = element('dl');
  for (const [field, label] of columns) {
    if (field === 'title' || display(project, field) === '—') continue;
    details.append(element('dt', label), element('dd', display(project, field)));
  }
  if (project.image) {
    const image = element('img');
    image.src = project.image;
    image.alt = project.title;
    image.loading = 'lazy';
    details.append(element('dt', 'Görsel'));
    const photo = element('dd');
    photo.append(image);
    details.append(photo);
  }
  return details;
}

function renderList(rows) {
  const wrapper = element('div', '', 'table-wrap');
  wrapper.tabIndex = 0;
  wrapper.setAttribute('aria-label', 'Proje tablosu');
  const table = element('table');
  table.setAttribute('role', 'table');
  const head = table.createTHead();
  head.setAttribute('role', 'rowgroup');
  const header = head.insertRow();
  header.setAttribute('role', 'row');
  for (const [field, label] of columns) {
    const cell = element('th');
    cell.scope = 'col';
    cell.setAttribute('role', 'columnheader');
    if (field === sortKey) cell.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
    const button = element('button', label);
    button.dataset.sort = field;
    button.addEventListener('click', () => {
      ascending = sortKey === field ? !ascending : field !== 'years';
      sortKey = field;
      updateMobileSort();
      render();
      byId('results').querySelector(`[data-sort="${field}"]`).focus();
    });
    cell.append(button);
    header.append(cell);
  }
  const body = table.createTBody();
  body.setAttribute('role', 'rowgroup');
  for (const project of rows) {
    const row = body.insertRow();
    row.className = 'project-row';
    row.setAttribute('role', 'row');
    const button = element('button', project.title, 'project-title');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'details-' + project.id);
    for (const [field] of columns) {
      const cell = row.insertCell();
      cell.className = 'field-' + field;
      cell.setAttribute('role', 'cell');
      if (field === 'title') cell.append(button);
      else cell.textContent = display(project, field);
    }
    const detailRow = body.insertRow();
    detailRow.setAttribute('role', 'row');
    detailRow.id = 'details-' + project.id;
    detailRow.className = 'detail-row';
    detailRow.hidden = true;
    const cell = detailRow.insertCell();
    cell.colSpan = columns.length;
    cell.setAttribute('role', 'cell');
    button.addEventListener('click', () => {
      detailRow.hidden = !detailRow.hidden;
      button.setAttribute('aria-expanded', String(!detailRow.hidden));
      if (!detailRow.hidden && !cell.firstChild) cell.append(projectInfo(project));
    });
  }
  wrapper.append(table);
  return wrapper;
}

function renderGallery(rows) {
  const grid = element('div', '', 'cards');
  for (const project of rows) {
    const card = element('button', '', 'card');
    if (project.image) {
      const image = element('img');
      image.src = project.image;
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else {
      card.classList.add('card-without-image');
    }
    card.append(element('strong', project.title),
      element('span', [project.number, project.years, project.location].filter(Boolean).join(' · ')));
    card.addEventListener('click', () => {
      const heading = element('h2', project.title);
      heading.id = 'project-heading';
      byId('project-details').replaceChildren(heading, projectInfo(project));
      byId('project-dialog').showModal();
    });
    grid.append(card);
  }
  return grid;
}

function sortValue(project) {
  if (sortKey === 'years') return year(project) ?? '';
  return project[sortKey] ?? '';
}

function render() {
  const query = normalize(byId('search').value.trim()).split(/\s+/);
  const type = byId('type').value;
  const city = byId('city').value;
  const rows = projects.filter(project =>
    (!type || project.type === type) && (!city || project.city === city) &&
    query.every(term => normalize([project.title, project.location, project.number, project.type, project.client].join(' ')).includes(term)));
  rows.sort((a, b) => {
    const left = sortValue(a);
    const right = sortValue(b);
    const titleOrder = collator.compare(a.title, b.title);
    if (left === '' || right === '') return Number(left === '') - Number(right === '') || titleOrder;
    return (ascending ? 1 : -1) * collator.compare(left, right) || titleOrder;
  });
  byId('count').textContent = rows.length + ' proje';
  byId('results').replaceChildren(rows.length ?
    (view === 'list' ? renderList(rows) : renderGallery(rows)) :
    element('p', 'Aramanıza uygun proje bulunamadı.'));
}

byId('mobile-sort').addEventListener('change', event => {
  const [field, direction] = event.target.value.split(':');
  sortKey = field;
  ascending = direction === 'asc';
  render();
});
byId('search').addEventListener('input', render);
for (const id of ['type', 'city']) byId(id).addEventListener('change', render);
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
    projects = numberProjects(data);
    populateFilters();
    render();
  })
  .catch(() => {});
