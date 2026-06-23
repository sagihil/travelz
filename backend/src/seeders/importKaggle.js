/**
 * Kaggle CSV Import Script
 *
 * Dataset: "Top Tourist Attractions of the World"
 * Download from: https://www.kaggle.com/datasets/nitinatiwari/world-tourist-attractions
 * (or any similar dataset that contains NAME, CITY, COUNTRY, TYPE/CATEGORY, RATING columns)
 *
 * Place the CSV file at:  backend/seeders/kaggle_attractions.csv
 *
 * What this script does:
 *  1. Reads the CSV
 *  2. Extracts all unique TYPE values → inserts them into the interests table
 *  3. Maps each attraction's TYPE to a DB category
 *  4. Inserts all attractions into the attractions table
 *
 * Run: npm run db:import:kaggle
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const sequelize = require('../config/database');
require('../../models/associations');
const { Attraction, Interest } = require('../../models/associations');

const CSV_PATH = path.join(__dirname, 'kaggle_attractions.csv');

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines  = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    const obj = {};
    header.forEach((h, i) => { obj[h] = (cols[i] ?? '').replace(/^"|"$/g, '').trim(); });
    return obj;
  });
}

function pick(row, ...keys) {
  for (const k of keys) {
    const found = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase());
    if (found && row[found]) return row[found];
  }
  return '';
}

// Map Kaggle TYPE values to the DB category enum
function typeToCategory(type) {
  if (!type) return 'Landmark';
  const t = type.toLowerCase();
  if (t.includes('beach'))                                          return 'Beach';
  if (t.includes('museum'))                                         return 'Museum';
  if (t.includes('natur') || t.includes('park') || t.includes('wildlife') || t.includes('forest')) return 'Nature';
  if (t.includes('histor') || t.includes('ancient') || t.includes('ruin') || t.includes('heritage')) return 'History';
  if (t.includes('religio') || t.includes('temple') || t.includes('church') || t.includes('mosque') || t.includes('shrine')) return 'Religious';
  if (t.includes('architect') || t.includes('palace') || t.includes('castle'))                       return 'Architecture';
  if (t.includes('entertain') || t.includes('theme') || t.includes('adventure'))                     return 'Entertainment';
  if (t.includes('landmark') || t.includes('monument') || t.includes('tower') || t.includes('bridge')) return 'Landmark';
  return 'Landmark';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function importKaggle() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌  CSV not found at: ${CSV_PATH}\n`);
    console.error('Steps to use this script:');
    console.error('  1. Go to: https://www.kaggle.com/datasets/nitinatiwari/world-tourist-attractions');
    console.error('  2. Download the CSV file');
    console.error('  3. Rename it to "kaggle_attractions.csv"');
    console.error('  4. Place it at:  backend/seeders/kaggle_attractions.csv');
    console.error('  5. Run:          npm run db:import:kaggle\n');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    const raw  = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = parseCSV(raw);
    console.log(`📄  Parsed ${rows.length} rows from CSV.`);

    // ── Step 1: Extract unique TYPE values → seed as interests ───────────────
    const uniqueTypes = [...new Set(
      rows.map(r => pick(r, 'TYPE', 'Type', 'type', 'Category', 'category')).filter(Boolean)
    )];
    console.log(`🏷️   Found ${uniqueTypes.length} unique TYPE values: ${uniqueTypes.join(', ')}`);

    let interestCount = 0;
    for (const typeName of uniqueTypes) {
      const [, created] = await Interest.findOrCreate({ where: { name: typeName } });
      if (created) interestCount++;
    }
    console.log(`✓  ${interestCount} new interests inserted (${uniqueTypes.length - interestCount} already existed).`);

    // ── Step 2: Build attraction records ─────────────────────────────────────
    const records = rows
      .map(row => ({
        name:        pick(row, 'Name', 'Attraction Name', 'attraction_name', 'Title', 'ATTRACTION'),
        city:        pick(row, 'City', 'city', 'CITY', 'Location'),
        country:     pick(row, 'Country', 'country', 'COUNTRY'),
        category:    typeToCategory(pick(row, 'TYPE', 'Type', 'type', 'Category', 'category')),
        description: pick(row, 'Description', 'Details', 'description', 'About', 'DESCRIPTION').substring(0, 500),
        rating:      parseFloat(pick(row, 'Rating', 'rating', 'Score', 'RATING')) || 4.0,
        imageUrl:    pick(row, 'Image', 'imageUrl', 'image_url', 'Photo', 'Img', 'IMAGE'),
      }))
      .filter(r => r.name && r.country);

    // ── Step 3: Clear existing attractions and bulk-insert ───────────────────
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Attraction.destroy({ truncate: true, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    await Attraction.bulkCreate(records, { ignoreDuplicates: true });
    console.log(`✓  Imported ${records.length} attractions from Kaggle CSV.`);
    console.log('\n🌍  Kaggle import complete!');
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

importKaggle();
