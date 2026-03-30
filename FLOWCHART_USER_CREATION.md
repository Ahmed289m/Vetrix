# 📊 نظام إنشاء المستخدمين - الرسم التوضيحي

## 🔄 دورة إنشاء المستخدم

```
┌─────────────────────────────────────┐
│   Frontend Request                  │
│  (fullname, phone, role, clinic_id) │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Validation & Authorization        │
│  ✓ Check Permissions                │
│  ✓ Check Clinic Exists              │
│  ✓ Check User Role Level            │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Generate Email                    │
│  fullname.role@clinic.vetrix.local  │
│  (e.g., ahmed.doctor@clinic.local)  │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Generate Password                 │
│  name@clinic#{user_id}              │
│  (e.g., ahmed@clinic#user_abc123)   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Check Email Uniqueness            │
│  ✗ If exists → Return 409           │
│  ✓ If unique → Continue             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Hash Password & Create User       │
│  1. Hash: bcrypt(password)          │
│  2. Create: User{...hashed_pwd}     │
│  3. Save: DB.insert(user)           │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Broadcast Event                   │
│  Event: users:created               │
│  Data: {user_id}                    │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Return Response                   │
│  ✓ User Data + Generated Password   │
│  ⚠️  Password shown ONLY here!       │
└─────────────────────────────────────┘
```

---

## 📥 الإدخال (Request)

```
┌────────────────────────────────----┐
│ Request Body                        │
├────────────────────────────────----┤
│ {                                   │
│   "fullname": "أحمد علي",          │
│   "phone": "+201234567890",        │
│   "role": "doctor",                │
│   "clinic_id": "clinic_xyz"        │
│ }                                   │
│                                     │
│ ❌ NO email                         │
│ ❌ NO password                      │
└────────────────────────────────----┘
```

---

## 📤 الإخراج (Response)

```
┌────────────────────────────────────┐
│ Response Body                       │
├────────────────────────────────────┤
│ {                                   │
│   "success": true,                  │
│   "message": "...",                │
│   "data": {                         │
│     "user_id": "user_...",          │
│     "fullname": "أحمد علي",        │
│     "phone": "+201234567890",       │
│     "email": "ahmed.ali.doctor@    │
│              clinic.vetrix.local",  │
│     "password": "ahmadali@clinic#  │
│                  user_...",         │
│     "role": "doctor",               │
│     "clinic_id": "clinic_xyz",      │
│     "is_active": true,              │
│     "is_superuser": false           │
│   }                                 │
│ }                                   │
│                                     │
│ ✅ email يظهر هنا                   │
│ ✅ password يظهر هنا (مرة واحدة!)   │
└────────────────────────────────────┘
```

---

## 🔐 معالجة كلمة المرور

```
┌──────────────────────────────────────┐
│ Plain-text Password (Temporary)     │
│ ahmed@clinic#user_abc123            │
│ (shown in response only)            │
└────────┬─────────────────────────────┘
         │
         ↓ Hashing
┌──────────────────────────────────────┐
│ Hashed Password (In Database)       │
│ $2b$12$AbCdEfGhIjKlMnOpQrStUv      │
│ WxYzZaBcDeFgHiJkLmNoPqRsT...       │
│ (never shown to user)               │
└──────────────────────────────────────┘
```

---

## 📊 مولدات البيانات

### Email Generator

```
Formula: {name}.{role}@{clinic}.vetrix.local

Examples:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input:  أحمد علي + doctor + عيادة الأمل
Output: ahmed.ali.doctor@clinicalarm.vetrix.local

Input:  فاطمة محمود + staff + clinic_xyz
Output: fatima.mahmoud.staff@clinic.vetrix.local

Input:  محمد حسن + client + دار الشفاء
Output: mohammad.hassan.client@darshifa.vetrix.local
```

### Password Generator

```
Formula: {name}@{clinic}#{user_id}

Examples:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input:  أحمد علي
        عيادة الأمل
        user_a1b2c3d4e5f6
Output: ahmadali@clinicalarm#user_a1b2c3d4e5f6

Input:  فاطمة محمود
        clinic_xyz
        user_f1a2b3c4d5e6
Output: fatimamahmoud@clinic#user_f1a2b3c4d5e6
```

---

## ✨ الميزات المتقدمة

### Transliteration (تحويل عربي → إنجليزي)

```
أحمد علي     → ahmad ali
فاطمة محمود  → fatima mahmoud
محمد حسن     → mohammad hassan
عيادة الأمل  → clinic alarm
دار الشفاء   → dar shifa
```

### Slug Processing (معالجة النصوص)

```
خطوات:
1. تنظيف من الأحرف الخاصة
2. تحويل لأحرف صغيرة
3. استبدال المسافات بـ .
4. إزالة النقاط الإضافية

مثال: "أحمد   علي!" → "ahmad.ali"
```

---

## 🔍 حالات الخطأ الشائعة

```
1. Email Exists
   ├─ Status: 409 Conflict
   ├─ Message: "Email already exists"
   └─ الحل: غيّر اسم المستخدم

2. Clinic Not Found
   ├─ Status: 404 Not Found
   ├─ Message: "Clinic not found"
   └─ الحل: تحقق من clinic_id

3. Permission Denied
   ├─ Status: 403 Forbidden
   ├─ Message: "Not authorized to create user..."
   └─ الحل: استخدم ADMIN أو OWNER

4. Missing clinic_id (for non-admin)
   ├─ Status: 400 Bad Request
   ├─ Message: "clinic_id is required"
   └─ الحل: أضيف clinic_id
```

---

## 📱 مثال باستخدام Postman

### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Body

```json
{
  "fullname": "د. فاطمة محمود",
  "phone": "+201001234567",
  "role": "doctor",
  "clinic_id": "clinic_xyz789"
}
```

### Response

```json
{
  "success": true,
  "message": "User created successfully. Save the generated email and password!",
  "data": {
    "user_id": "user_f1a2b3c4d5e6",
    "fullname": "د. فاطمة محمود",
    "phone": "+201001234567",
    "email": "fatima.mahmoud.doctor@clinic.vetrix.local",
    "password": "fatimamahmoud@clinic#user_f1a2b3c4d5e6",
    "role": "doctor",
    "clinic_id": "clinic_xyz789",
    "is_active": true,
    "is_superuser": false
  }
}
```

---

**تم التحديث:** 29 مارس 2026
