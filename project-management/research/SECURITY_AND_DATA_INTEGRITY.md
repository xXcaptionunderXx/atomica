# ATOMICA: Security, Data Integrity & Offline Resilience Research

> **Client-Side Sandbox Security, API Proxying, CORS, and Data Sanitation**
> **Deliverable:** `research/SECURITY_AND_DATA_INTEGRITY.md` | **Lead Researcher:** `agent/claude`

---

## 1. Network & API Security Boundaries

### 1.1 Third-Party External API Communication
ATOMICA communicates with external scientific repositories (PubChem, RCSB PDB, UniProt).
- **CORS Handling:** Direct browser-to-NCBI requests frequently encounter Cross-Origin Resource Sharing (CORS) restrictions. The architecture includes an optional lightweight backend proxy and fallback to direct PUG-REST endpoints supporting `crossOrigin: "anonymous"`.
- **Egress Scoping & Rate Limiting:** All outbound HTTP requests are routed through a centralized API gateway module that enforces rate limits (max 5 req/sec), caching, and backoff with jitter on HTTP 429 / 503 responses.

### 1.2 Input Sanitization & Serialization Safety
- **SDF / PDB / SMILES Parsing:** Untrusted text files imported by users (custom molecules or lab notebooks) must be parsed using strict, memory-safe parsers without evaluating dynamic scripts or `eval()`.
- **Malicious Payload Mitigation:** Protect against prototype pollution when deserializing JSON experiment files into molecular graph memory.
- **IndexedDB Isolation:** User-saved experiments and custom molecule databases are scoped strictly to the origin's private IndexedDB storage.

---

## 2. Chemical Data Integrity & Provenance Tracking

Every molecule and reaction record stored or displayed must retain its provenance metadata:
- Origin source (`pubchem_cid`, `rcsb_pdb_id`, `user_constructed`, `in_silico_reaction`).
- Revision timestamp and cryptographic hash (`sha256` of canonical InChI or sequence) to ensure experiment reproducibility across different sessions and devices.
