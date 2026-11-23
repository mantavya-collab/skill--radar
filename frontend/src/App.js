import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Table, Modal, Badge, Navbar, Card, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import '../styles/custom.css';

// Backend URL – adjust if you changed the port
const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [step, setStep] = useState('form'); // form | quiz | confirm | results
  const [studentId, setStudentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    offers: '',          // comma‑separated list of skills you can teach
    interests: '',       // comma‑separated list of skills you want to learn
    availability: ''    // e.g. "Mon 9-12,Wed 14-18"
  });
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [levelTag, setLevelTag] = useState('');
  const [matches, setMatches] = useState([]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ---------- Quiz handling -------------------------------------------------
  const startQuiz = async () => {
    // Pick the first skill listed in the interests field as the quiz subject
    const skill = formData.interests.split(',')[0]?.trim().toLowerCase();
    if (!skill) {
      alert('Please enter at least one skill you want to learn before starting the quiz.');
      return;
    }
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/quiz/${skill}`);
      const q = resp.data;
      // Flatten easy/medium/hard into a single ordered array
      const ordered = [...q.easy, ...q.medium, ...q.hard];
      setQuiz({ skill, questions: ordered });
      setAnswers(new Array(ordered.length).fill(null));
      setStep('quiz');
    } catch (err) {
      alert('No quiz available for the selected skill ("' + skill + '").');
    }
  };

  const submitQuiz = async () => {
    // Convert selected option indices to booleans (true = correct answer)
    const correct = quiz.questions.map((q, i) => q.a === answers[i]);
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/quiz/${quiz.skill}/submit`, { answers: correct });
      setLevelTag(resp.data.tag);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Student registration & match ---------------------------------
  const submitStudent = async () => {
    const payload = {
      ...formData,
      offers: formData.offers,
      interests: formData.interests,
      availability: formData.availability,
      level: levelTag
    };
    const resp = await axios.post(`${BACKEND_URL}/api/student`, payload);
    setStudentId(resp.data.id);
    // Pull matches for the newly created student
    const matchesResp = await axios.get(`${BACKEND_URL}/api/match/${resp.data.id}`);
    setMatches(matchesResp.data);
    setStep('results');
  };

  // ---------- Rendering helpers --------------------------------------------
  const renderForm = () => (
    <Card className="mx-auto" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" placeholder="Jane Doe" value={formData.name} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="offers">
            <Form.Label>Skills you can teach (comma separated)</Form.Label>
            <Form.Control name="offers" placeholder="frontend,react" value={formData.offers} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="interests">
            <Form.Label>Skills you want to learn (comma separated)</Form.Label>
            <Form.Control name="interests" placeholder="backend,python" value={formData.interests} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="availability">
            <Form.Label>Availability (e.g. "Mon 9-12,Wed 14-18")</Form.Label>
            <Form.Control name="availability" placeholder="Mon 9-12,Wed 14-18" value={formData.availability} onChange={handleChange} />
          </Form.Group>
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={startQuiz}>Start Skill Test</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderQuiz = () => (
    <Modal show={true} onHide={() => setStep('form')} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Quiz – {quiz.skill.charAt(0).toUpperCase() + quiz.skill.slice(1)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Progress bar */}
        <ProgressBar now={(answers.filter(a => a !== null).length / quiz.questions.length) * 100} className="mb-3" />
        <Form>
          {quiz.questions.map((q, idx) => (
            <Form.Group key={idx} className="mb-4">
              <Form.Label><strong>{idx + 1}. {q.q}</strong></Form.Label>
              {q.options.map((opt, oIdx) => (
                <Form.Check
                  type="radio"
                  name={`q${idx}`}
                  key={oIdx}
                  id={`q${idx}_opt${oIdx}`}
                  label={opt}
                  checked={answers[idx] === oIdx}
                  onChange={() => setAnswers(prev => {
                    const copy = [...prev];
                    copy[idx] = oIdx;
                    return copy;
                  })}
                />
              ))}
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setStep('form')}>Cancel</Button>
        <Button variant="success" disabled={answers.includes(null)} onClick={async () => {
          await submitQuiz();
          setStep('confirm');
        }}>Submit Answers</Button>
      </Modal.Footer>
    </Modal>
  );

  const renderConfirm = () => (
    <Card className="mx-auto" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <p>Your assessed level: <Badge bg="info" className="fs-5">{levelTag}</Badge></p>
        <div className="d-grid gap-2 mt-3">
          <Button variant="primary" onClick={submitStudent}>Register &amp; See Matches</Button>
          <Button variant="outline-secondary" onClick={() => setStep('form')}>Edit Information</Button>
        </div>
      </Card.Body>
    </Card>
  );

  const getRowClass = overlap => {
    if (overlap >= 8) return 'match-high';
    if (overlap >= 4) return 'match-medium';
    return 'match-low';
  };

  const renderResults = () => (
    <>
      <h4 className="text-center mb-4">Matches (sorted by relevance)</h4>
      <Table striped bordered hover responsive className="mx-auto" style={{ maxWidth: '950px' }}>
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Offers</th>
            <th>Interests</th>
            <th>Level</th>
            <th>Availability</th>
            <th>Overlap (hrs)</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.id} className={getRowClass(m.overlapHours)}>
              <td>{m.name}</td>
              <td>{m.offers}</td>
              <td>{m.interests}</td>
              <td>{m.level}</td>
              <td>{m.availability}</td>
              <td>{m.overlapHours}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  return (
    <>
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand href="#">Skill Radar System</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mb-5">
        <Row className="justify-content-center">
          <Col xs={12} className="d-flex flex-column align-items-center">
            {step === 'form' && renderForm()}
            {step === 'quiz' && renderQuiz()}
            {step === 'confirm' && renderConfirm()}
            {step === 'results' && renderResults()}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
