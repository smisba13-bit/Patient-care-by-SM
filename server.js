{
  "name": "patient-care-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1"
  }
}
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Ensure 'uploads' folder exists for storing prescription images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// In-Memory Mock Databases
const users = [];
const prescriptions = [];
const reminders = [];

// Configure Multer for Prescription Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Role-Based Access Control Middleware
const verifyRole = (requiredRole) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role']; 
        if (!userRole || userRole !== requiredRole) {
            return res.status(403).json({ 
                error: "Access Denied: You do not have permission to view this panel." 
            });
        }
        next();
    };
};

// =============================================================
// STEP 1: USER AUTHENTICATION & ROLE SYSTEM ROUTES
// =============================================================

app.post('/api/auth/send-otp', (req, res) => {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
        return res.status(400).json({ error: "Mobile number is required" });
    }
    console.log(`[OTP SERVICE] Sending OTP '1234' to ${mobileNumber}`);
    return res.status(200).json({ message: "OTP sent successfully. Use '1234' to verify." });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { mobileNumber, otp, role, employeeId } = req.body;

    if (otp !== "1234") {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    let user = users.find(u => u.mobileNumber === mobileNumber);

    if (!user) {
        if (role === 'pharmacist') {
            if (!employeeId) {
                return res.status(400).json({ error: "Employee ID is mandatory for Pharmacist login." });
            }
            user = { id: Date.now(), mobileNumber, role: 'pharmacist', employeeId };
        } else {
            user = { id: Date.now(), mobileNumber, role: 'patient' };
        }
        users.push(user);
    }

    return res.status(200).json({
        message: "Login successful",
        token: "mock-jwt-token-" + user.id,
        user: {
            id: user.id,
            mobileNumber: user.mobileNumber,
            role: user.role
        }
    });
});


// =============================================================
// STEP 2: PRESCRIPTION UPLOAD & PHARMACIST WORKSPACE ROUTES
// =============================================================

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
        status: "PENDING_VERIFICATION",
        dosageForm: null,
        createdAt: new Date().toLocaleString()
    };

    prescriptions.push(newPrescription);

    return res.status(201).json({
        message: "Prescription uploaded successfully and sent to Pharmacist workspace!",
        prescription: newPrescription
    });
});

app.get('/api/pharmacist/prescriptions', verifyRole('pharmacist'), (req, res) => {
    return res.status(200).json({
        total: prescriptions.length,
        prescriptions: prescriptions
    });
});

app.post('/api/pharmacist/approve-dosage', verifyRole('pharmacist'), (req, res) => {
    const { prescriptionId, medicineName, dosageForm, frequency, durationDays } = req.body;

    const rx = prescriptions.find(p => p.id === prescriptionId);
    if (!rx) {
        return res.status(404).json({ error: "Prescription not found." });
    }

    rx.status = "APPROVED";
    rx.dosageForm = {
        medicineName,
        dosageForm,
        frequency,
        durationDays,
        approvedAt: new Date().toLocaleString()
    };

    return res.status(200).json({
        message: "Dosage schedule created successfully and synced with AI Call/Reminder engine!",
        prescription: rx
    });
});


// =============================================================
// STEP 3: AI VOICE CALL & REMINDER ENGINE ROUTES
// =============================================================

app.post('/api/ai/trigger-call', (req, res) => {
    const { prescriptionId } = req.body;
    const rx = prescriptions.find(p => p.id === prescriptionId);

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
        aiAgentMessage: "Hello! This is your AI healthcare assistant. It is time to take your prescribed medicine after breakfast. Please confirm once taken.",
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

app.get('/api/ai/call-logs', (req, res) => {
    return res.status(200).json({
        totalCalls: reminders.length,
        logs: reminders
    });
});

// Start Server safely using process.env.PORT for cloud deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Healthcare Backend running on port ${PORT}`);
});
