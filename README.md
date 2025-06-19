# WhatsApp Gateway

## Navigation

- [Project Overview](#whatsapp-gateway)
- [Library Used](#beberapa-library-yang-digunakan)
- [Installation](#prasyarat-instalasi)
- [API Documentation](#penggunaan-api-belum-ada-frondendnya)
  - [Start Session](#1-api-start-session)
  - [Delete Session](#2-api-delete-session)
  - [Change Device](#3-api-change-device)
  - [Get QR Code](#4-api-get-qr-code)
  - [Send Bulk Message](#5-api-send-bulk-mesage)
  - [Send Group Message](#6-api-send-group-mesage)
  - [Get Group](#7-api-get-group)
  - [Delete Group](#8-api-delete-group)
  - [Create Template Message](#9-api-create-template-message)
  - [Update Template Message](#10-api-update-template-message)
  - [Reads Template Messages](#11-api-reads-template-messages)
  - [Reads Template Message (By Id)](#12-api-reads-template-message-by-id)
  - [Reads Template Message (By Type)](#13-api-reads-template-message-by-type)
  - [Delete Template Message](#14-api-delete-template-message-by-id)
  - [Implementation Template](#15-api-implementasion-template-message)
  - [Preview Excel File](#16-api-preview-file-excel)
  - [Get Placeholder Template](#17-api-get-placeholder-template)

Project ini dibuat oleh [mardiana036](https://github.com/mardiana36) (Backend) dan [SuryaPranata](https://github.com/SuryaPranata) (Frontend).

Project ini adalah sebuah sistem WhatsApp Gateway berbasis website yang memungkinkan pengiriman pesan masal, group, dan otomatis melalui WhatsApp. Dalam Project ini terdapat dua jenis route yang pertama ada route `ROUTES UNTUK FRONTEND (MEMBUTUHKAN LOGIN)` yang sudah ada frontendnya dan `ROUTES UNTUK BACKEND (MENGGUNAKAN TOKEN API)` yang belum ada frontendnya dan tanpa login namun mengunakan token untuk bisa mengakses apinya.

## Beberapa Library Yang Digunakan

| Library                     | Kegunaan                                        |
| --------------------------- | ----------------------------------------------- |
| Node.js                     | Menjalankan aplikasi backend dengan JavaScript. |
| Express.js                  | Membuat routing dan endpoint RESTful API        |
| mysql2                      | Menghubungkan backend ke database MySQL         |
| @wppconnect-team/wppconnect | Integrasi dengan WhatsApp Web melalui API       |

## Prasyarat Instalasi

- Node.js (v14 atau lebih baru)
- XAMPP (atau aplikasi database MySQL lainnya)
- Git
- Visual Studio Code (disarankan)

## Instalasi

1. **Instal Node.js dan XAMPP**

   - Download Node.js: [https://nodejs.org/en](https://nodejs.org/en)
   - Download XAMPP: [https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)

2. **Clone Repository**
   ```bash
   git clone https://github.com/mardiana36/waGateway_Trika.git
   cd waGateway_Trika
   ```
3. **Instal Dependensi**

   ```bash
   npm install
   ```

4. **Konfigurasi Environment**

   - Salin isi file `.env.example` ke file baru bernama `.env`
   - Isi semua variabel yang diperlukan di file `.env`
   - Untuk `JWT_SECRET`, jalankan perintah berikut dan salin hasilnya:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

5. **Jalankan XAMPP**

   - Start Apache dan MySQL

6. **Jalankan Aplikasi**

   ```bash
   npm start
   ```

   Jika berhasil, akan muncul pesan:

   ```
   Server running on port 3000
   [INFO] Database 'wa_gateway' berhasil dibuat atau sudah ada.
   [OK] Struktur database dan relasi berhasil dibuat.
   Memulai inisialisasi semua session dari database...
   Tidak ada session yang perlu diinisialisasi
   ```

[Back to Navigation](#navigation)

## Penggunaan API (Belum Ada Frondendnya)

### Mendapatkan API Token

Dapatkan API Token dari: [https://tokenwa-production.up.railway.app/](https://tokenwa-production.up.railway.app/)

## `1. API Start Session`

**Catatan:**

- API ini hanya akan mengembalikan response ketika QR Code sudah discan dan terhubung dengan WhatsApp

**Endpoint:**

- URL: `http://localhost:3000/api/b/sessions`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di start. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    alert(result.message);
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika berhasil memulai sesi
  ```json
  {
    "success": true,
    "message": "Sesi sudah berjalan dan berhasil terautentikasi."
  }
  ```

**Response Gagal:**

- Jika sessionName bukan string:
  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```
- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `2. API Delete Session`

**Catatan:**

- API ini digunakan untuk menghapus sesi yang ada dalam database dan folder tokens yang di buat otomatis oleh library `@wppconnect-team/wppconnect`

**Endpoint:**

- URL: `http://localhost:3000/api/b/sessions`
- Method : `DELETE`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di delete. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/sessions", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    alert(result.message);
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil menghapus sesi
  ```json
  {
    "success": true,
    "message": "Session nama_sesi berhasil dihapus"
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika QR code belum di scan atau sesi belum terautentikasi :

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error",
    "debugTip": "Cek apakah semua proses Chromium sudah berhenti"
  }
  ```

[Back to Navigation](#navigation)

## `3. API Change Device`

**Catatan:**

- Api ini digunakan untuk memutuskan tautan WhatsApp dan menampilkan QR Code ulang yang dapat discan mengunakan nomor WhatsApp yang diinginkan.

**Endpoint:**

- URL: `http://localhost:3000/api/b/sessions`
- Method : `DELETE`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di diganti tauntan WhatsAppnya. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil pergantian perangkat
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika berhasil mengganti perangkat
  ```json
  {
    "success": true
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika QR code belum di scan atau sesi belum terautentikasi :

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `4. API Get QR Code`

**Catatan:**

- Api ini di gunakan untuk mengambil dan mengecek status dari QR Code yang di hasilkan oleh library `@wppconnect-team/wppconnect`

**Endpoint:**

- URL: `http://localhost:3000/api/b/qr`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/qr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika QR Code belum discan

  ```json
  {
    "success": true,
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAA...", //berisi data qr base64Qr (Sebuah string Base64 yang merepresentasikan gambar QR code.)
    "statusQR": "ready"
  }
  ```

- Jika QR Code sudah discan dan tidak ada masalah saat scan (dari library `@wppconnect-team/wppconnect`)

  ```json
  {
    "success": true,
    "statusQR": "qrReadSuccess"
  }
  ```

- Jika QR Code masih dalam proses pembuatan

  ```json
  {
    "success": true,
    "statusQR": "not_ready"
  }
  ```

- Jika server gagal mengautentikasi QR Code (dari library `@wppconnect-team/wppconnect`)

  ```json
  {
    "success": true,
    "statusQR": "qrReadError"
  }
  ```

- Jika browser berhenti saat pemindaian kode QR sedang berlangsung (dari library `@wppconnect-team/wppconnect`)

  ```json
  {
    "success": true,
    "statusQR": "qrReadFail"
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `5. API Send Bulk Mesage`

**Catatan:**

- API ini di gunakan untuk melakukan pengiriman pesan secara masal berdasarkan nomor WhatsApp.
- Untuk value dari parameter `number` yang di gunakan untuk menampung nomor WhatsApp tujuan tidak boleh di mulai dengan `+62` yang boleh `62` atau `0` atau `tanpa keduanya` asal jangan ada `+` didepan nomornya.
- API ini hanya support nomor telepon `Indonesia` jika tidak melakukan modifikasi bakend lebih lanjut.

**Endpoint:**

- URL: `http://localhost:3000/api/b/send-bulk-message`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| number | ["0857476353656", "6285765654321"] | array | ya | Nomor WhatsApp tujuan pengiriman pesan. |
| message | ["Pesan nomo 1", "Pesan nomor 2"] | array | ya | Isi dari pesan yang akan di kirim. |
| delay | 300 | number | tidak | Secara default nilainya 300 (satuan ms). ini adalah delay pengiriman pesan ke masing-masing nomor WhatsApp tujuan. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1",
  "number": ["0857476353656", "6285765654321"],
  "message": ["Pesan nomo 1", "Pesan nomor 2"],
  "delay": 400
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot1",
    number: ["0857476353656", "6285765654321"],
    message: ["Pesan nomo 1", "Pesan nomor 2"],
    delay: 400,
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/send-bulk-message", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil mengirim pesan

  ```json
  {
    "success": true,
    "results": [
      {
        "no": "62857476353656",
        "status": "success",
        "message": "Pesan nomo 1"
      },
      {
        "no": "6285765654321",
        "status": "success",
        "message": "Pesan nomor 2"
      }
    ]
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika message tipe datanya bukan string atau array:

  ```json
  {
    "success": false,
    "error": "Tipe data message harus String atau array."
  }
  ```

- Jika number tipe datanya bukan string atau array:

  ```json
  {
    "success": false,
    "error": "Tipe data number harus String atau array."
  }
  ```

- Jika QR Code belum di scan atau terautentikasi:

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika gagal pada saat mengirim pesan:

  ```json
  {
    "success": true,
    "results": [
      {
        "no": "6285+476353656",
        "status": "failed",
        "message": "Pesan nomo 1",
        "error": "wid error: invalid wid"
      },
      {
        "no": "62+6285765654321",
        "status": "failed",
        "message": "Pesan nomor 2",
        "error": "wid error: invalid wid"
      }
    ]
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `6. API Send Group Mesage`

**Catatan:**

- API ini di gunakan untuk melakukan pengiriman pesan ke group WhatsApp.
- `groupsId` bisa di dapatkan melalui api Get Group.
- API ini hanya support pengiriman pesan yang sama ke beberapa grup (pesan belum bisa berbeda).

**Endpoint:**

- URL: `http://localhost:3000/api/b/send-group`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| groupsId | ["120363399006547135@g.us"] | array | ya | ID Group tujuan pengiriman pesan yang bisa di dapat melalui `API Get Groups` |
| message | "isi dari pesan" | array | ya | Isi dari pesan yang akan di kirim. |
| delay | 300 | number | tidak | Secara default nilainya 300 (satuan ms). ini adalah delay pengiriman pesan ke masing-masing ID Group WhatsApp tujuan. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1",
  "groupsId": ["120363399006547135@g.us"],
  "message": "ini pesan ke group",
  "delay": 400
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot1",
    groupsId: ["120363399006547135@g.us"],
    message: "ini pesan ke group",
    delay: 400,
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/send-group", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil mengirim pesan

  ```json
  {
    "success": true,
    "results": [
      {
        "groupId": "120363399006547135@g.us",
        "status": "send",
        "message": "ini pesan ke group"
      }
    ]
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika message tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data message harus String."
  }
  ```

- Jika groupsId tipe datanya bukan array.:

  ```json
  {
    "success": false,
    "error": "Tipe data groupsId harus Array."
  }
  ```

- Jika QR Code belum di scan atau terautentikasi:

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika gagal pada saat mengirim pesan:

  ```json
  {
    "success": true,
    "results": [
      {
        "groupId": "120363399006547131@g.us",
        "status": "failed",
        "error": "Gagal Mengirim Pesan! Id group tidak valid."
      }
    ]
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `7. API Get Group`

**Catatan:**

- API ini di gunakan untuk mendapatkan `groupId` dari group WhatsApp yang telah terautentikasi atau tertaut.
- API ini juga melakukan insert ke database jika ada `groupId` yang di dapatkan dari WhatsApp yang terautentikasi.

**Endpoint:**

- URL: `http://localhost:3000/api/b/group`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot1",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/group", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil mendapatkan group

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_id": 1,
      "name": "FreeFire",
      "waId": "120363399006547115@g.us",
      "created_at": "2025-06-17T16:00:00.000Z"
    },
    {
      "id": 2,
      "session_id": 1,
      "name": "Helloworld",
      "waId": "120363419136379900@g.us",
      "created_at": "2025-06-17T16:00:00.000Z"
    },
    {
      "id": 3,
      "session_id": 1,
      "name": "Free Fire 2",
      "waId": "120363400144273657@g.us",
      "created_at": "2025-06-17T16:00:00.000Z"
    },
    {
      "id": 4,
      "session_id": 1,
      "name": "bot",
      "waId": "120363419691596984@g.us",
      "created_at": "2025-06-17T16:00:00.000Z"
    },
    {
      "id": 5,
      "session_id": 1,
      "name": "grup ml ",
      "waId": "120363399391601327@g.us",
      "created_at": "2025-06-17T16:00:00.000Z"
    }
  ]
}
```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika QR Code belum di scan atau terautentikasi:

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika WhatsApp yang terautentikasi(tertaut) belum memiliki group

  ```json
  {
    "success": false,
    "error": "Bot belum memiliki grup"
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

## `8. API Delete Group`

**Catatan:**

- API ini digunakan untuk menghapus data WhatsApp group di dalam database.

**Endpoint:**

- URL: `http://localhost:3000/api/b/group`
- Method : `DELETE`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot1",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/group", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil menghapus data group dalam database

```json
{
  "success": true,
  "message": "Delete success."
}
```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika QR Code belum di scan atau terautentikasi:

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika Terjadi masalah saat mengapus group atau group dalam database kosong

  ```json
  {
    "success": false,
    "message": "Terjadi masalah saat hapus grup! Atau group kosong."
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `9. API Create Template Message`

**Catatan:**

- API ini digunakan Membuat template pesan dalam database yang bis di gunakan juga untuk menjawab pertanyaan otomatis berdasarkan trigger yang di berikan.
- API ini juga bisa digunakan untuk menyimpan templat pesan yang nantinya dapat digunakan untuk pengiriman pesan personal secara masal maupun pengiriman pesan ke beberapa group.
- Jika ingin API ini menjawab pesan secara otomatis yang berasal dari group ataupun personal, maka kirim request JSON yang variabel `keyMessage`-nya berisi trigger pesan yang akan di jawab otomatis (contoh jika variabel `keyMessage` berisi string "p" maka API ini hanya akan menjawab secara otomatis jika ada yang mengirim pesan p ke WhatsApp yang telah terautentikasi). Selain itu variabel `direction` wajib diisi "in", variabel `type` bisa di isi sesuai kebutuhan ("personal" atau "group") dan jangan buat variabel `placeholder`.
- Jika ingin membuat template pesan yang di gunakan untuk mengirim pesan ke personal atau group, maka kirim request JSON dengan format seperti berikut ini.
  - Jangan Buat variabel `keyMessage`
  - Variabel `direction` wajib diisi "out"
  - Variabel `type` sesuai keinginan ("personal" atau "group")
  - Variabel `placeholder` wajib ketika menggunakan `API Preview Data Excel` untuk mendapatakan data group atau orang yang akan di kirimkan pesan.
- Variabel `placeholder` bisa di dapatkan melalui [`API Get Placeholder Template`](#17-api-get-placeholder-template).

**Endpoint:**

- URL: `http://localhost:3000/api/b/template`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| name | nama_template | string | ya | Nama dari template yang di buat. |
| keyMessage | hai | string | tidak | Wajib ketika ingin menjawab pesan otomatis. Ini di gunakan sebagi trigger pesan. |
| message | isi pesan | string | ya | isi pesan yang akan dikirimkan.|
| direction | in / out | string | ya | Di gunakan untuk menentukan arah pesan "in" artinya pesan masuk baik dari group atau orang lain. Sementara "out" artinya pesan keluar yang di kirim dari sistem baik ke group atau personal (orang lain). Variabel ini hanya boleh di isi "in" atau "out".|
| type | personal / group | string | ya | Digunakan untuk menentukan pesan akan dikirim kemana. "personal" artinya di kirim ke perorangan dan "group" artinya dikirim ke grup. |
| placeholder | {Nama Pelanggan}, {periode}, {Nomor Telepon} | string | tidak | Ini tidak wajib ketika variabel `direction` bernilai "in". |

**Contoh Body Menjawab Pesan Otomatis (JSON):**

```json
{
  "sessionName": "bot6",
  "name": "jawab Otomatis",
  "keyMessage": "p",
  "message": "Hai ada yang bisa saya bantu ?",
  "direction": "in",
  "type": "personal"
}
```

**Contoh Body Membuat Tempalate pesan (JSON):**

```json
{
  "sessionName": "bot6",
  "name": "template pesan",
  "message": "Hai ada yang bisa saya bantu ?",
  "direction": "out",
  "type": "personal",
  "placeholder": "{Nama Pelanggan}, {periode}, {Nomor Telepon}"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
    name: "template pesan",
    message: "Hai ada yang bisa saya bantu ?",
    direction: "out",
    type: "personal",
    placeholder: "{Nama Pelanggan}, {periode}, {Nomor Telepon}",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/template", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil menyimpan template ke dalam database

  ```json
  {
    "success": true,
    "message": "Templat pesan berhasil disimpan."
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika tipe data name tidak string

  ```json
  {
    "success": false,
    "error": "Tipe data name harus String."
  }
  ```

- Jika tipe data keyMessage tidak string dan variabelnya ada

  ```json
  {
    "success": false,
    "error": "Tipe data keyMessage harus String."
  }
  ```

- Jika tipe data message tidak string
  ```json
  {
    "success": false,
    "error": "Tipe data message harus String."
  }
  ```
- Jika tipe data direction tidak string dan bukan "in" atau "out"

  ```json
  {
    "success": false,
    "error": "Tipe data direction harus String dan berisi 'in' atau 'out'"
  }
  ```

- Jika tipe data type tidak string dan bukan "group" atau "group"

  ```json
  {
    "success": false,
    "error": "Tipe data type harus String dan berisi 'personal' atau 'group'"
  }
  ```

- Jika variabel palceholder ada dan tipe datanya bukan string

  ```json
  {
    "success": false,
    "error": "Tipe data placeholder harus String."
  }
  ```

- Jika terjadi kesalahan saat menyimpan template pesan ke database

  ```json
  {
    "success": false,
    "message": "Terjadi masalah saat menamabhakan template pesan!"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `10. API Update Template Message`

**Catatan:**

- API ini digunakan Memperbarui template pesan dalam database.

**Endpoint:**

- URL: `http://localhost:3000/api/b/template`
- Method : `PUT`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| id | 1 | number | ya | Id dari template pesan yang akan diperbarui |
| name | nama_template | string | ya | Nama dari template yang di buat. |
| keyMessage | hai | string | tidak | Wajib ketika ingin menjawab pesan otomatis. Ini di gunakan sebagi trigger pesan. |
| message | isi pesan | string | ya | isi pesan yang akan dikirimkan.|
| direction | in / out | string | ya | Di gunakan untuk menentukan arah pesan "in" artinya pesan masuk baik dari group atau orang lain. Sementara "out" artinya pesan keluar yang di kirim dari sistem baik ke group atau personal (orang lain). Variabel ini hanya boleh di isi "in" atau "out".|
| type | personal / group | string | ya | Digunakan untuk menentukan pesan akan dikirim kemana. "personal" artinya di kirim ke perorangan dan "group" artinya dikirim ke grup. |
| placeholder | {Nama Pelanggan}, {periode}, {Nomor Telepon} | string | tidak | Ini tidak wajib ketika variabel `direction` bernilai "in". |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot6",
  "id": 1,
  "name": "template pesan",
  "message": "Hai ada yang bisa saya bantu ?",
  "direction": "out",
  "type": "personal",
  "placeholder": "{Nama Pelanggan}, {periode}, {Nomor Telepon}"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
    id: 1,
    name: "template pesan",
    message: "Hai ada yang bisa saya bantu ?",
    direction: "out",
    type: "personal",
    placeholder: "{Nama Pelanggan}, {periode}, {Nomor Telepon}",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/template", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika berhasil memperbarui template pesan dalam database

  ```json
  {
    "success": true,
    "message": "Templat pesan berhasil diperbarui."
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika tipe data name tidak string

  ```json
  {
    "success": false,
    "error": "Tipe data name harus String."
  }
  ```

- Jika tipe data keyMessage tidak string dan variabelnya ada

  ```json
  {
    "success": false,
    "error": "Tipe data keyMessage harus String."
  }
  ```

- Jika tipe data message tidak string
  ```json
  {
    "success": false,
    "error": "Tipe data message harus String."
  }
  ```
- Jika tipe data direction tidak string dan bukan "in" atau "out"

  ```json
  {
    "success": false,
    "error": "Tipe data direction harus String dan berisi 'in' atau 'out'"
  }
  ```

- Jika tipe data type tidak string dan bukan "group" atau "group"

  ```json
  {
    "success": false,
    "error": "Tipe data type harus String dan berisi 'personal' atau 'group'"
  }
  ```

- Jika variabel palceholder ada dan tipe datanya bukan string

  ```json
  {
    "success": false,
    "error": "Tipe data placeholder harus String."
  }
  ```

- Jika terjadi kesalahan saat memperbarui template pesan dalam database

  ```json
  {
    "success": false,
    "message": "Terjadi masalah saat memperbarui template pesan!"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `11. API Reads Template Messages`

**Catatan:**

- API ini digunakan mendapatkan semua template untuk sesi tertentu Whatsapp Gateway.

**Endpoint:**

- URL: `http://localhost:3000/api/b/templates`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot6"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/template", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil Mengambil semua data template dalam database

  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "session_id": 1,
        "name": "jawab Otomatis",
        "key_message": "p",
        "message": "Hai ada yang bisa saya bantu ?",
        "direction": "in",
        "type": "personal",
        "placeholder": "",
        "created_at": "2025-06-17T16:00:00.000Z",
        "updated_at": null
      },
      {
        "id": 2,
        "session_id": 1,
        "name": "jawab Otomatis2",
        "key_message": "p",
        "message": "Hai ada yang bisa saya bantu ?",
        "direction": "in",
        "type": "personal",
        "placeholder": "",
        "created_at": "2025-06-17T16:00:00.000Z",
        "updated_at": null
      },
      {
        "id": 3,
        "session_id": 1,
        "name": "template pesan",
        "key_message": "",
        "message": "Hai ada yang bisa saya bantu ?",
        "direction": "out",
        "type": "personal",
        "placeholder": "",
        "created_at": "2025-06-17T16:00:00.000Z",
        "updated_at": null
      }
    ]
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika template pesan dalam database kosong:

  ```json
  {
    "success": false,
    "error": "Tampalate pesan masih kosong!"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)


## `12. API Reads Template Message (By Id)`

**Catatan:**

- API ini digunakan mendapatkan untuk mendapatkan detail template pesan berdasarkan idnya.

**Endpoint:**

- URL: `http://localhost:3000/api/b/readsTemplate`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| id | 1 | number | ya | Id dari template pesan. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot6",
  "id": 1
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
    id: 1,
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/readsTemplate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil Mengambil data template dalam database

  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "session_id": 1,
      "name": "jawab Otomatis",
      "key_message": "p",
      "message": "Hai ada yang bisa saya bantu ?",
      "direction": "in",
      "type": "personal",
      "placeholder": "",
      "created_at": "2025-06-17T16:00:00.000Z",
      "updated_at": null
    }
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika id kosong atau null:

  ```json
  {
    "success": false,
    "error": "id tidak boleh kosong."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika template pesan dalam database kosong:

  ```json
  {
    "success": false,
    "error": "Tampalate tidak ditemukan"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `13. API Reads Template Message (By Type)`

**Catatan:**

- API ini digunakan mendapatkan untuk mendapatkan semua template pesan berdasarkan tipenya.

**Endpoint:**

- URL: `http://localhost:3000/api/b/`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| type | personal / group | string | ya | tipe untuk tujuan dari pesannya dikirim. Nilanya harus "personal" atau "group". |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot6",
  "type": "personal"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
    type: "personal",
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil Mengambil data template dalam database

  ```json
  {
    "success": true,
    "data": [
      {
        "id": 3,
        "session_id": 1,
        "name": "template pesan",
        "key_message": "",
        "message": "Hai ada yang bisa saya bantu ?",
        "direction": "out",
        "type": "personal",
        "placeholder": "",
        "created_at": "2025-06-17T16:00:00.000Z",
        "updated_at": null
      }
    ]
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika tipe data type bukan string dan "group" atau "personal":

  ```json
  {
    "success": false,
    "error": "Tipe data type harus String dan berisi 'personal' atau 'group'"
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika template pesan dalam database kosong:

  ```json
  {
    "success": false,
    "error": "Tampalate pesan masih kosong!"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `14. API Delete Template Message (By Id)`

**Catatan:**

- API ini digunakan untuk menghapus template pesan berdasrkan idnya.

**Endpoint:**

- URL: `http://localhost:3000/api/b/template`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang telah dimulai. |
| id | 1 | number | ya | Id dari template pesan. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot6",
  "id": 1
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot6",
    id: 1,
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/template", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil Menghapus data template dalam database

  ```json
  {
    "success": true,
    "message": "Template Pesan berhasil dihapus."
  }
  ```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika id kosong atau null:

  ```json
  {
    "success": false,
    "error": "id tidak boleh kosong."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika template pesan dalam database kosong atau idnya salah:

  ```json
  {
    "success": false,
    "message": "Template Pesan tidak ditemukan."
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `15. API Implementasion Template Message`

**Catatan:**

- API ini digunakan untuk melakukan kompilasi atau memproses placeholder (seperti {nama pelanggan}) yang ada dalam sebuah string dan mengembalikannya menjadi string yang utuh.

**Endpoint:**

- URL: `http://localhost:3000/api/b/compile`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| templateMessage | hallo {nama pelanggan} apa kabar ? | string | ya | Pesan yang akan di compile berdasarkan palceholder yang ada. |
| filleds | {"nama pelanggan": "mardiana"} | object | ya | Data yang akan di gunakan untuk mengganti placeholder yang ada dalam string pada parameter `templateMessage`. Parameter ini harus di bertipe object, keynya sama dengan placeholder yang terdapat dalam string parameter `templateMessage`, dan valunya di isi dengan string yang akan mengganti placeholder. |

**Contoh Body (JSON):**

```json
{
  "templateMessage": "halo {nama pelanggan} apa kabar ?",
  "filleds": { "nama pelanggan": "mardiana" }
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    templateMessage: "halo {nama pelanggan} apa kabar ?",
    filleds: { "nama pelanggan": "mardiana" },
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/compile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    // lakukan sesuatu ketika gagal
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil mengcompile:

  ```json
  {
    "success": true,
    "data": "halo mardiana apa kabar ?"
  }
  ```

**Response Gagal:**

- Jika templateMessage tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data templateMessage harus String."
  }
  ```

- Jika filleds tipedatanya bukan object:

  ```json
  {
    "success": false,
    "message": "Tipe data filleds harus object."
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `16. API Preview File Excel`

**Catatan:**

- API ini digunakan untuk mendapatkan data yang terdapat dalam file excel yang di kembalikan dalm bentuk JSON.
- Aturan isi dari file excel jika ingin menggunakan API ini untuk melakukan pengiriman pesan yaitu sebagi berikut:
  1. Pada baris pertama file excel harus berisi label dari kolomnya (judul data kolom).
  2. Format file yang di terima hanya (`.xlsx` atau `.xls`)
  3. Maksimal ukuran file 100Mb

**Endpoint:**

- URL: `http://localhost:3000/api/b/preview-excel`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | multipart/form-data | standar dalam mengirim file dan form data dalam satu request HTTP |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| excel | (upload file) | file | ya | File Excel (.xlsx) yang ingin di-preview |

**Contoh Request (JavaScript):**

```javascript
  const btnUpload = document.getElementById("uploadButton");
  const fileExcel = document.getElementById("fileUpload");
  const token = "api_token_anda";
  btnUpload.onclick = null;
  btnUpload.onclick = async () => {
    const file = fileExcel.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("excel", file);
      try {
        const response = await fetch("api/preview-excel", {
          method: "POST",
          headers: {Authorization: `Bearer ${token}`}
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          // lakukan sesuatu jika berhasil
        } else {
        //  lakukan sesuatu jika gagal
        }
      } catch (error) {
        console.log(error.message);
      }
    } else {
      alert("Pilih file terlebih dahulu.");
    }
  };
```

**Response Berhasil:**

- Jika Berhasil melakukan preview file excel:

  ```json
  {
    "success": true,
    "data": [
      {
        "No": 1,
        "Nama Pelanggan": "Putu Santika",
        "Alamat": "Jl. Raya Kerobokan No.10",
        "Nomor HP": 85737622201,
        "Paket Internet": "20 Mbps",
        "Tanggal Aktif": "2024-01-05",
        "Nomor Langganan": 27282,
        "Total Tagihan": 200000
      },
      {
        "No": 2,
        "Nama Pelanggan": "Made Dewi",
        "Alamat": "Banjar Tegal, Ubud",
        "Nomor HP": 85737633201,
        "Paket Internet": "50 Mbps",
        "Tanggal Aktif": "2023-11-12",
        "Nomor Langganan": 36736,
        "Total Tagihan": 300000
      },
      {
        "No": 3,
        "Nama Pelanggan": "Wayan Agus",
        "Alamat": "Jl. Gunung Agung No.15",
        "Nomor HP": 85737604401,
        "Paket Internet": "10 Mbps",
        "Tanggal Aktif": "2024-03-22",
        "Nomor Langganan": 46190,
        "Total Tagihan": 400000
      },
      {
        "No": 4,
        "Nama Pelanggan": "Kadek Sari",
        "Alamat": "Jl. Cokroaminoto No.20",
        "Nomor HP": 85808917325,
        "Paket Internet": "30 Mbps",
        "Tanggal Aktif": "2024-02-01",
        "Nomor Langganan": 55644,
        "Total Tagihan": 500000
      },
      {
        "No": 5,
        "Nama Pelanggan": "Komang Budi",
        "Alamat": "Jl. Tukad Yeh Aya No.7",
        "Nomor HP": 85828917225,
        "Paket Internet": "20 Mbps",
        "Tanggal Aktif": "2024-04-10",
        "Nomor Langganan": 65098,
        "Total Tagihan": 200000
      }
    ]
  }
  ```

**Response Gagal:**

- Jika tipe file yang di upload bukan excel:

  ```json
  {
    "success": false,
    "message": "File harus berupa Excel (.xlsx atau .xls)"
  }
  ```

- Jika Ukuran file melebihi 100Mb:

  ```json
  {
    "success": false,
    "message": "Ukuran file maksimal 100MB"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

[Back to Navigation](#navigation)

## `17. API Get Placeholder Template`

**Catatan:**

- API ini digunakan untuk mendapatkan data label atau judul kolom (placeholder) dalm file excel yang di gunakan untuk pebuatan template pesan.
- Aturan isi dari file excel jika ingin menggunakan API ini untuk mendapatkan placeholder yang dapat di gunakan dalam pembuatan template pesan yaitu sebagi berikut:
  1. Pada baris pertama file excel harus berisi label dari kolomnya (judul data kolom).
  2. Format file yang di terima hanya (`.xlsx` atau `.xls`)
  3. Maksimal ukuran file 100Mb

**Endpoint:**

- URL: `http://localhost:3000/api/b/preview-excel-template`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | multipart/form-data | standar dalam mengirim file dan form data dalam satu request HTTP |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| excel | (upload file) | file | ya | File Excel (.xlsx) yang ingin di-preview |

**Contoh Request (JavaScript):**

```javascript
  const btnUpload = document.getElementById("uploadButton");
  const fileExcel = document.getElementById("fileUpload");
  const token = "api_token_anda";
  btnUpload.onclick = null;
  btnUpload.onclick = async () => {
    const file = fileExcel.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("excel", file);
      try {
        const response = await fetch("api/preview-excel-template", {
          method: "POST",
          headers: {Authorization: `Bearer ${token}`}
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          // lakukan sesuatu jika berhasil
        } else {
        //  lakukan sesuatu jika gagal
        }
      } catch (error) {
        console.log(error.message);
      }
    } else {
      alert("Pilih file terlebih dahulu.");
    }
  };
```

**Response Berhasil:**

- Jika Berhasil melakukan preview file excel:

  ```json
  {
    "success": true,
    "data": [
      "{No}",
      "{Nama Pelanggan}",
      "{Alamat}",
      "{Nomor HP}",
      "{Paket Internet}",
      "{Tanggal Aktif}",
      "{Nomor Langganan}",
      "{periode}"
    ]
  }
  ```

**Response Gagal:**

- Jika tipe file yang di upload bukan excel:

  ```json
  {
    "success": false,
    "message": "File harus berupa Excel (.xlsx atau .xls)"
  }
  ```

- Jika Ukuran file melebihi 100Mb:

  ```json
  {
    "success": false,
    "message": "Ukuran file maksimal 100MB"
  }
  ```

- Jika error server:

  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

  [Back to Navigation](#navigation)


