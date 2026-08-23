window.BAMEDICALE_DATA = {
  sources: [
    { label: "World Health Organization", note: "Cancer prevention, early detection, treatment, and survivorship", url: "https://www.who.int/news-room/fact-sheets/detail/cancer" },
    { label: "National Cancer Institute", note: "Cancer biology, diagnosis, staging, and treatment", url: "https://www.cancer.gov/about-cancer" },
    { label: "IARC Global Cancer Observatory", note: "Global cancer data and registry context", url: "https://gco.iarc.who.int/today" },
    { label: "Kementerian Kesehatan RI", note: "Indonesia cancer policy and early detection context", url: "https://www.kemkes.go.id/" }
  ],
  systems: [
    ["brain", "Brain & CNS", "Brain, spinal cord, and neuro-oncology"], ["head", "Head & neck", "Oral cavity, nasopharynx, larynx, and salivary glands"], ["thyroid", "Thyroid & endocrine", "Thyroid, adrenal, and endocrine neoplasms"], ["breast", "Breast", "Breast symptoms, diagnosis, treatment, and survivorship"], ["lung", "Thoracic", "Lung, pleura, mediastinum, and thoracic tumor"], ["gi", "Digestive system", "Esophagus, stomach, bowel, and gastrointestinal tumor"], ["liver", "Liver & pancreas", "Hepatobiliary and pancreatic neoplasms"], ["gu", "Genitourinary", "Kidney, bladder, prostate, and testicular tumor"], ["gyn", "Gynecologic", "Cervix, uterus, ovary, and related cancers"], ["skin", "Skin", "Melanoma and non-melanoma skin cancers"], ["bone", "Bone & soft tissue", "Bone tumor, soft-tissue tumor, and sarcoma"], ["blood", "Blood & lymph", "Leukemia, lymphoma, myeloma, and related disorders"], ["rare", "Rare & pediatric", "Uncommon tumor and childhood neoplasms"]
  ],
  journey: [
    ["01", "Concern or discovery", "A symptom, a screening result, or an unexpected finding may begin the conversation."], ["02", "Clinical evaluation", "History, examination, and targeted tests help clarify what needs attention."], ["03", "Imaging", "Scans and imaging describe anatomy and guide the next diagnostic step."], ["04", "Pathology or biopsy", "Tissue and cell analysis can establish the diagnosis and disease type."], ["05", "Diagnosis and staging", "Type, grade, biomarkers, and extent of disease inform the clinical picture."], ["06", "Treatment planning", "Options are selected around tumor type, stage, health, and individual goals."], ["07", "Treatment and support", "Care may include surgery, radiation, systemic therapy, and supportive care."], ["08", "Follow-up and beyond", "Survivorship, recurrence concerns, advanced care, and caregiver support remain important."]
  ],
  library: [
    { type: "Public guide", title: "Tumor, cancer, and the words clinicians use", text: "A clear starting point for understanding benign growths, malignant disease, and why terms matter.", href: "public.html#tumor-cancer" }, { type: "Diagnosis", title: "From imaging to biopsy", text: "What different tests can and cannot answer when a lesion needs investigation.", href: "public.html#diagnosis" }, { type: "Professional", title: "Staging and treatment selection", text: "A structured orientation to stage, pathology, biomarkers, and multidisciplinary planning.", href: "clinical.html#staging" }, { type: "Care", title: "Living with and beyond cancer", text: "Supportive care, follow-up, survivorship, and practical questions for appointments.", href: "public.html#living" }
  ],
  updates: [
    { eyebrow: "Explore", title: "Interactive anatomy", text: "Browse tumor and cancer by body system.", href: "#explorer", tone: "anatomy" }, { eyebrow: "Public track", title: "Understand the next step", text: "Plain-language diagnosis and treatment guides.", href: "public.html", tone: "public" }, { eyebrow: "Clinical track", title: "Build professional depth", text: "Guidelines, cases, pathology, and treatment context.", href: "clinical.html", tone: "clinical" }, { eyebrow: "Learning", title: "Courses and seminars", text: "Programs, session notes, and future on-demand learning.", href: "seminar.html", tone: "courses" }, { eyebrow: "Media", title: "Watch in context", text: "Source-labelled video education and physician appearances.", href: "videos.html", tone: "media" }
  ],
  ebooks: [
    { slug: "clinical-oncology-foundations", title: "Clinical Oncology Foundations", audience: "Medical students and general physicians", price: "Rp149.000", state: "Planned release", text: "A structured foundation for cancer terminology, diagnostic workup, staging, biopsy, and risk communication." }, { slug: "practical-surgical-oncology", title: "Practical Surgical Oncology", audience: "Residents and surgical learners", price: "Rp249.000", state: "Planned release", text: "A study pathway for surgical thinking, multidisciplinary planning, and perioperative oncology context." }, { slug: "breast-cancer-clinical-guide", title: "Breast Cancer Clinical Guide", audience: "Clinicians and advanced learners", price: "Rp299.000", state: "Planned release", text: "A focused guide to breast symptoms, diagnostic pathways, treatment concepts, and patient education." }
  ],
  events: [
    { date: "Coming soon", format: "Live seminar", title: "Cancer diagnosis: from finding to tissue confirmation", text: "Program details will be published once the faculty, date, and official registration channel are confirmed." }, { date: "Coming soon", format: "Case discussion", title: "Multidisciplinary thinking in solid tumor", text: "A future learning format for discussing clinical questions across diagnosis, treatment, and follow-up." }, { date: "Coming soon", format: "On-demand", title: "Public understanding of tumor and cancer", text: "A planned patient-facing session on symptoms, diagnosis, treatment language, and questions to ask." }
  ],
  featuredSeminar: {
    format: "Live webinar nasional",
    title: "Management of Thyroid Nodules",
    subtitle: "\"How to Make a Good Diagnosis yang Tepat?\"",
    date: "Saturday, 19 September 2026",
    time: "09.00–11.00 WIB",
    location: "Zoom Meeting",
    accreditation: "HK.02.02/F/3868/2023",
    registration: "s.kemkes.go.id/WebinarMTN",
    contact: "Melati: 0821-236-6331 · bamedicale@gmail.com",
    quota: "Limited to 1,000 participants",
    organizer: "Organized by Rumah Sakit Kanker Dharmais.",
    host: "Department of Head and Neck proudly presents the program.",
    audience: ["Doctors and specialists across Indonesia.", "Target participants: 1,000 doctors.", "Primary participants: general practitioners and specialist doctors; also relevant clinicians in surgery, otolaryngology, internal medicine, nuclear medicine, pathology, radiology, and oncology."],
    faculty: [
      ["Keynote speech", "dr. Eniarti, M.Sc., Sp.K.J., M.M.R., QHIA"],
      ["Speaker", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["Speaker", "dr. Achmad Fachri, SpRad.(K)"],
      ["Speaker", "dr. Vinesia Lestari Riddi, SpPA., MPH"],
      ["Moderator", "dr. Adlina Karisyah, SpB"]
    ],
    sessions: [
      ["09.00–09.40", "Current Diagnostic Approach and Therapy Selection for Thyroid Nodules", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["09.40–10.20", "Ultrasound Image and TI-RADS Classification in Thyroid Nodules", "dr. Achmad Fachri, SpRad.(K)"],
      ["10.20–11.00", "BETHESDA Classification in Thyroid Nodules", "dr. Vinesia Lestari Riddi, SpPA., MPH"]
    ],
    outcomes: ["Initial evaluation of patients with thyroid nodules", "Ultrasound interpretation using ACR TI-RADS", "When FNAB is needed", "Interpreting the Bethesda System", "When surgery is needed", "Selecting patients for active surveillance", "Indications for radioiodine", "Targeted therapy for advanced thyroid cancer", "Applying ATA, NCCN, and ETA guidelines in daily practice"],
    artwork: "assets/events/thyroid-nodule-webinar-2026.png"
  },
  profile: { name: "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)", role: "Surgical oncologist and BA Medicale physician educator", text: "BA Medicale is shaped around clear, responsible oncology education: enough context to help people ask better questions, and enough structure to help clinicians continue learning.", image: "assets/people/dr-bob-approved-bob13.png" }
};
