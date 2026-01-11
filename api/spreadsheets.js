const { authorize } = require('./_helpers');
const { google } = require('googleapis');

module.exports = async (req, res) => {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)'
    });
    res.json(response.data.files || []);
  } catch (err) {
    console.error('Error in /api/spreadsheets', err);
    res.status(500).send('Error fetching spreadsheets: ' + err.message);
  }
};
