import { google } from "googleapis";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Load environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || "Penny";

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({ error: "Missing Google API credentials" });
    }

    // 2. Authenticate with JWT
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // 3. Get values from request body
    const { values } = req.body;
    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: "Invalid request body, expected { values: [] }" });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Appending to sheet:", { spreadsheetId, sheetName, values });
    }

    // 4. Append values to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // allow flexible columns
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return res.status(200).json({ message: "Data added successfully" });

  } catch (err) {
    console.error("Error appending to sheet:", err.errors || err.message);
    return res.status(500).json({
      error: "Failed to add data to sheet",
      details: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
}
