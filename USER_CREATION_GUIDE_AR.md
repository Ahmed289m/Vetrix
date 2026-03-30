# دليل إنشاء المستخدمين الجدد

## 📋 النظام الجديد

عند إنشاء مستخدم جديد، لم تعد بحاجة لإدخال email و password. يتم توليدهما تلقائياً!

---

## ✅ ما الذي تحتاج إلى إدخاله فقط

```json
{
  "fullname": "أحمد علي",
  "phone": "+201234567890",
  "role": "doctor",
  "clinic_id": "clinic_abc123" // اختياري - إذا لم تحدده، سيتم استخدام عيادتك الحالية
}
```

---

## 🔑 البيانات الممولدة تلقائياً

### Email

يتم توليده بهذا الشكل: `{الاسم}.{الدور}@{اسم_العيادة}.vetrix.local`

**مثال:**

- الاسم: `أحمد علي`
- الدور: `doctor`
- عيادة: `عيادة الأمل`
- **Email الممولد:** `ahmed.ali.doctor@clinic.alarm.vetrix.local`

### Password

يتم توليده بهذا الشكل: `{الاسم}@{اسم_العيادة}#{معرف_المستخدم}`

**مثال:**

- الاسم: `أحمد علي`
- عيادة: `عيادة الأمل`
- معرف: `user_a1b2c3d4e5f6`
- **Password الممولد:** `ahmadali@clinicalarm#user_a1b2c3d4e5f6`

---

## 📤 ما تستقبله كرد

```json
{
  "success": true,
  "message": "User created successfully. Save the generated email and password!",
  "data": {
    "user_id": "user_a1b2c3d4e5f6",
    "fullname": "أحمد علي",
    "phone": "+201234567890",
    "email": "ahmed.ali.doctor@clinicalarm.vetrix.local",
    "role": "doctor",
    "clinic_id": "clinic_abc123",
    "is_active": true,
    "is_superuser": false,
    "password": "ahmadali@clinicalarm#user_a1b2c3d4e5f6" // ⚠️ يظهر فقط عند الإنشاء!
  }
}
```

---

## ⚠️ ملاحظات هامة

1. **الـ Password يظهر فقط عند الإنشاء**
   - احفظه الآن! لن تستطيع الحصول عليه مرة أخرى
   - إذا نسيت، يمكن للـ admin إعادة تعيينه

2. **الـ Email فريد**
   - لا يمكن إنشاء مستخدمين باسم نفس البيانات في نفس العيادة
   - إذا حاولت، ستحصل على خطأ `Email already exists`

3. **الصلاحيات**
   - ADMIN: يمكنه إنشاء مستخدمين في أي عيادة
   - OWNER: يمكنه إنشاء doctor, staff, client (لا يمكنه إنشاء owner آخر)
   - غيرهما: لا يمكنهم إنشاء مستخدمين

---

## 🔄 الفرق مع النظام القديم

### القديم ❌

```json
{
  "fullname": "أحمد علي",
  "phone": "+201234567890",
  "email": "ahmed@example.com", // يجب أن تكتبه
  "password": "P@ssw0rd123", // يجب أن تكتبه
  "role": "doctor",
  "clinic_id": "clinic_abc123"
}
```

### الجديد ✅

```json
{
  "fullname": "أحمد علي",
  "phone": "+201234567890",
  "role": "doctor",
  "clinic_id": "clinic_abc123" // email و password ممولدة تلقائياً!
}
```

---

## 📚 أمثلة عملية

### مثال 1: إنشاء طبيب

```bash
curl -X POST http://localhost:8000/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "د. فاطمة محمود",
    "phone": "+201001234567",
    "role": "doctor",
    "clinic_id": "clinic_xyz789"
  }'
```

**الرد:**

```json
{
  "success": true,
  "message": "User created successfully. Save the generated email and password!",
  "data": {
    "user_id": "user_f1a2b3c4d5e6",
    "email": "fatima.mahmoud.doctor@clinic.vetrix.local",
    "password": "fatimamahmoud@clinic#user_f1a2b3c4d5e6",
    "fullname": "د. فاطمة محمود",
    "phone": "+201001234567",
    "role": "doctor",
    "clinic_id": "clinic_xyz789",
    "is_active": true,
    "is_superuser": false
  }
}
```

### مثال 2: إنشاء موظف

```bash
curl -X POST http://localhost:8000/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "محمد حسن",
    "phone": "+201111111111",
    "role": "staff"
  }'
```

---

## 🛠️ حالات الخطأ

### 1. Email موجود بالفعل

```json
{
  "success": false,
  "message": "Email already exists.",
  "status_code": 409
}
```

**الحل:** غيّر اسم المستخدم أو أضيف معلومة إضافية

### 2. عيادة غير موجودة

```json
{
  "success": false,
  "message": "Clinic not found.",
  "status_code": 404
}
```

**الحل:** تأكد من صحة `clinic_id`

### 3. لا توجد صلاحيات

```json
{
  "success": false,
  "message": "Not authorized to create user with role doctor",
  "status_code": 403
}
```

**الحل:** تحتاج إلى الدخول كـ ADMIN أو OWNER

---

## 💡 نصائح

1. **احفظ البيانات الممولدة**
   - احفظ email و password في مكان آمن
   - أرسلهما للمستخدم الجديد

2. **استخدم الأسماء الصحيحة**
   - كلما كان الاسم واضحاً، كان email أفضل
   - تجنب الأحرف الخاصة في الأسماء

3. **اختبر قبل الحفظ**
   - تأكد من البيانات قبل الإرسال
   - تحقق من صحة رقم الهاتف

---

## ❓ الأسئلة الشائعة

**س: هل يمكنني تغيير email و password بعد الإنشاء؟**

> نعم، يمكنك استخدام endpoint `/users/{user_id}` لتحديثها

**س: هل يمكنني إنشاء مستخدم بدون clinic_id؟**

> فقط الـ ADMIN يمكنه. لأن OWNER و غيرهم يجب أن يكونوا في عيادة

**س: ما الفرق بين الـ password الممولد والـ password المخزن؟**

> - الممولد: plain-text يظهر مرة واحدة فقط
> - المخزن: hashed في الدتابيز (لا يمكن استرجاعه)

**س: إذا نسيت password المستخدم، ماذا أفعل؟**

> الـ admin يمكنه تحديث password من خلال PUT endpoint

---

**آخر تحديث:** 29 مارس 2026
