# BishwasChain

📜 *Blockchain-Backed Certificate Verification Platform*

Biswaschain is a web-based platform that leverages the *Algorand blockchain* to issue and verify digital certificates.  
It solves the pervasive problem of fake credentials by providing a secure, tamper-proof, and universally verifiable system for academic and professional certificates.

---

## 🔹 The Problem
The current system for managing certificates is *vulnerable and inefficient*:

- *Easy Forgery:* Anyone can create fake certificates using simple digital tools like Photoshop.  
- *Verification Challenges:* Recruiters and institutions struggle to verify the authenticity of credentials, leading to wasted time and resources.
- *Fake certificates are easy to create and hard to detect
- *Lack of Trust:* Traditional digital certificates (e.g., PDFs) can be copied or tampered with, creating a significant trust gap in professional and academic achievements.  

---

## 🔹 The Solution
Biswaschain leverages *blockchain technology* to create a trusted and transparent verification system.  
Each certificate is minted as a unique *Algorand Standard Asset (ASA), securing it on an **immutable public ledger*.

### How It Works
1. *Organizers* (colleges, companies, hackathon hosts) upload event details and attendee lists to the Biswaschain platform.
2. **AI fraud detection** ensures only valid certificates are minted. 
3. The system automatically generates a *PDF certificate* for each attendee and mints a corresponding *ASA* on the Algorand blockchain.
4. Each attendee receives an email containing:
   - A link to their *PDF certificate*  
   - The *NFT details* (Asset ID and Transaction ID)  
   - A *QR code* for easy verification
5. When scanned, the QR code redirects to an *Algorand blockchain explorer* where the on-chain record of the certificate can be instantly viewed, verifying its authenticity.

---

## 🔹 Key Features
- *Tamper-Proof Certificates:* Every certificate is an immutable record on the blockchain.
- **AI template validation** to stop fake uploads. 
- *Streamlined Issuance:* Organizers can issue a large number of certificates with a single upload.  
- *Effortless Verification:* Certificates can be verified instantly by scanning a QR code or entering the unique Asset ID.  
- *Email Automation:* The platform automatically sends certificates and verification details directly to attendees.  
- *Scalability:* Designed to handle everything from small workshops to large universities.  

---

## 🔹 Impact
- *Restores Trust:* Eliminates the possibility of forged certificates, making credentials truly reliable.  
- *Saves Time:* Automates the verification process for recruiters, HR departments, and institutions.  
- *Empowers Individuals:* Gives students and professionals verifiable achievements they can showcase globally.  
- *Practical Blockchain Use:* Demonstrates a real-world, impactful application of blockchain technology.

---

## 🔹 Tech Stack

| Category       | Technology             | Description |
|-----------------|------------------------|------------|
| *Frontend*    | React + TailwindCSS    | Modern, responsive user interface |
| *Backend*     | Fastapi / Python       | Handles certificate generation, APIs, and blockchain interactions |
| *Blockchain*  | Algorand               | High speed, low fees, and robust security |
| *Email Service* | Gmail SMTP | Automates email delivery of certificates and verification links |
| *QR Code*     | qrcode.react           | React component to generate dynamic QR codes |

---

## 🔹 Demo Flow (Hackathon Pitch)
1. *Organizer:* Uploads participant emails and event details.  
2. *Biswaschain:* Generates a certificate and mints an ASA for each participant.  
3. *Attendee:* Receives an email with the certificate PDF, NFT details, and a QR code.  
4. *Recruiter/Judge:* Scans the QR code using any smartphone.  
5. *Verification:* The scan redirects to the Algorand blockchain explorer, displaying the immutable on-chain record of the certificate.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)  
- [Python 3.9+](https://www.python.org/) (if using Python backend)  
- [Algorand Sandbox / TestNet](https://developer.algorand.org/docs/get-started/)  
- A configured Algorand wallet and API key for TestNet transactions.

### Clone the Repository
```bash
git clone (https://github.com/ranadebsaha/algorand-frontend)
cd Biswaschain
