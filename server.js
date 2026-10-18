<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Care by SM</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f7f6; }
        .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 400px; margin: auto; }
        h1 { color: #007BFF; }
        button { background: #28a745; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Patient Care App</h1>
        <p>Welcome to Patient Care system by SM.</p>
        <button onclick="alert('Welcome! App is online.')">Get Started</button>
    </div>
</body>
</html>
import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [role, setRole] = useState('patient'); // 'patient' or 'pharmacist'
    const [employeeId, setEmployeeId] = useState('');
    const [step, setStep] = useState(1); // Step 1: Enter Mobile, Step 2: Enter OTP
    const [message, setMessage] = useState('');

    // 1. Send OTP Handler
    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("OTP sent! Use '1234' to verify.");
                setStep(2);
            } else {
                setMessage(data.error);
            }
        } catch (err) {
            setMessage("Failed to connect to server.");
        }
    };

    // 2. Verify OTP Handler
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, otp, role, employeeId })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Login Successful!");
                onLoginSuccess(data.user); // Pass user details to main app router
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Verification failed.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>HealthApp Secure Login</h2>
            
            {/* Role Selection Tabs */}
            <div style={{ marginBottom: '20px' }}>
                <label>Select Role: </label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '5px', marginLeft: '10px' }}>
                    <option value="patient">Patient</option>
                    <option value="pharmacist">Pharmacist</option>
                </select>
            </div>

            {step === 1 ? (
                <form onSubmit={handleSendOtp}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Mobile Number:</label><br />
                        <input 
                            type="text" 
                            value={mobileNumber} 
                            onChange={(e) => setMobileNumber(e.target.value)} 
                            placeholder="Enter mobile number" 
                            required 
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>

                    {role === 'pharmacist' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>Employee ID:</label><br />
                            <input 
                                type="text" 
                                value={employeeId} 
                                onChange={(e) => setEmployeeId(e.target.value)} 
                                placeholder="Enter Employee ID" 
                                required 
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>
                    )}

                    <button type="submit" style={{ width: '100%', padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Get OTP
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp}>
                    <p style={{ color: 'green' }}>{message}</p>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Enter OTP (Hint: 1234):</label><br />
                        <input 
                            type="text" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            placeholder="Enter 4-digit OTP" 
                            required 
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '10px', background: '#28A745', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Verify & Login
                    </button>
                </form>
            )}
        </div>
    );
}

export default Login;
// Step 2 Backend Routes - Add inside server.js

const multer = require('multer');
const path = require('path');

// Configure Multer for File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database for Prescriptions
const prescriptions = [];

// -------------------------------------------------------------
// 1. Patient Route: Upload Prescription
// -------------------------------------------------------------
app.post('/api/patient/upload-prescription', upload.single('prescriptionImage'), (req, res) => {
    const { patientMobile, notes } = req.body;

    if (!patientMobile) {
        return res.status(400).json({ error: "Patient mobile number is required." });
    }

    const newPrescription = {
        id: "RX-" + Date.now(),
        patientMobile: patientMobile,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/300x200?text=Prescription+Image",
        notes: notes || "No additional notes",
        status: "PENDING_VERIFICATION", // PENDING_VERIFICATION -> APPROVED -> ACTIVE
        dosageForm: null,
        createdAt: new Date().toLocaleString()
    };

    prescriptions.push(newPrescription);

    return res.status(201).json({
        message: "Prescription uploaded successfully and sent to Pharmacist workspace!",
        prescription: newPrescription
    });
});

// -------------------------------------------------------------
// 2. Pharmacist Route: Get All Pending Prescriptions Queue
// -------------------------------------------------------------
app.get('/api/pharmacist/prescriptions', verifyRole('pharmacist'), (req, res) => {
    return res.status(200).json({
        total: prescriptions.length,
        prescriptions: prescriptions
    });
});

// -------------------------------------------------------------
// 3. Pharmacist Route: Process & Approve Dosage Schedule
// -------------------------------------------------------------
app.post('/api/pharmacist/approve-dosage', verifyRole('pharmacist'), (req, res) => {
    const { prescriptionId, medicineName, dosageForm, frequency, durationDays } = req.body;

    const rx = prescriptions.find(p => p.id === prescriptionId);

    if (!rx) {
        return res.status(404).json({ error: "Prescription not found." });
    }

    // Set Dosage Schedule
    rx.status = "APPROVED";
    rx.dosageForm = {
        medicineName,
        dosageForm, // e.g., "Tablet", "Syrup"
        frequency,  // e.g., "Daily 8 AM, 9 PM"
        durationDays, // e.g., 7
        approvedAt: new Date().toLocaleString()
    };

    return res.status(200).json({
        message: "Dosage schedule created successfully and synced with AI Call/Reminder engine!",
        prescription: rx
    });
});
import React, { useState, useEffect } from 'react';

