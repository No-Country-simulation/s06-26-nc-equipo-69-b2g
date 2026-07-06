import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const BATCH_SIZE = 500;
const SQL_CHUNK_SIZE = 100;
// Approximate Florianópolis bounding box (south, west, north, east). A bbox is
// faster and less brittle than an Overpass area lookup for this one-off MVP seed.
const FLORIANOPOLIS_BBOX = '-27.90,-48.75,-27.35,-48.30';

const dryRun = process.argv.includes('--dry-run');
const sqlDirArgIndex = process.argv.indexOf('--sql-dir');
const sqlDir = sqlDirArgIndex >= 0 ? process.argv[sqlDirArgIndex + 1] : '';

const categoryRules = [
  {
    categoria: 'salud',
    matches: ({ amenity, healthcare }) =>
      ['hospital', 'clinic', 'doctors', 'dentist', 'pharmacy'].includes(amenity) ||
      Boolean(healthcare),
  },
  {
    categoria: 'educacion',
    matches: ({ amenity }) =>
      ['school', 'kindergarten', 'university', 'college', 'library'].includes(amenity),
  },
  {
    categoria: 'asistencia',
    matches: ({ amenity, social_facility: socialFacility }) =>
      ['social_facility', 'community_centre'].includes(amenity) || Boolean(socialFacility),
  },
  {
    categoria: 'gobierno',
    matches: ({ amenity, office, building }) =>
      [
        'townhall',
        'public_building',
        'police',
        'fire_station',
        'courthouse',
        'post_office',
      ].includes(amenity) ||
      ['government', 'administrative'].includes(office) ||
      building === 'public',
  },
];

function buildOverpassQuery() {
  return `
    [out:json][timeout:60];
    (
      node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|school|kindergarten|university|college|library|social_facility|community_centre|townhall|public_building|police|fire_station|courthouse|post_office)$"](${FLORIANOPOLIS_BBOX});
      way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|school|kindergarten|university|college|library|social_facility|community_centre|townhall|public_building|police|fire_station|courthouse|post_office)$"](${FLORIANOPOLIS_BBOX});
      relation["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|school|kindergarten|university|college|library|social_facility|community_centre|townhall|public_building|police|fire_station|courthouse|post_office)$"](${FLORIANOPOLIS_BBOX});
      node["healthcare"](${FLORIANOPOLIS_BBOX});
      way["healthcare"](${FLORIANOPOLIS_BBOX});
      relation["healthcare"](${FLORIANOPOLIS_BBOX});
      node["social_facility"](${FLORIANOPOLIS_BBOX});
      way["social_facility"](${FLORIANOPOLIS_BBOX});
      relation["social_facility"](${FLORIANOPOLIS_BBOX});
      node["office"~"^(government|administrative)$"](${FLORIANOPOLIS_BBOX});
      way["office"~"^(government|administrative)$"](${FLORIANOPOLIS_BBOX});
      relation["office"~"^(government|administrative)$"](${FLORIANOPOLIS_BBOX});
      node["building"="public"](${FLORIANOPOLIS_BBOX});
      way["building"="public"](${FLORIANOPOLIS_BBOX});
      relation["building"="public"](${FLORIANOPOLIS_BBOX});
    );
    out center tags;
  `;
}

function getCategoria(tags) {
  return categoryRules.find((rule) => rule.matches(tags))?.categoria ?? 'otro';
}

function getTipo(tags) {
  return (
    tags.amenity ||
    tags.healthcare ||
    tags.social_facility ||
    tags.office ||
    tags.public_transport ||
    tags.railway ||
    tags.highway ||
    tags.building ||
    'otro'
  );
}

function toRow(element) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (!lat || !lon) return null;

  return {
    source: 'osm',
    source_id: `${element.type}/${element.id}`,
    nome: tags.name || tags['name:pt'] || tags.operator || getTipo(tags),
    tipo: getTipo(tags),
    categoria: getCategoria(tags),
    lat,
    lon,
    tags,
  };
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    counts[row[field]] = (counts[row[field]] ?? 0) + 1;
    return counts;
  }, {});
}

function escapeSqlLiteral(value) {
  return String(value).replace(/'/g, "''");
}

function buildInsertSql(rows) {
  const values = rows
    .map(
      (row) =>
        `('${escapeSqlLiteral(row.source)}', '${escapeSqlLiteral(row.source_id)}', '${escapeSqlLiteral(row.nome)}', '${escapeSqlLiteral(row.tipo)}', '${escapeSqlLiteral(row.categoria)}', ${row.lat}, ${row.lon}, '{}'::jsonb)`
    )
    .join(',\n');

  return `
insert into public.equipamentos_publicos (source, source_id, nome, tipo, categoria, lat, lon, tags)
values
${values}
on conflict (source, source_id) do update set
  nome = excluded.nome,
  tipo = excluded.tipo,
  categoria = excluded.categoria,
  lat = excluded.lat,
  lon = excluded.lon,
  tags = excluded.tags,
  updated_at = now();
`.trim();
}

async function writeSqlChunks(rows, outputDir) {
  const absoluteDir = resolve(outputDir);
  await mkdir(absoluteDir, { recursive: true });

  for (let index = 0; index < rows.length; index += SQL_CHUNK_SIZE) {
    const batch = rows.slice(index, index + SQL_CHUNK_SIZE);
    const fileName = `equipamentos_publicos_${String(index / SQL_CHUNK_SIZE + 1).padStart(2, '0')}.sql`;
    await writeFile(join(absoluteDir, fileName), buildInsertSql(batch), 'utf8');
    console.log(`Wrote ${fileName} (${batch.length} rows)`);
  }
}

async function fetchFacilities() {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'AppBiT hackathon data enrichment (contact: no-country MVP)',
    },
    body: new URLSearchParams({ data: buildOverpassQuery() }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Overpass request failed: ${response.status} ${response.statusText}\n${details.slice(0, 1000)}`
    );
  }

  const payload = await response.json();
  return (payload.elements ?? []).map(toRow).filter(Boolean);
}

async function upsertRows(rows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from('equipamentos_publicos')
      .upsert(batch, { onConflict: 'source,source_id' });

    if (error) throw error;
    console.log(`Upserted ${Math.min(index + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

async function main() {
  const rows = await fetchFacilities();
  console.log(`Found ${rows.length} public facilities in Florianópolis.`);
  console.log('By category:', countBy(rows, 'categoria'));
  console.log('By type:', countBy(rows, 'tipo'));

  if (dryRun) {
    console.log('Dry run enabled: no database writes performed.');
    return;
  }

  if (sqlDir) {
    await writeSqlChunks(rows, sqlDir);
    console.log('SQL chunk generation completed: no database writes performed by this script.');
    return;
  }

  await upsertRows(rows);
  console.log('Ingestion completed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
