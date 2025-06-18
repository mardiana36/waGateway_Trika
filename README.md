Project ini dibuat oleh mardiana036 (Backend) dan SuryaPranata (Frontend)

# WhatsApp Gateway

Sebuah sistem WhatsApp Gateway yang memungkinkan pengiriman pesan masal, group, dan otomatis melalui WhatsApp.

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

## Penggunaan API

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

## `5. API Send Bulk Mesage`

**Catatan:**

- API ini di gunakan untuk melakukan pengiriman pesan secara masal berdasarkan nomor WhatsApp.
- Untuk value dari variabel `number` yang di gunakan untuk menampung nomor WhatsApp tujuan tidak boleh di mulai dengan `+62` yang boleh `62` atau `0` atau `tanpa keduanya` asal jangan ada `+` didepan nomornya.
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
- Variabel `placeholder` bisa di dapatkan melalui `API Get Palaceholder Template`.

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
