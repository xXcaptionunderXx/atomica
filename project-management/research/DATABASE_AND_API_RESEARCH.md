# ATOMICA: Scientific Database & External API Research

> **Data Ingestion Architectures, REST APIs, Rate Limits, and Local Caching**
> **Deliverable:** `research/DATABASE_AND_API_RESEARCH.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Primary Scientific Data Providers

### 1.1 PubChem REST API (PUG-REST)
- **Base Endpoint:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug/`
- **Capabilities:**
  - Query by compound name, SMILES, InChIKey, or CAS registry number.
  - Retrieve 2D SDF/JSON and 3D conformer coordinates.
  - Retrieve experimental physical properties: melting/boiling points, solubility, toxicity, GHS hazard classifications, biological activities.
- **Rate Limits & Policies:** NCBI limits requests to no more than 5 requests per second and no more than 400 requests per minute. Client must implement debouncing, request throttling, and local IndexedDB response caching.

### 1.2 RCSB Protein Data Bank (PDB REST & Data API)
- **Base Endpoint:** `https://data.rcsb.org/rest/v1/`
- **Capabilities:**
  - Query macromolecular structures by PDB ID (e.g. `1CRN` Crambin, `4HHB` Hemoglobin).
  - Retrieve atomic coordinate files in `.pdb` or `.cif` (mmCIF) format.
  - Retrieve sequence annotations, secondary structure definitions (HELIX, SHEET records), and ligand binding sites.

### 1.3 UniProt Knowledgebase (UniProtKB)
- **Base Endpoint:** `https://rest.uniprot.org/uniprotkb/`
- **Capabilities:**
  - Functional annotation of proteins, enzymatic catalytic mechanisms, active site residues, and disease mutations.

### 1.4 NIST Chemistry WebBook
- Reference source for standard enthalpy of formation ($\Delta H_f^\circ$), standard molar entropy ($S^\circ$), heat capacity ($C_p$), and gas-phase ion energetics.

---

## 2. Ingestion & Offline Resilience Architecture

To ensure the workstation remains fully responsive and functional even without active internet connectivity:
1. **Bundled Core Scientific Database:**
   - Pre-packaged local database containing all 118 elements, 500 essential inorganic and organic molecules, all 20 standard amino acids, nucleotides, common metabolites, and standard lipid structures.
2. **LRU Client Cache (Dexie.js / IndexedDB):**
   - Every external PubChem or PDB query is permanently cached locally. Subsequent searches for the same compound resolve in $<5\text{ ms}$ from disk.
3. **Graceful Fallback:** When internet connectivity is offline or NCBI rate limits are reached, the system clearly signals offline status while continuing to serve cached and locally calculable models.
