# JEV: Model "System One" dari TypeSafe AI
### Penyelidikan Mendalam, Dokumentasi Lengkap & Cadangan Integrasi ke dalam Projek ABANGCOLEK-OS

---

## 1. Pengenalan & Latar Belakang TypeSafe AI

**TypeSafe AI** diasaskan pada tahun 2024 oleh bekas penyelidik OpenAI **Diego Almeida**, bersama **Erik Gafni** dan **Sasha Sheng**. Matlamat utama TypeSafe AI adalah untuk membina infrastruktur kecerdasan buatan berasaskan mesin (*machine-native intelligence infrastructure*) yang direka khas untuk membuat keputusan pantas dalam aplikasi perisian, dan bukannya menghasilkan teks sembang bebas (*free-form chatbot generation*).

Dokumentasi rasmi boleh dirujuk di: [https://docs.typesafe.ai/introduction](https://docs.typesafe.ai/introduction)

---

## 2. Apakah Itu JEV?

**Jev** ialah model "System One" awam pertama yang dilancarkan oleh TypeSafe AI (keluaran terhad September 2026). Jev berbeza secara fundamental daripada model bahasa besar (*Large Language Models* / LLM) konvensional:

* **Bukan Autoregresif (*Non-Autoregressive*)**: Jev tidak menghasilkan teks token demi token secara berulang. Sebaliknya, Jev memproses keadaan (*state*) dan soalan berstruktur dalam **satu pas ke hadapan (*single forward pass*)**.
* **Type-Safe & Tiada Halusinasi Struktur**: Pengguna mentakrifkan ruang jawapan (*answer space*) melalui skema taip yang ketat. Model dijamin mengembalikan nilai yang mematuhi skema secara 100%, menghapuskan ralat sintaks JSON dan halusinasi format.
* **Output Berprobabiliti & Berkeyakinan (*Confidence Scores*)**: Setiap keputusan disertakan dengan taburan kebarangkalian (*probability distribution*) dan markah keyakinan (*confidence score* 0.0 hingga 1.0) untuk auditabiliti sistem automasi.

---

## 3. Falsafah Seni Bina: System 1 (Jev) vs System 2 (LLM Tradisional)

Konsep ini diilhamkan daripada teori psikologi kognitif Daniel Kahneman (*Thinking, Fast and Slow*):

| Ciri-Ciri | System 1: JEV (TypeSafe AI) | System 2: LLM Tradisional (Gemini / GPT / Claude) |
| :--- | :--- | :--- |
| **Gaya Berfikir** | Pantas, intuitif, berstruktur, deterministik | Perlahan, analitikal, deskriptif, generatif |
| **Mekanisme** | Non-autoregressive (Single forward-pass) | Autoregressive (Token-by-token generation) |
| **Latensi (Latency)** | **15ms – 70ms** (100x – 200x lebih pantas) | **800ms – 5,000ms+** |
| **Kos Pengkomputeran** | 100x – 400x lebih murah (tiada kos penjanaan token) | Kos tinggi bergantung bilangan token input & output |
| **Format Output** | Pilihan terhad, skor ternormal, kebarangkalian | Teks bebas / markdown yang perlu di-parse |
| **Kesesuaian Tugas** | Triage, routing, guardrail, filtering, scoring | Penulisan laporan, penerangan, sintesis analitikal |

---

## 4. Tiga Primitif Utama Soalan JEV

Jev memproses sebarang konteks keadaan (*state* - teks atau JSON) menggunakan tiga jenis soalan bertaip (*typed questions*):

### 1. `Choice` (Klasifikasi Pelbagai Pilihan)
* **Tujuan**: Memilih satu pilihan daripada senarai pilihan yang telah ditakrifkan (sehingga 255 pilihan).
* **Data Dikembalikan**:
  - `choice`: Pilihan yang dipilih (string).
  - `probabilities`: Taburan kebarangkalian bagi setiap pilihan.
  - `confidence`: Skor keyakinan model (0.0 hingga 1.0).
* **Contoh Kegunaan**: Kategori aduan pelanggan (`'DELIVERY_DELAY'`, `'DAMAGED_ITEM'`, `'BILLING'`, `'GENERAL'`).

### 2. `Score` (Penilaian Berperingkat / Rubrik)
* **Tujuan**: Menilai input terhadap tahap deskriptif tersusun (skala 2 hingga 10 tahap).
* **Data Dikembalikan**:
  - `score`: Skor berterusan (termasuk nilai pecahan, cth: `4.2/5.0`).
  - `distribution`: Taburan kebarangkalian merentasi setiap tahap rubrik.
  - `confidence`: Ketepatan/kepekatan keyakinan.
* **Contoh Kegunaan**: Skor kualiti ulasan pelanggan, tahap risiko penipuan bayaran balik (*fraud risk*).

### 3. `Noul` (Keputusan Boolean / Ya-Tidak)
* **Tujuan**: Menjawab soalan binari (Ya atau Tidak) daripada perkataan Inggeris lama *Noul* (kebarangkalian kebenaran kenyataan).
* **Data Dikembalikan**:
  - `probability`: Nilai terapung 0.0 hingga 1.0 (kebarangkalian bahawa kenyataan adalah BENAR).
  - *(Nota: Noul tidak mempunyai medan keyakinan berasingan kerana kebarangkalian itu sendiri mewakili kepastian).*
* **Contoh Kegunaan**: "Adakah pelanggan ini berisiko tinggi untuk beralih ke pesaing (*churn risk*)?" atau "Adakah pesanan ini layak menerima bayaran balik segera?".

---

## 5. Parallel Sampling (Pensampelan Selari)

Salah satu kelebihan paling revolusioner Jev adalah keupayaannya memproses **puluhan soalan serentak terhadap satu *state*** dalam satu operasi selari:
* Menambah 10 soalan berbeza terhadap ulasan pelanggan (cth: 3 `Noul`, 5 `Choice`, 2 `Score`) hampir **tidak meningkatkan masa tindak balas API langsung** (kekal di bawah 70ms).
* Ini berbeza dengan LLM autoregresif di mana setiap soalan tambahan meningkatkan panjang token dan masa tunggu secara linear.

---

## 6. Contoh Kod Integrasi SDK Rasmi

### TypeScript / JavaScript (`@typesafe-ai/sdk`)
```typescript
import { TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient({
  apiKey: process.env.TYPESAFE_API_KEY,
});

async function evaluateCustomerFeedback(reviewText: string) {
  const result = await client.predict({
    state: {
      text: reviewText,
      context: "E-Commerce Customer Satisfaction & Operational Triage"
    },
    questions: {
      urgency: {
        type: "choice",
        options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        description: "How urgently does this customer issue require intervention?"
      },
      sentiment_score: {
        type: "score",
        levels: ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"],
        description: "Customer overall satisfaction sentiment score"
      },
      is_eligible_for_refund: {
        type: "noul",
        statement: "The customer is explicitly requesting or eligible for a refund due to service failure"
      },
      should_escalate_to_manager: {
        type: "noul",
        statement: "The feedback mentions severe carrier delay or lost parcel requiring manager escalation"
      }
    }
  });

  console.log("Urgency:", result.urgency.choice, "Confidence:", result.urgency.confidence);
  console.log("Sentiment Score:", result.sentiment_score.score);
  console.log("Eligible for Refund P(True):", result.is_eligible_for_refund.probability);
  return result;
}
```

---

## 7. Cadangan Strategik: Penggabungan (Merging) JEV ke Dalam ABANGCOLEK-OS

Dalam aplikasi **ABANGCOLEK-OS**, kita mempunyai operasi runcit menyeluruh yang disambungkan ke **Google Workspace (Gmail, Tasks, Docs, Sheets, Calendar, Forms, Meet, Chat) dan Google Maps Logistics**.

Pada masa ini, semua proses logik bergantung kepada LLM tunggal (`gemini-3.1-flash-lite-preview`). Menggabungkan JEV ke dalam projek ini akan mewujudkan **Seni Bina Hibrid System 1 + System 2** yang sangat berkuasa:

```
[Inbound Event / Customer Action / Order Delay]
                       │
                       ▼
           ┌────────────────────────┐
           │   JEV (System 1)       │  <-- Tindak balas < 50ms, deterministik
           │   TypeSafe Decisions   │
           └───────────┬────────────┘
                       │
         ┌─────────────┴─────────────┐
         │ Keputusan Berstruktur:    │
         │ - Urgency: HIGH           │
         │ - Action: "REFUND_AND_TASK"│
         │ - Eligible: YES (0.96)    │
         └─────────────┬─────────────┘
                       │
                       ▼
           ┌────────────────────────┐
           │   GEMINI (System 2)    │  <-- Autonomi Generatif & Workspace Tool Calling
           │   Execution & Tools    │
           └───────────┬────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
      [Gmail]     [Google Tasks]  [Google Calendar / Meet]
```

### 4 Modul Penggabungan Konkrit dalam ABANGCOLEK-OS:

### 1. Smart Email & Order Triage Router (Pra-pemprosesan Pantas)
* **Masalah**: Menghantar setiap emel atau pesanan ke LLM generatif mengambil masa 2-4 saat dan menggunakan kos token yang tinggi.
* **Solusi Jev**: Jev memproses emel masuk dalam 30ms menggunakan `Choice` untuk mengklasifikasikan destinasi:
  - `Auto-Draft Refund` (ke Gmail)
  - `Carrier Escalation` (ke Google Tasks)
  - `Schedule Meeting` (ke Google Calendar / Meet)
  - `General Inquiry` (respons biasa).

### 2. Fraud & Refund Guardrail Sebelum Pelaksanaan Tool
* **Masalah**: Membenarkan ejen AI meluluskan bayaran balik (`issue_refund`) semata-mata berasaskan gesaan teks boleh terdedah kepada manipulasi gesaan (*prompt injection*).
* **Solusi Jev**: Sebelum fungsi `issue_refund` dijalankan, panggil Jev dengan primitif `Noul`:
  - Soalan: *"Does the order delay or dispute satisfy the return policy threshold without indicators of fraud?"*
  - Jika `probability >= 0.85`, teruskan kelulusan; jika tidak, cipta Google Task untuk semakan manusia.

### 3. Penilaian Sentimen Google Forms Secara Automatik (*Real-Time CSAT Scoring*)
* **Masalah**: Respons borang Google Forms perlu dianalisis dengan konsisten tanpa variasi jawapan LLM.
* **Solusi Jev**: Setiap kali maklum balas diterima daripada Google Forms, Jev menggunakan `Score` (1-10) dan `Choice` kategori isu untuk mengemas kini Google Sheets secara langsung dengan graf taburan markah kebarangkalian yang tepat.

### 4. Logistics Alert Heatmap & Meeting Trigger (Google Maps + Meet)
* **Masalah**: Pengesanan krisis logistik pada peta penghantaran memerlukan ambang kepastian (*confidence threshold*).
* **Solusi Jev**: Menilai data bandar dan kelewatan pengangkut dengan soalan `Choice` tahap ancaman logistik. Jika `severity === 'CRITICAL'` dengan `confidence > 0.90`, ejen secara autonomi mencipta bilik mesyuarat Google Meet untuk bilik perang operasi (*war room*).

---

## 8. Ringkasan & Langkah Pelaksanaan Seterusnya

1. **Fail Khidmat (`src/services/jev.ts`)**:
   Menyediakan fungsi pembalut (*wrapper*) untuk memanggil TypeSafe API dengan sokongan fallback simulasi pintar jika API key belum dikonfigurasi.
2. **Integrasi Tool Ejen**:
   Menambah fungsi perkakas `jev_system_one_evaluate` ke dalam senarai perkakas Gemini (`gemini.ts`) supaya ejen boleh menjalankan inferens System-1 berkependaman rendah bila-bila masa diperlukan.
3. **Kad UI Eksekusi**:
   Memaparkan taburan kebarangkalian dan skor keyakinan Jev secara visual dalam *Execution Trace* di papan pemuka ABANGCOLEK-OS.
