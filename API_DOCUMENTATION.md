# 📚 QR Menu API Documentation

Base URL: `http://localhost:5000`

## 📑 Table of Contents
- [Authentication APIs](#authentication-apis)
- [Dashboard APIs](#dashboard-apis)
- [QR Code APIs](#qr-code-apis)
- [Error Responses](#error-responses)

---

## 🔐 Authentication APIs

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new restaurant owner

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@restaurant.com",
  "password": "password123",
  "phone": "1234567890",
  "restaurantName": "John's Diner"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@restaurant.com",
      "restaurantName": "John's Diner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Validation Rules:**
- `name`: Required, min 2 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters
- `phone`: Optional
- `restaurantName`: Optional

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Login existing user

**Request Body:**
```json
{
  "email": "john@restaurant.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@restaurant.com",
      "restaurantName": "John's Diner",
      "role": "owner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get current logged-in user details

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@restaurant.com",
      "restaurantName": "John's Diner",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 4. Update Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Update user profile

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "9876543210",
  "restaurantName": "John's Premium Diner",
  "restaurantAddress": "123 Main St, City",
  "restaurantDescription": "Best food in town"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Doe Updated",
      "restaurantName": "John's Premium Diner",
      ...
    }
  }
}
```

---

## 📊 Dashboard APIs

### 1. Get Dashboard Statistics

**Endpoint:** `GET /api/dashboard/stats`

**Description:** Get dashboard overview statistics

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalQRCodes": 10,
      "activeQRCodes": 8,
      "totalScans": 250,
      "recentScans": 45,
      "scanGrowth": "+18%",
      "todayOrders": 0,
      "todayRevenue": 0,
      "totalCustomers": 0
    }
  }
}
```

---

### 2. Get Recent Activity

**Endpoint:** `GET /api/dashboard/activity`

**Description:** Get recent QR code scan activity

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "activity": [
      {
        "id": "64abc...",
        "name": "Table 5 QR",
        "type": "table",
        "tableNumber": "5",
        "scans": 25,
        "lastScannedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get QR Summary

**Endpoint:** `GET /api/dashboard/qr-summary`

**Description:** Get summary of all QR codes

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "qrCodes": [
      {
        "id": "64abc...",
        "name": "Main Menu QR",
        "type": "global",
        "scans": 100,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 📱 QR Code APIs

### 1. Generate QR Code

**Endpoint:** `POST /api/qr/generate`

**Description:** Generate a new QR code

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Table 5 QR Code",
  "type": "table",
  "tableNumber": "5"
}
```

**OR for global QR:**
```json
{
  "name": "Main Menu QR",
  "type": "global"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "QR Code generated successfully",
  "data": {
    "qrCode": {
      "id": "64abc123...",
      "name": "Table 5 QR Code",
      "type": "table",
      "tableNumber": "5",
      "token": "550e8400-e29b-41d4-a716-446655440000",
      "url": "http://localhost:3000/m/johns-diner/q/550e8400...",
      "qrCodeData": "data:image/png;base64,iVBORw0KGgo...",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `name`: Required
- `type`: Required, must be 'global' or 'table'
- `tableNumber`: Required if type is 'table'

---

### 2. Get All QR Codes

**Endpoint:** `GET /api/qr`

**Description:** Get all QR codes for logged-in user

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "qrCodes": [
      {
        "id": "64abc...",
        "name": "Table 1 QR",
        "type": "table",
        "tableNumber": "1",
        "url": "http://localhost:3000/m/johns-diner/q/...",
        "qrCodeData": "data:image/png;base64,...",
        "scans": 50,
        "createdAt": "2024-01-10T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Single QR Code

**Endpoint:** `GET /api/qr/:id`

**Description:** Get details of a specific QR code

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": {
      "id": "64abc...",
      "name": "Table 5 QR",
      "type": "table",
      "tableNumber": "5",
      "url": "http://localhost:3000/m/johns-diner/q/...",
      "qrCodeData": "data:image/png;base64,...",
      "scans": 25,
      "lastScannedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. Delete QR Code

**Endpoint:** `DELETE /api/qr/:id`

**Description:** Delete (soft delete) a QR code

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "QR Code deleted successfully"
}
```

---

### 5. Track QR Scan (Public)

**Endpoint:** `POST /api/qr/scan/:token`

**Description:** Track when a QR code is scanned (public endpoint)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scan tracked successfully",
  "data": {
    "url": "http://localhost:3000/m/johns-diner/q/550e8400...",
    "tableNumber": "5"
  }
}
```

---

## ❌ Error Responses

### Common Error Formats

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Name is required, Email must be valid"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Not authorized to access this QR Code"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## 🧪 Postman Collection

### Quick Test Flow:

1. **Register:**
   ```
   POST http://localhost:5000/api/auth/register
   Body: {"name":"Test User","email":"test@test.com","password":"123456"}
   ```

2. **Login:**
   ```
   POST http://localhost:5000/api/auth/login
   Body: {"email":"test@test.com","password":"123456"}
   Copy the token from response
   ```

3. **Get Dashboard Stats:**
   ```
   GET http://localhost:5000/api/dashboard/stats
   Headers: Authorization: Bearer <your_token>
   ```

4. **Generate QR:**
   ```
   POST http://localhost:5000/api/qr/generate
   Headers: Authorization: Bearer <your_token>
   Body: {"name":"Table 1","type":"table","tableNumber":"1"}
   ```

5. **Get All QR Codes:**
   ```
   GET http://localhost:5000/api/qr
   Headers: Authorization: Bearer <your_token>
   ```

---

## 📝 Notes

- All protected routes require `Authorization: Bearer <token>` header
- Tokens expire in 7 days (configurable in .env)
- All timestamps are in ISO 8601 format
- QR code images are returned as base64 data URLs
- Soft delete is used for QR codes (isActive flag)

---

## 🖨️ Thermal Printer APIs

### 1. Get Printer Status

**Endpoint:** `GET /api/printer/status`

**Description:** Check if printer service is running

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_TOKEN"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Printer service is running",
  "status": "ready",
  "supportedTypes": ["usb", "network"],
  "timestamp": "2025-11-06T17:30:00.000Z"
}
```

