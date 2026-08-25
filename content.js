window.BAMEDICALE_DATA = {
  sources: [
    { label: "World Health Organization", note: "Cancer prevention, early detection, treatment, and survivorship", url: "https://www.who.int/news-room/fact-sheets/detail/cancer" },
    { label: "National Cancer Institute", note: "Cancer biology, diagnosis, staging, and treatment", url: "https://www.cancer.gov/about-cancer" },
    { label: "IARC Global Cancer Observatory", note: "Global cancer data and registry context", url: "https://gco.iarc.who.int/today" },
    { label: "Kementerian Kesehatan RI", note: "Indonesia cancer policy and early detection context", url: "https://www.kemkes.go.id/" }
  ],
  diseaseTaxonomy: [
    { id: "cardiovascular", name: "Cardiovascular Diseases", descriptor: "Heart, blood vessels, and circulation", icon: "heart" },
    { id: "respiratory", name: "Respiratory Diseases", descriptor: "Lungs, airways, and breathing", icon: "lungs" },
    { id: "neurological", name: "Neurological Diseases", descriptor: "Brain, nerves, and spinal cord", icon: "brain" },
    { id: "gastrointestinal", name: "Gastrointestinal Diseases", descriptor: "Digestive tract, stomach, and intestines", icon: "digestive" },
    { id: "liver-biliary-pancreatic", name: "Liver, Biliary & Pancreatic Diseases", descriptor: "Liver, gallbladder, bile ducts, and pancreas", icon: "liver" },
    { id: "kidney-urinary", name: "Kidney & Urinary Diseases", descriptor: "Kidneys, urinary tract, and bladder", icon: "kidney" },
    { id: "endocrine-metabolic", name: "Endocrine & Metabolic Diseases", descriptor: "Hormones, diabetes, and metabolism", icon: "molecule" },
    { id: "hematologic", name: "Hematologic Diseases", descriptor: "Blood, bone marrow, and blood disorders", icon: "blood" },
    { id: "cancer-neoplastic", name: "Cancer & Neoplastic Diseases", descriptor: "Benign and malignant tumor and neoplasia", icon: "ribbon" },
    { id: "infectious", name: "Infectious Diseases", descriptor: "Bacterial, viral, fungal, and parasitic infections", icon: "microbe" },
    { id: "musculoskeletal", name: "Musculoskeletal Diseases", descriptor: "Bones, muscles, joints, and soft tissues", icon: "bone" },
    { id: "rheumatologic-autoimmune", name: "Rheumatologic & Autoimmune Diseases", descriptor: "Autoimmune and inflammatory disorders", icon: "shield" },
    { id: "dermatologic", name: "Dermatologic Diseases", descriptor: "Skin, hair, nails, and related conditions", icon: "skin" },
    { id: "obstetric-gynecologic", name: "Obstetric & Gynecologic Diseases", descriptor: "Women's reproductive and hormonal health", icon: "female" },
    { id: "male-reproductive", name: "Male Reproductive Diseases", descriptor: "Men's reproductive and sexual health", icon: "male" },
    { id: "breast", name: "Breast Diseases", descriptor: "Benign and malignant breast conditions", icon: "breast" },
    { id: "eye", name: "Eye Diseases", descriptor: "Eye health and vision disorders", icon: "eye" },
    { id: "ear-nose-throat", name: "Ear, Nose & Throat Diseases", descriptor: "Ear, nose, throat, and related structures", icon: "ear" },
    { id: "oral-dental", name: "Oral & Dental Diseases", descriptor: "Mouth, teeth, gums, and oral health", icon: "tooth" },
    { id: "allergic-immunologic", name: "Allergic & Immunologic Diseases", descriptor: "Allergies, asthma, and immune disorders", icon: "immune" },
    { id: "mental-behavioral", name: "Mental & Behavioral Disorders", descriptor: "Mental health and behavioral conditions", icon: "mind" },
    { id: "pediatric-congenital", name: "Pediatric & Congenital Diseases", descriptor: "Children's health and congenital conditions", icon: "child" },
    { id: "genetic-rare", name: "Genetic & Rare Diseases", descriptor: "Genetic disorders and rare conditions", icon: "dna" },
    { id: "nutritional", name: "Nutritional Diseases", descriptor: "Nutrition-related health conditions", icon: "nutrition" },
    { id: "injury-poisoning-other", name: "Injury, Poisoning & Other Conditions", descriptor: "Injuries, poisoning, and other conditions", icon: "aid" },
    { id: "preventive-public-health", name: "Preventive Medicine & Public Health", descriptor: "Prevention, wellness, and population health", icon: "prevention" }
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
      primaryAudience: "PUBLIC",
      secondaryAudiences: ["DOCTOR", "HEALTHCARE WORKER"],
      author: { name: "BA Medicale", type: "Organization" },
      primaryTopic: "Epidemiology & Statistics",
      tags: ["Health Policy", "Prevention & Risk", "Early Detection", "Tumor & Cancer Basics"],
      primaryDiseaseGroup: "cancer-neoplastic",
      secondaryDiseaseGroups: ["preventive-public-health"],
      diseaseCondition: "Cancer across organ systems",
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
    },
    "tumor-vs-cancer-guide": {
      id: "tumor-vs-cancer-guide",
      slug: "tumor-vs-cancer-understanding-the-difference",
      title: "Tumor vs Cancer: Understanding the Difference",
      seoTitle: "Tumor vs Cancer: Understanding the Difference | BA Medicale",
      dek: "A clear, non-technical guide to two commonly confused terms: what a tumor is, what cancer means, and why appropriate evaluation matters.",
      excerpt: "A practical guide to benign and malignant tumor, cancer, metastasis, biopsy, and when a new or changing lump needs medical assessment.",
      primaryAudience: "PUBLIC",
      secondaryAudiences: ["DOCTOR", "HEALTHCARE WORKER"],
      author: { name: "BA Medicale", type: "Organization" },
      primaryTopic: "Tumor & Cancer Basics",
      tags: ["Benign Tumor", "Malignant Tumor", "Biopsy & Pathology"],
      primaryDiseaseGroup: "cancer-neoplastic",
      secondaryDiseaseGroups: [],
      diseaseCondition: "Tumor and cancer",
      diseaseSite: "All cancer sites",
      contentType: "Educational guide",
      sourceAttribution: "Submitted BA Medicale educational article",
      publishedDate: "",
      updatedDate: "",
      sortOrder: 2,
      focalPosition: "50% 50%",
      sourcePdf: "assets/articles/tumor-vs-cancer-educational-article.pdf",
      cover: "assets/articles/tumor-vs-cancer-educational-guide.jpg",
      label: "Public education guide",
      intro: [
        "A tumor and cancer are related terms, but they do not mean exactly the same thing. A tumor is an abnormal mass of tissue that may be benign or malignant. Cancer is malignant disease, in which abnormal cells can invade nearby tissues and may spread to other parts of the body.",
        "Understanding the difference can reduce unnecessary fear while reinforcing the value of proper evaluation. The appearance, size, location, or growth rate of a lump alone cannot establish a diagnosis. Examination, imaging, and sometimes biopsy help healthcare professionals determine what an abnormal growth represents."
      ],
      sections: [
        {
          title: "What is a tumor?",
          body: [
            "The body is made of cells that normally grow, divide, perform specific functions, and die in a controlled way. When this regulation is disrupted, cells may grow or accumulate abnormally. A collection of these cells can form a mass called a tumor, also known as a neoplasm.",
            "Tumors are commonly described as benign or malignant. A benign tumor is non-cancerous and generally remains localized. Many benign tumors grow slowly and may never cause serious problems, but benign does not automatically mean harmless. A benign tumor can still matter if it grows large, presses on nerves or organs, causes bleeding, produces hormones, or develops in a confined space such as the brain."
          ],
          bullets: [
            "Examples of benign tumors include lipomas from fat tissue, adenomas from glandular tissue, uterine fibroids, some meningiomas, and hemangiomas involving blood vessels.",
            "A benign tumor does not invade surrounding tissues or spread to distant organs."
          ]
        },
        {
          title: "What is cancer?",
          body: [
            "Cancer is a broad term for diseases characterized by malignant cells. These cells have acquired biological changes that allow them to grow abnormally, invade nearby structures, and potentially spread.",
            "A malignant tumor is cancerous. Cancer cells can infiltrate surrounding tissue and may enter blood vessels or lymphatic channels. Some can travel to distant organs and establish new cancer deposits, a process called metastasis."
          ],
          bullets: [
            "Breast, lung, colon, and liver cancers commonly form solid malignant tumors.",
            "Not every cancer forms a solid lump. Leukemia is a cancer of blood-forming tissues and is generally not described as a single solid tumor."
          ]
        },
        {
          title: "The main differences",
          body: [
            "Biological behavior is more complex than a simple checklist, but several characteristics help explain the difference between benign tumors and malignant tumors."
          ],
          compare: [
            ["Clinical dimension", "Benign tumor", "Malignant tumor or cancer"],
            ["Nature", "Non-cancerous.", "Cancerous."],
            ["Local behavior", "Usually remains localized and may have relatively clear boundaries.", "Can invade nearby tissue and may have irregular or infiltrative borders."],
            ["Growth", "Often grows slowly, although growth rate alone cannot determine whether a mass is cancerous.", "May grow more rapidly or unpredictably, but growth rate alone is not diagnostic."],
            ["Spread", "Does not metastasize.", "May spread through blood or lymphatic pathways."],
            ["Health impact", "Can still cause important problems because of size or location.", "Can become life-threatening when it invades vital structures or spreads to distant organs."]
          ]
        },
        {
          title: "How normal cells can become cancerous",
          body: [
            "Cancer usually develops through an accumulation of changes in the genetic material and regulatory systems of cells. These changes can occur over time. Aging, inherited genetic factors, environmental exposures, infections, radiation, tobacco, alcohol, and other lifestyle or biological influences may contribute depending on the cancer type.",
            "The process is not simply normal cell, then benign tumor, then cancer in every person. Some cancers develop without a previously recognized benign tumor, and most benign tumors never become malignant. This sequence is best understood as a simplified educational model, not a universal pathway."
          ]
        },
        {
          title: "Why appearance alone is not enough",
          body: [
            "A lump that feels smooth or grows slowly is not automatically benign, and a rapidly growing or irregular mass is not automatically cancer. Symptoms, physical examination, imaging, laboratory tests, and the person's overall clinical context can provide important clues, but they may not establish the final diagnosis.",
            "When necessary, a biopsy allows tissue or cells to be examined by a pathologist. This microscopic evaluation can determine whether a lesion is benign, malignant, or has another diagnosis. Additional tests may help identify the tumor type, molecular characteristics, extent of disease, or stage."
          ]
        },
        {
          title: "Why early evaluation matters",
          body: [
            "Many lumps and abnormal findings are not cancer. Nevertheless, a new or changing mass should not be classified by appearance or assumption alone. Appropriate evaluation can identify benign conditions that need little or no treatment, benign tumors that need management because of size or location, and cancers for which earlier diagnosis may provide more treatment options."
          ],
          bullets: [
            "Seek medical assessment for a new persistent lump or an existing lump that changes in size or character.",
            "Unexplained bleeding, persistent swelling, unexplained weight loss, or symptoms that do not resolve can also justify assessment. These findings can have many causes and are not proof of cancer.",
            "The same organ can develop benign and malignant growths. The distinction depends on the cells and biological behavior of the lesion, not simply on where it appears."
          ]
        }
      ],
      takeaways: [
        "A tumor is an abnormal growth or mass and can be benign or malignant. Cancer is malignant disease.",
        "Not every tumor is cancer, and some cancers, such as leukemia, do not form a typical solid tumor.",
        "A diagnosis should be based on appropriate medical assessment rather than the appearance, size, location, or growth rate of a lump alone."
      ],
      references: [
        "Submitted source: BAMedicale_Tumor_vs_Cancer_Educational_Article.pdf.",
        "Educational scope: this guide supports general understanding and does not replace individualized medical evaluation, diagnosis, or treatment."
      ],
      promotion: {
        hook: "A tumor is not automatically cancer. Here is the difference that matters.",
        teaser: [
          "Benign and malignant growths can behave very differently, and a lump cannot be classified by appearance alone.",
          "Learn why examination, imaging, and sometimes biopsy guide the next step."
        ],
        cta: "Read the full guide at BAMedicale.com",
        hashtags: ["#TumorVsCancer", "#CancerEducation", "#BAMedicaleCom"]
      }
    }
  },
  ebooks: [
    { slug: "clinical-oncology-foundations", title: "Clinical Oncology Foundations", primaryAudience: "DOCTOR", audience: "Medical students and general physicians", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Cancer across organ systems", topics: ["Diagnosis", "Staging", "Biopsy"], contentType: "eBook", price: "Rp149.000", state: "Planned release", text: "A structured foundation for cancer terminology, diagnostic workup, staging, biopsy, and risk communication." },
    { slug: "practical-surgical-oncology", title: "Practical Surgical Oncology", primaryAudience: "DOCTOR", audience: "Residents and surgical learners", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Solid tumor", topics: ["Surgery", "Treatment Planning"], contentType: "eBook", price: "Rp249.000", state: "Planned release", text: "A study pathway for surgical thinking, multidisciplinary planning, and perioperative oncology context." },
    { slug: "breast-cancer-clinical-guide", title: "Breast Cancer Clinical Guide", primaryAudience: "DOCTOR", audience: "Clinicians and advanced learners", primaryDiseaseGroup: "breast", secondaryDiseaseGroups: ["cancer-neoplastic"], diseaseCondition: "Breast cancer", topics: ["Diagnosis", "Treatment", "Patient Education"], contentType: "eBook", price: "Rp299.000", state: "Planned release", text: "A focused guide to breast symptoms, diagnostic pathways, treatment concepts, and patient education." }
  ],
  events: [
    { date: "Coming soon", format: "Live seminar", title: "Cancer diagnosis: from finding to tissue confirmation", primaryAudience: "DOCTOR", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Cancer across organ systems", topics: ["Diagnosis", "Pathology", "Biopsy"], contentType: "Seminar", text: "Program details will be published once the faculty, date, and official registration channel are confirmed." },
    { date: "Coming soon", format: "Case discussion", title: "Multidisciplinary thinking in solid tumor", primaryAudience: "DOCTOR", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Solid tumor", topics: ["Treatment Planning", "Multidisciplinary Care"], contentType: "Seminar", text: "A future learning format for discussing clinical questions across diagnosis, treatment, and follow-up." },
    { date: "Coming soon", format: "On-demand", title: "Public understanding of tumor and cancer", primaryAudience: "PUBLIC", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Tumor and cancer", topics: ["Signs & Symptoms", "Diagnosis", "Treatment"], contentType: "Seminar", text: "A planned patient-facing session on symptoms, diagnosis, treatment language, and questions to ask." }
  ],
  featuredSeminar: {
    primaryAudience: "DOCTOR",
    primaryDiseaseGroup: "endocrine-metabolic",
    secondaryDiseaseGroups: ["cancer-neoplastic"],
    diseaseCondition: "Thyroid nodules",
    topics: ["Diagnosis", "Imaging", "Pathology", "Treatment Planning"],
    contentType: "Seminar",
    format: "Live webinar nasional",
    title: "Manajemen of Thyroid Nodules",
    subtitle: "\"How to Make a Good Diagnosis yang Tepat?\"",
    date: "Saturday, 19 September 2026",
    time: "09.00–11.00 WIB",
    location: "Zoom Meeting",
    accreditation: "HK.02.02/F/3868/2023",
    registration: "s.kemkes.go.id/WebinarMTN",
    contact: "Melati: 0821-236-6331 · bamedicale@gmail.com",
    quota: "Limited to 1,000 participants",
    organizer: "Organized by Rumah Sakit Kanker Dharmais.",
    host: "Department of Head and Neck proudly presents this program.",
    audience: ["General practitioners and specialist doctors across Indonesia.", "Limited to 1,000 participants."],
    faculty: [
      ["Keynote speech", "dr. Eniarti, M.Sc., Sp.K.J., M.M.R., QHIA"],
      ["Speaker", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["Speaker", "dr. Achmad Fachri, SpRad.(K)"],
      ["Speaker", "dr. Vinesia Lestari Riddi, SpPA., MPH"],
      ["Moderator", "dr. Adlina Karisyah, SpB"]
    ],
    sessions: [
      ["Current Diagnostic Approach and Therapy Selection for Thyroid Nodules", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["Ultrasound Image and TIRADS Classification in Thyroid Nodules", "dr. Achmad Fachri, SpRad(K)"],
      ["BETHESDA Classification in Thyroid Nodules", "dr. Vinesia Lestari Riddi, SpPA, MPH"]
    ],
    outcomes: ["Kemenkes SKP value", "Current evidence-based topic", "Experienced faculty", "Interactive live question-and-answer session"],
    artwork: "assets/events/thyroid-nodule-webinar-sept19-2026.png",
    detailUrl: "events/management-thyroid-nodules-2026.html"
  },
  profile: { name: "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)", role: "Surgical oncologist and BA Medicale physician educator", text: "BA Medicale is shaped around clear, responsible medical education: enough context to help people ask better questions, and enough structure to help doctors and healthcare workers continue learning across medical disciplines.", image: "assets/medical/oncology-cellular-hero.png" }
};
