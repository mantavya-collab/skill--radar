const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'skillradar.db');
const db = new Database(dbPath);

// Initialize tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  offers TEXT NOT NULL,          -- comma‑separated list of skills the student can teach
  interests TEXT NOT NULL,       -- comma‑separated list of skills the student wants to learn
  availability TEXT NOT NULL,   -- e.g., "Mon 9-12,Wed 14-18"
  level TEXT NOT NULL            -- Beginner / Intermediate / Advanced
);
`);

function addStudent({name,email,offers,interests,availability,level}) {
  const stmt = db.prepare(`INSERT INTO students (name,email,offers,interests,availability,level)
    VALUES (?,?,?,?,?,?)`);
  const info = stmt.run(name,email,offers,interests,availability,level);
  return info.lastInsertRowid;
}

function getStudent(id) {
  return db.prepare('SELECT * FROM students WHERE id = ?').get(id);
}

function parseHours(availStr) {
  // Simple parser: split by commas, then each slot like "Mon 9-12"
  const map = {};
  availStr.split(',').forEach(slot => {
    const parts = slot.trim().split(' ');
    if (parts.length !== 2) return;
    const day = parts[0];
    const range = parts[1];
    const [start, end] = range.split('-').map(Number);
    if (!isNaN(start) && !isNaN(end)) {
      map[day] = (map[day] || 0) + Math.max(0, end - start);
    }
  });
  return map; // {Mon:3, Wed:4, ...}
}

function overlapHours(a1, a2) {
  const h1 = parseHours(a1);
  const h2 = parseHours(a2);
  let total = 0;
  for (const day of Object.keys(h1)) {
    if (h2[day]) total += Math.min(h1[day], h2[day]);
  }
  return total; // simple total overlapping hours per week
}

function findMatches(student) {
  const all = db.prepare('SELECT * FROM students WHERE id != ?').all(student.id);
  const matches = [];
  all.forEach(other => {
    // skill interest / offer match
    const offersSet = new Set(other.offers.split(','));
    const interestsSet = new Set(student.interests.split(','));
    const skillMatch = [...offersSet].some(s => interestsSet.has(s.trim())) ? 2 : 0;

    // level similarity
    let levelScore = 0;
    if (other.level === student.level) levelScore = 2;
    else if (
      (other.level === 'Beginner' && student.level === 'Intermediate') ||
      (other.level === 'Intermediate' && (student.level === 'Beginner' || student.level === 'Advanced')) ||
      (other.level === 'Advanced' && student.level === 'Intermediate')
    ) levelScore = 1;

    // availability overlap (grade 0‑5)
    const overlap = overlapHours(student.availability, other.availability);
    const availScore = Math.min(5, Math.floor(overlap / 2)); // 2 hrs = 1 point, max 5

    const totalScore = skillMatch + levelScore + availScore;
    if (totalScore > 0) {
      matches.push({
        id: other.id,
        name: other.name,
        email: other.email,
        offers: other.offers,
        interests: other.interests,
        availability: other.availability,
        level: other.level,
        overlapHours: overlap,
        totalScore
      });
    }
  });

  // sort descending by totalScore, then by overlapHours
  matches.sort((a,b)=> b.totalScore - a.totalScore || b.overlapHours - a.overlapHours);
  return matches;
}

module.exports = {addStudent, getStudent, findMatches};
