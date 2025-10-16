// MongoDB initialization script
db = db.getSiblingDB('praanacare');

// Create collections
db.createCollection('users');
db.createCollection('patients');
db.createCollection('doctors');
db.createCollection('employers');
db.createCollection('vitals');
db.createCollection('alerts');
db.createCollection('chats');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.patients.createIndex({ userId: 1 }, { unique: true });
db.patients.createIndex({ employeeId: 1 }, { unique: true });
db.patients.createIndex({ department: 1 });
db.patients.createIndex({ isActive: 1 });

db.doctors.createIndex({ userId: 1 }, { unique: true });
db.doctors.createIndex({ licenseNumber: 1 }, { unique: true });
db.doctors.createIndex({ specialization: 1 });

db.employers.createIndex({ userId: 1 }, { unique: true });
db.employers.createIndex({ companyName: 1 });

db.vitals.createIndex({ patientId: 1, timestamp: -1 });
db.vitals.createIndex({ timestamp: -1 });
db.vitals.createIndex({ isEmergency: 1 });

db.alerts.createIndex({ patientId: 1, status: 1 });
db.alerts.createIndex({ type: 1, severity: 1 });
db.alerts.createIndex({ createdAt: -1 });
db.alerts.createIndex({ status: 1 });

db.chats.createIndex({ patientId: 1, status: 1 });
db.chats.createIndex({ createdAt: -1 });
db.chats.createIndex({ priority: 1, status: 1 });

print('PraanaCare database initialized successfully!');