---

### 2. Test Printer Connection

**Endpoint:** `POST /api/printer/test`

**Description:** Test thermal printer connection and print test receipt

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "type": "network",
  "connection": {
    "networkIp": "192.168.1.100",
    "networkPort": 9100
  }
}
```

**For USB Printer:**
```json
{
  "type": "usb",
  "connection": {
    "usbPort": "COM3"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Printer test successful",
  "printerInfo": {
    "type": "network",
    "status": "online",
    "connection": {
      "ip": "192.168.1.100",
      "port": 9100
    }
  },
  "timestamp": "2025-11-06T17:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Printer not connected. Check connection and try again.",
  "error": "Network printer not reachable at 192.168.1.100:9100",
  "code": "TEST_FAILED"
}
```

---

### 3. Print Bill

**Endpoint:** `POST /api/printer/print`

**Description:** Print customer bill to thermal printer

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "bill": {
    "id": "bill_abc123",
    "customerName": "John Doe",
    "customerPhone": "+91 98765 43210",
    "orders": [
      {
        "items": [
          {
            "name": "Butter Chicken",
            "price": 350,
            "quantity": 2
          },
          {
            "name": "Naan",
            "price": 40,
            "quantity": 4
          }
        ]
      }
    ],
    "subtotal": 860,
    "gst": {
      "enabled": true,
      "totalRate": 5,
      "cgstRate": 2.5,
      "sgstRate": 2.5,
      "total": 43,
      "cgst": 21.5,
      "sgst": 21.5,
      "showBreakdown": true
    },
    "totalAmount": 903,
    "itemCount": 6,
    "lastOrderDate": "2025-11-06T17:30:00.000Z",
    "restaurantInfo": {
      "name": "My Restaurant",
      "address": "Shop 12, MG Road, Mumbai - 400001",
      "phone": "+91 22 12345678",
      "gstNumber": "27XXXXX1234X1Z5"
    }
  },
  "printerSettings": {
    "type": "network",
    "connection": {
      "networkIp": "192.168.1.100",
      "networkPort": 9100
    }
  },
  "type": "billing"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bill printed successfully",
  "printerId": "billing",
  "timestamp": "2025-11-06T17:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Printer not connected or not found",
  "error": "USB printer not found at COM3",
  "code": "PRINT_ERROR"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Bill data is required"
}
```

---

### Printer Configuration Examples

#### USB Printer (Windows)
```json
{
  "type": "usb",
  "connection": {
    "usbPort": "COM3"
  }
}
```

#### USB Printer (Linux)
```json
{
  "type": "usb",
  "connection": {
    "usbPort": "/dev/usb/lp0"
  }
}
```

#### Network Printer (Ethernet/WiFi)
```json
{
  "type": "network",
  "connection": {
    "networkIp": "192.168.1.100",
    "networkPort": 9100
  }
}
```

---

### Supported Printer Types

- **USB Thermal Printers** (ESC/POS compatible)
- **Network Thermal Printers** (RAW 9100 port)
- 80mm thermal receipt printers
- Epson TM series
- Star TSP series
- Citizen CT series
- Generic ESC/POS printers

---

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `PRINT_ERROR` | General print failure | 500 |
| `TEST_FAILED` | Test print failed | 500 |
| `ECONNREFUSED` | Connection refused | 503 |
| `ETIMEDOUT` | Connection timeout | 504 |
| `PRINTER_NOT_FOUND` | Printer not detected | 404 |
| `INVALID_SETTINGS` | Invalid printer config | 400 |

---

## 🔗 Related Documentation

- [Thermal Printer Installation](../THERMAL_PRINTER_INSTALLATION.md)
- [Backend README](./README.md)
- [Frontend Documentation](../frontend/README.md)
