import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

const API_URL = process.env.REACT_APP_API_URL;

function DonorsTable() {
  const [donors, setDonors] = useState([]);
  const [processing, setProcessing] = useState({});
  const [snack, setSnack] = useState(null);
  const pollRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(10);

  // ---------------------------
  // FETCH DONORS
  // ---------------------------
  async function fetchDonors() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch donors");
      const data = await res.json();
      setDonors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setSnack({ severity: "error", message: "Could not fetch donors." });
    }
  }

  useEffect(() => {
    fetchDonors();
    pollRef.current = setInterval(fetchDonors, 20000);
    return () => clearInterval(pollRef.current);
  }, []);

  // ---------------------------
  // GENERATE PDF
  // ---------------------------
  async function generatePdf(row) {
    const key = `${row.Serial_No}_${row.Date}_${row.Name}`;
    setProcessing((prev) => ({ ...prev, [key]: true }));

    try {
      const payload = {
        Serial_No: row.Serial_No,
        Date: row.Date,
        Name: row.Name,
        Address: row.Address || "",
        Amount: row.Amount || "",
        Amount_in_words: row.Amount_in_words || "",
        PAN: row.PAN || "",
      };

      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });

      setSnack({
        severity: "success",
        message: "PDF generated successfully!",
      });

      await markAsProcessed(row);
      await fetchDonors();
    } catch (err) {
      console.error("PDF Error:", err);
      setSnack({ severity: "error", message: "Error generating PDF" });
    } finally {
      setProcessing((prev) => ({ ...prev, [key]: false }));
    }
  }

  // ---------------------------
  // MARK PROCESSED
  // ---------------------------
  async function markAsProcessed(row) {
    try {
      const payload = {
        function: "markAsProcessed",
        serialNo: row.Serial_No,
        date: row.Date,
        name: row.Name,
      };
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("Failed to mark as processed:", err);
    }
  }

  return (
    // <Grid maxWidth={"xl"} margin="auto">
    <Box p={2}>
      {/* Header */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: "900",
          mb: 3,
          textAlign: "center",
          color: "#5e35b1",
          letterSpacing: "1px",
        }}
      >
        Donors List
      </Typography>

      {/* Card Container */}
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: "16px",
          background: "white",
          border: "2px solid #d81b60",
        }}
      >
        <Table sx={{ borderRadius: "12px", overflow: "hidden" }}>
          <TableHead>
            <TableRow
              sx={{
                background: "#d81b60",
              }}
            >
              {[
                "Serial No",
                "Date",
                "Name",
                "Address",
                "Amount",
                "PAN",
                "Action",
              ].map((head) => (
                <TableCell
                  key={head}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {donors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  No donors found.
                </TableCell>
              </TableRow>
            ) : (
              donors.slice(0, visibleCount).map((d, idx) => {
                const key = `${d.Serial_No}_${d.Date}_${d.Name}`;
                return (
                  <TableRow
                    key={key || idx}
                    sx={{
                      "&:hover": {
                        background: "#EDE7F6",
                        transition: "0.3s",
                      },
                    }}
                  >
                    <TableCell>{d.Serial_No}</TableCell>
                    <TableCell>
                      {new Date(d.Date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{d.Name}</TableCell>
                    <TableCell
                      sx={{ whiteSpace: "normal", lineHeight: "20px" }}
                      dangerouslySetInnerHTML={{
                        __html: (d.Address || "-").replace(/,/g, ",<br/>"),
                      }}
                    />

                    <TableCell>{d.Amount || "-"}</TableCell>
                    <TableCell>{d.PAN || "-"}</TableCell>

                    <TableCell>
                      <Button
                        variant="contained"
                        onClick={() => generatePdf(d)}
                        disabled={processing[key]}
                        sx={{
                          background: "#7b4adfff",
                          "&:hover": { background: "#5e35b1" },
                          borderRadius: "10px",
                          px: 2,
                          py: 0.7,
                        }}
                      >
                        {processing[key] ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          "Generate PDF"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {donors.length > visibleCount && (
          <Box textAlign="center" mt={2}>
            <Button
              variant="contained"
              sx={{
                background: "#d81b60",
                ":hover": { background: "#c21756ff" },
                paddingX: 4,
                paddingY: 1,
                borderRadius: "8px",
                fontWeight: "bold",
              }}
              onClick={() => setVisibleCount(prev => prev + 10)}
            >
              Show More
            </Button>
          </Box>
        )}

      </Paper>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
      >
        {snack && (
          <Alert severity={snack.severity} onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
    // </Grid>
  );
}

export default DonorsTable;
