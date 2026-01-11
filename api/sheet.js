const { authorize } = require('./_helpers');
const { google } = require('googleapis');

module.exports = async (req, res) => {
  try {
    const sheetId = req.query.sheetId;
    if (!sheetId) return res.status(400).send('Missing sheetId');

    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    if (req.query.metadata === 'true') {
      const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const sheetNames = (response.data.sheets || []).map(s => s.properties.title);
      return res.json(sheetNames);
    }

    const range = req.query.range || 'Sheet1';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    return res.json(response.data.values || []);
  } catch (err) {
    console.error('Error in /api/sheets', err);
    res.status(500).send('Error fetching sheet data: ' + err.message);
  }
};
