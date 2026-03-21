const express = require('express');
const cors = require('cors');
const tz = require('./timezone');

const app = express();
const PORT = process.env.PORT || 4800;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'timezone-api', version: '1.0.0',
    endpoints: [
      'GET /api/v1/now/:timezone', 'GET /api/v1/convert',
      'POST /api/v1/world-clock', 'POST /api/v1/meeting-planner', 'GET /api/v1/zones',
    ],
  });
});

app.get('/api/v1/now/:timezone', (req, res) => {
  try { res.json(tz.now(req.params.timezone)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/v1/convert', (req, res) => {
  try {
    const { datetime, from, to } = req.query;
    if (!datetime || !from || !to) return res.status(400).json({ error: 'datetime, from, to required' });
    res.json(tz.convert(datetime, from, to));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/v1/world-clock', (req, res) => {
  const zones = req.body.zones || ['UTC', 'EST', 'PST', 'KST', 'JST', 'CET'];
  res.json({ count: zones.length, clocks: tz.worldClock(zones) });
});

app.post('/api/v1/meeting-planner', (req, res) => {
  const { zones, workHours } = req.body;
  if (!zones) return res.status(400).json({ error: 'zones array required' });
  res.json(tz.meetingPlanner(zones, workHours));
});

app.get('/api/v1/zones', (req, res) => { res.json(tz.listZones()); });

app.listen(PORT, () => console.log(`timezone-api running on http://localhost:${PORT}`));