export default function Step2PrescriptionModule({ currentUser }) {
    // ---------------------------------------------------------
    // PATIENT STATE & HANDLERS
    // ---------------------------------------------------------
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a prescription image file.");
            return;
        }

        const formData = new FormData();
        formData.append('prescriptionImage', file);
        formData.append('patientMobile', currentUser.mobileNumber);
        formData.append('notes', notes);

        try {
            const response = await fetch('http://localhost:3000/api/patient/upload-prescription', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setUploadStatus('✅ Prescription uploaded successfully! Sent to Pharmacist.');
                setFile(null);
                setNotes('');
            } else {
                setUploadStatus('❌ Upload failed: ' + data.error);
            }
        } catch (err) {
            setUploadStatus('❌ Network error while uploading.');
        }
    };

    // ---------------------------------------------------------
    // PHARMACIST STATE & HANDLERS
    // ---------------------------------------------------------
    const [queue, setQueue] = useState([]);
    const [selectedRx, setSelectedRx] = useState(null);
    const [dosage, setDosage] = useState({
        medicineName: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        frequency: 'Morning 8:00 AM, Night 9:00 PM',
        durationDays: 7
    });

    const fetchQueue = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/pharmacist/prescriptions', {
                headers: { 'x-user-role': 'pharmacist' }
            });
            const data = await response.json();
            if (response.ok) {
                setQueue(data.prescriptions || []);
            }
        } catch (err) {
            console.error("Failed to load queue");
        }
    };

    useEffect(() => {
        if (currentUser.role === 'pharmacist') {
            fetchQueue();
        }
    }, [currentUser]);

    const handleApproveDosage = async (e) => {
        e.preventDefault();
        if (!selectedRx) return;

        try {
            const response = await fetch('http://localhost:3000/api/pharmacist/approve-dosage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': 'pharmacist'
                },
                body: JSON.stringify({
                    prescriptionId: selectedRx.id,
                    ...dosage
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Dosage Schedule Approved and Saved!");
                setSelectedRx(null);
                fetchQueue(); // Refresh queue
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to submit dosage.");
        }
    };

    // ---------------------------------------------------------
    // VIEW 1: PATIENT UI
    // ---------------------------------------------------------
    if (currentUser.role === 'patient') {
        return (
            <div style={containerStyle}>
                <h2>📋 Patient Workspace: Upload Prescription</h2>
                <form onSubmit={handleFileUpload}>
                    <div style={{ marginBottom: '15px' }}>
                        <label><b>Select Prescription Photo/PDF:</b></label><br />
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setFile(e.target.files[0])} 
                            style={{ marginTop: '10px' }} 
                            required 
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label><b>Additional Notes / Symptoms:</b></label><br />
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            placeholder="e.g., Fever for 3 days, headache" 
                            rows="3" 
                            style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                        />
                    </div>
                    <button type="submit" style={btnStylePrimary}>
                        Submit to Pharmacist
                    </button>
                </form>
                {uploadStatus && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{uploadStatus}</p>}
            </div>
        );
    }

    // ---------------------------------------------------------
    // VIEW 2: PHARMACIST WORKSPACE UI
    // ---------------------------------------------------------
    if (currentUser.role === 'pharmacist') {
        return (
            <div style={containerStyle}>
                <h2>👨‍⚕️ Pharmacist Verification Workspace</h2>
                <p>Employee ID Active | Review uploaded prescriptions & assign AI Call schedules.</p>
                
                <button onClick={fetchQueue} style={btnStyleSecondary}>🔄 Refresh Queue</button>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                    {/* Prescription List */}
                    <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: '15px' }}>
                        <h3>Prescription Queue ({queue.length})</h3>
                        {queue.length === 0 ? <p>No pending prescriptions.</p> : null}
                        {queue.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedRx(item)}
                                style={{
                                    padding: '10px',
                                    marginBottom: '10px',
                                    border: selectedRx?.id === item.id ? '2px solid #007BFF' : '1px solid #ccc',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    background: item.status === 'APPROVED' ? '#e6ffe6' : '#fff'
                                }}
                            >
                                <b>ID: {item.id}</b><br />
                                <small>Patient: {item.patientMobile}</small><br />
                                <span>Status: <b>{item.status}</b></span>
                            </div>
                        ))}
                    </div>

                    {/* Verification & Dosage Form Panel */}
                    <div style={{ flex: 1.5 }}>
                        <h3>Process & Set AI Schedule</h3>
                        {selectedRx ? (
                            <form onSubmit={handleApproveDosage} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
                                <p><b>Patient Mobile:</b> {selectedRx.patientMobile}</p>
                                <p><b>Patient Notes:</b> {selectedRx.notes}</p>
                                
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Medicine Name:</label>
                                    <input 
                                        type="text" 
                                        value={dosage.medicineName} 
                                        onChange={(e) => setDosage({...dosage, medicineName: e.target.value})} 
                                        style={inputStyle} required 
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Dose Form (Tablet/Syrup/Capsule):</label>
                                    <input 
                                        type="text" 
                                        value={dosage.dosageForm} 
                                        onChange={(e) => setDosage({...dosage, dosageForm: e.target.value})} 
                                        style={inputStyle} required 
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Frequency / Times:</label>
                                    <input 
                                        type="text" 
                                        value={dosage.frequency} 
                                        onChange={(e) => setDosage({...dosage, frequency: e.target.value})} 
                                        style={inputStyle} required 
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label>Duration (Days):</label>
                                    <input 
                                        type="number" 
                                        value={dosage.durationDays} 
                                        onChange={(e) => setDosage({...dosage, durationDays: e.target.value})} 
                                        style={inputStyle} required 
                                    />
                                </div>

                                <button type="submit" style={btnStyleSuccess}>
                                    Approve & Sync with AI Engine
                                </button>
                            </form>
                        ) : (
                            <p style={{ color: '#777' }}>Select a prescription from the left queue to verify.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// Inline Styling
const containerStyle = { maxWidth: '900px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' };
const inputStyle = { width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' };
const btnStylePrimary = { padding: '10px 20px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnStyleSecondary = { padding: '6px 12px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnStyleSuccess = { padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' };
// -------------------------------------------------------------
// Step 3: AI Voice Call & Reminder Trigger Engine
// -------------------------------------------------------------

// Active Reminders Database
const reminders = [];

// 1. Trigger AI Call Route (Can be called by a Cron Job or Manual Button)
app.post('/api/ai/trigger-call', (req, res) => {
    const { prescriptionId } = req.body;

    // Find prescription
    const rx = prescriptions ? prescriptions.find(p => p.id === prescriptionId) : null;

    // Simulated AI Voice Call Payload (In production, integrate Twilio, Vapi, or Retell AI here)
    const callLog = {
        callId: "CALL-" + Date.now(),
        prescriptionId: prescriptionId || "RX-DEMO",
        targetNumber: rx ? rx.patientMobile : "+919876543210",
        medicineDetails: rx && rx.dosageForm ? rx.dosageForm : {
            medicineName: "Paracetamol 650mg",
            dosageForm: "Tablet",
            frequency: "Morning 8:00 AM, Night 9:00 PM"
        },
        status: "COMPLETED",
        aiAgentMessage: "Hello! This is your AI healthcare assistant. It is time to take your prescribed medicine: Paracetamol Tablet after breakfast. Please confirm once taken.",
        timestamp: new Date().toLocaleString()
    };

    reminders.push(callLog);

    console.log(`[AI VOICE ENGINE] 📞 Calling patient at ${callLog.targetNumber}... Message: "${callLog.aiAgentMessage}"`);

    return res.status(200).json({
        success: true,
        message: "AI Voice Call triggered successfully!",
        callDetails: callLog
    });
});

// 2. Get Call Logs History Route
app.get('/api/ai/call-logs', (req, res) => {
    return res.status(200).json({
        totalCalls: reminders.length,
        logs: reminders
    });
});
import React, { useState, useEffect } from 'react';

export default function Step3AIEngine({ currentUser }) {
    const [callLogs, setCallLogs] = useState([]);
    const [triggerStatus, setTriggerStatus] = useState('');

    const fetchCallLogs = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/ai/call-logs');
            const data = await response.json();
            if (response.ok) {
                setCallLogs(data.logs || []);
            }
        } catch (err) {
            console.error("Failed to fetch AI call logs");
        }
    };

    useEffect(() => {
        fetchCallLogs();
    }, []);

    const handleTestAICall = async (prescriptionId) => {
        try {
            setTriggerStatus('🤖 AI Voice Agent is dialing patient...');
            const response = await fetch('http://localhost:3000/api/ai/trigger-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prescriptionId })
            });
            const data = await response.json();
            if (response.ok) {
                setTriggerStatus('✅ AI Voice Call completed successfully! Check console logs.');
                fetchCallLogs();
            } else {
                setTriggerStatus('❌ Call trigger failed.');
            }
        } catch (err) {
            setTriggerStatus('❌ Network error during AI trigger.');
        }
    };

    return (
        <div style={containerStyle}>
            <h2>🤖 Step 3: AI Voice Call & Reminder Engine</h2>
            <p>Automated system that calls patients at their scheduled medicine times.</p>

            <div style={{ margin: '20px 0', padding: '15px', background: '#f1f8ff', borderRadius: '5px' }}>
                <h3>Quick Test Panel</h3>
                <p>Simulate an instant outbound AI voice call to test the reminder system:</p>
                <button onClick={() => handleTestAICall("RX-DEMO")} style={btnStylePrimary}>
                    📞 Trigger Test AI Voice Call Now
                </button>
                {triggerStatus && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{triggerStatus}</p>}
            </div>

            <h3>📜 AI Voice Call Logs & History</h3>
            {callLogs.length === 0 ? (
                <p>No AI calls triggered yet.</p>
            ) : (
                callLogs.map((log) => (
                    <div key={log.callId} style={cardStyle}>
                        <b>Call ID: {log.callId}</b> | <span style={{ color: 'green' }}>{log.status}</span><br />
                        <small>Target Number: {log.targetNumber} | Time: {log.timestamp}</small>
                        <p style={{ background: '#fff', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            <b>AI Spoken Message:</b> "{log.aiAgentMessage}"
                        </p>
                    </div>
                ))
            )}
        </div>
    );
}

// Inline Styles
const containerStyle = { maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' };
const btnStylePrimary = { padding: '10px 20px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const cardStyle = { background: '#f9f9f9', padding: '12px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' };
