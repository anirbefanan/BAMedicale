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
  articles: {
    "indonesia-cancer-statistics-2026": {
      id: "indonesia-cancer-statistics-2026",
      slug: "indonesia-cancer-tumor-statistics-2026-policy-update",
      title: "Indonesia Cancer & Tumor Statistics: 2026 Policy Update",
      seoTitle: "Indonesia Cancer & Tumor Statistics 2026 | BA Medicale",
      dek: "A comprehensive public health review of the 2026 epidemiological update, adapted from the submitted BA Medicale PDF into a web-readable digital magazine view.",
      excerpt: "A public health review of Indonesia's projected cancer burden, prevention context, and the clinical distinction between tumor and cancer.",
      audiences: ["PUBLIC", "DOCTOR", "HEALTHCARE WORKER"],
      primaryTopic: "Epidemiology & Statistics",
      tags: ["Health Policy", "Prevention & Risk", "Early Detection", "Tumor & Cancer Basics"],
      diseaseSite: "All cancer sites",
      contentType: "Article",
      sourceAttribution: "GLOBOCAN, IARC, WHO, Kementerian Kesehatan RI, and PERABOI",
      publishedDate: "",
      updatedDate: "",
      sortOrder: 1,
      focalPosition: "50% 50%",
      sourcePdf: "assets/articles/indonesia-cancer-statistics-report.pdf",
      cover: "assets/articles/indonesia-cancer-statistics-2026-cover.jpg",
      label: "Health policy brief",
      stats: [
        ["396,914", "Projected new cancer cases in 2026"],
        ["234,511", "Projected annual cancer deaths in 2026"],
        ["1,257,297", "Projected 5-year prevalent cases in 2026"]
      ],
      intro: [
        "The latest public health projections for 2026 outline a substantial and shifting burden of cancer and tumor pathologies in Indonesia. Data from GLOBOCAN, the World Health Organization, and the International Agency for Research on Cancer project 396,914 new cancer diagnoses and 234,511 disease-attributable deaths for the year 2026 alone.",
        "At the same time, the 5-year cancer prevalence is projected to surpass 1.25 million cases, creating resource, economic, and system-level pressure across Indonesian healthcare. A clear understanding of clinical terminology, epidemiology, prevention, and care access is essential for public education and policy planning."
      ],
      sections: [
        {
          title: "The clinical frontier: tumor vs cancer distinction",
          body: [
            "A central foundation of oncology and public health education is the distinction between general tumorous growths, or neoplasms, and malignant cancers. Lay vocabulary frequently merges the two terms, but they can represent very different clinical pathways.",
            "A tumor is any abnormal growth or mass of tissue, which may be benign or malignant. Cancer is a subset of tumor characterized by malignant cells that can invade local tissues and metastasize to distant organs. The clinical maxim remains important: all cancers are tumors, but not all tumors are cancer."
          ],
          compare: [
            ["Clinical dimension", "Benign tumor or neoplasm", "Malignant cancer or malignant tumor"],
            ["Infiltration and growth", "Local abnormal tissue growth that does not invade or infiltrate surrounding healthy tissues.", "Rapid unchecked growth characterized by malignant cells that aggressively invade and destroy adjacent tissues."],
            ["Metastasis or spread", "Remains localized to its primary site of origin. Cells do not separate to spread to distant organs.", "Can shed cells that travel through the bloodstream or lymphatic system to form secondary tumors in other organs."],
            ["Clinical risk and prognosis", "Generally non-life-threatening, although removal may be needed if it causes pressure on vital structures.", "Potentially life-threatening if not diagnosed early and managed with appropriate clinical intervention."],
            ["Key examples", "Lipomas, adenomas, and uterine fibroids.", "Breast carcinoma, lung carcinoma, hepatocellular carcinoma, and colorectal cancer."]
          ]
        },
        {
          title: "National epidemiological profile: top 5 cancers in 2026",
          body: [
            "The 2026 epidemiological dataset highlights differences between disease incidence, or the frequency of new diagnoses, and disease mortality, or the frequency of deaths.",
            "Breast cancer and cervical cancer lead in incidence, while lung cancer and liver cancer are leading causes of cancer-related death. This divergence reflects different survival profiles and the need for targeted, site-specific clinical interventions."
          ],
          bullets: [
            "Breast cancer is projected to remain the most frequently diagnosed malignancy, with 73,572 new cases and 8,627 deaths.",
            "Cervical cancer is projected at 36,633 new cases and 8,028 annual deaths, representing a substantial preventable burden through HPV vaccination and systematic Pap/HPV screening.",
            "Lung cancer is projected at 33,712 new cases and 18,771 annual deaths, making it the most fatal malignancy in the dataset and emphasizing the impact of late-stage diagnosis.",
            "Colorectal cancer is projected at 20,615 cases and 11,696 deaths.",
            "Liver cancer is projected at 20,074 cases and 13,528 deaths, with late clinical presentation and chronic viral infections such as hepatitis B contributing to the burden."
          ]
        },
        {
          title: "Driving forces behind the increasing burden",
          body: [
            "The projected rise in cancer incidence and tumor prevalence is driven by demographic, environmental, behavioral, and structural factors across Indonesia."
          ],
          bullets: [
            "Population aging increases the number of people reaching ages where biological cellular mechanisms become more vulnerable to DNA damage and neoplastic transformation.",
            "Behavioral and lifestyle shifts, including urbanization, dietary change, physical inactivity, obesity, and high smoking rates, contribute to cancer risk.",
            "Chronic oncogenic infections remain important structural drivers, including HPV in cervical cancer and hepatitis B in hepatocellular carcinoma.",
            "Environmental exposure, including urban air pollution, occupational exposure, and carcinogens, contributes to cellular damage over time.",
            "Genetic predisposition and diagnostic gaps can compound delayed access to screening, specialist consultation, and risk assessment."
          ]
        },
        {
          title: "Preventative actions and policy recommendations",
          body: [
            "Public health studies indicate that a significant percentage of cancers can be prevented, and many others can be cured if detected early. National health networks advocate a multi-tiered prevention approach."
          ],
          bullets: [
            "Tobacco cessation and limiting alcohol exposure remain central prevention measures, especially for lung cancer and other aerodigestive tract malignancies.",
            "Nutrition and behavioral changes, including physical activity and diets rich in fruits, vegetables, and whole grains, can help mitigate obesity-related cancer pathways.",
            "Systematic vaccination campaigns, including HPV vaccination and hepatitis B vaccination, support prevention of cervical and liver cancers.",
            "Structured screening and early detection, including breast self-exam, clinical breast exam, mammography, VIA, and Pap tests, can help identify premalignant growths and tumor before metastasis."
          ]
        }
      ],
      takeaways: [
        "Not every tumor is malignant cancer, but any new, changing, or persistent mass, lump, or clinical symptom warrants professional medical evaluation.",
        "Reducing Indonesia's cancer burden requires early detection access, prevention policy, healthy lifestyle support, and quality oncology care.",
        "Epidemiology should guide education: high-incidence cancers and high-mortality cancers need different public health and clinical responses."
      ],
      references: [
        "GLOBOCAN 2022-2026 (IARC / WHO): Global Cancer Observatory - Indonesia Country Profiles.",
        "Kementerian Kesehatan RI (Kemenkes): National Cancer Control Guidelines and Registries.",
        "PERABOI (2021-2024): Panduan Penatalaksanaan Kanker di Indonesia.",
        "WHO: Cancer Country Profiles - Indonesia Epidemiological and Infrastructure Indicators."
      ],
      promotion: {
        hook: "Indonesia's cancer burden is changing. What does the 2026 picture show?",
        teaser: [
          "This update brings projected cancer cases, deaths, and prevalence into one national view.",
          "It also shows why prevention, screening, and access to timely care remain public-health priorities."
        ],
        cta: "Read the full article at BAMedicale.com",
        hashtags: ["#IndonesiaCancer", "#CancerStatistics", "#BAMedicaleCom"]
      }
    }
  },
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
    artwork: "assets/events/thyroid-nodule-webinar-2026.png",
    detailUrl: "events/management-thyroid-nodules-2026.html"
  },
  profile: { name: "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)", role: "Surgical oncologist and BA Medicale physician educator", text: "BA Medicale is shaped around clear, responsible oncology education: enough context to help people ask better questions, and enough structure to help clinicians continue learning.", image: "assets/medical/oncology-cellular-hero.png" }
};
