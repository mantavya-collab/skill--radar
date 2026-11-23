const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- Test (quiz) endpoint ----------
app.get('/api/quiz/:skill', (req, res) => {
  const skill = req.params.skill.toLowerCase();
  const quiz = require('./tests/quiz.json')[skill];
  if (!quiz) return res.status(404).json({error: 'No quiz for skill'});
  res.json(quiz);
});

// Submit quiz answers and get level tag
app.post('/api/quiz/:skill/submit', (req, res) => {
  const {answers} = req.body; // array of booleans (true=correct)
  const correct = answers.filter(Boolean).length;
  let tag = 'Beginner';
  if (correct >= 4) tag = 'Advanced';
  else if (correct >= 2) tag = 'Intermediate';
  res.json({tag});
});

// ---------- Student profile endpoints ----------
app.post('/api/student', (req, res) => {
  const {name,email,offers,interests,availability,level} = req.body;
  const id = db.addStudent({name,email,offers,interests,availability,level});
  res.json({id});
});

// Get matches for a given student id
app.get('/api/match/:id', (req, res) => {
  const id = Number(req.params.id);
  const student = db.getStudent(id);
  if (!student) return res.status(404).json({error: 'Student not found'});
  const matches = db.findMatches(student);
  res.json(matches);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
