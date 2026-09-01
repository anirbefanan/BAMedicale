window.BAMEDICALE_DATA = {
  sources: [
    { label: "World Health Organization", note: "Cancer prevention, early detection, treatment, and survivorship", url: "https://www.who.int/news-room/fact-sheets/detail/cancer" },
    { label: "National Cancer Institute", note: "Cancer biology, diagnosis, staging, and treatment", url: "https://www.cancer.gov/about-cancer" },
    { label: "IARC Global Cancer Observatory", note: "Global cancer data and registry context", url: "https://gco.iarc.who.int/today" },
    { label: "Kementerian Kesehatan RI", note: "Indonesia cancer policy and early detection context", url: "https://www.kemkes.go.id/" }
  ],
  diseaseTaxonomy: [
    { id: "cancer-neoplastic", name: "Cancer & Neoplastic Diseases", descriptor: "Explore neoplasia, benign and malignant tumors, cancer diagnosis, pathology, staging, treatment planning, and supportive oncology care across the continuum of disease care.", icon: "ribbon" },
    { id: "cardiovascular", name: "Cardiovascular Diseases", descriptor: "Heart, blood vessels, and circulation", icon: "heart" },
    { id: "respiratory", name: "Respiratory Diseases", descriptor: "Lungs, airways, and breathing", icon: "lungs" },
    { id: "neurological", name: "Neurological Diseases", descriptor: "Brain, nerves, and spinal cord", icon: "brain" },
    { id: "gastrointestinal", name: "Gastrointestinal Diseases", descriptor: "Digestive tract, stomach, and intestines", icon: "digestive" },
    { id: "liver-biliary-pancreatic", name: "Liver, Biliary & Pancreatic Diseases", descriptor: "Liver, gallbladder, bile ducts, and pancreas", icon: "liver" },
    { id: "kidney-urinary", name: "Kidney & Urinary Diseases", descriptor: "Kidneys, urinary tract, and bladder", icon: "kidney" },
    { id: "endocrine-metabolic", name: "Endocrine & Metabolic Diseases", descriptor: "Hormones, diabetes, and metabolism", icon: "molecule" },
    { id: "hematologic", name: "Hematologic Diseases", descriptor: "Blood, bone marrow, and blood disorders", icon: "blood" },
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
      publishedDate: "2026-08-24",
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
      publishedDate: "2026-08-25",
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
    },
    "parotid-gland-metastasis-from-breast-cancer": {
      id: "parotid-gland-metastasis-from-breast-cancer",
      slug: "parotid-gland-metastasis-from-breast-cancer",
      title: "Parotid Gland Metastasis From Breast Cancer: A Case Report",
      seoTitle: "Parotid Gland Metastasis From Breast Cancer: A Case Report | BA Medicale",
      dek: "A published case report describing parotid gland metastasis from breast cancer, including diagnostic evaluation, local control, and systemic treatment planning.",
      excerpt: "A published case report of parotid gland metastasis from breast cancer, with imaging, cytology, surgery, pathology, radiotherapy, and systemic treatment considerations.",
      primaryAudience: "DOCTOR",
      secondaryAudiences: ["HEALTHCARE WORKER"],
      authors: [
        { name: "Bob Andinata", type: "Person" },
        { name: "Dewi Iriani", type: "Person" },
        { name: "Adlina Karisyah", type: "Person" }
      ],
      primaryTopic: "Diagnostic advances",
      tags: ["Breast Cancer", "Parotid Gland", "Metastasis"],
      primaryDiseaseGroup: "breast",
      secondaryDiseaseGroups: ["cancer-neoplastic"],
      diseaseCondition: "Breast cancer with parotid gland metastasis",
      diseaseSite: "Breast and parotid gland",
      contentType: "Case report",
      sourceAttribution: "Indonesian Journal of Cancer, Vol 14(3), 97-100, September 2020",
      publicationDateLabel: "September 2020",
      updatedDate: "",
      sortOrder: 3,
      focalPosition: "50% 50%",
      cover: "assets/articles/parotid-gland-metastasis-from-breast-cancer/poster.png",
      label: "Published case report",
      quickRead: false,
      inArticleNavigation: false,
      intro: [],
      paper: {
        sourceTitle: "Parotid Gland Metastasis From Breast Cancer: A Case Report",
        authorsText: "Bob Andinata¹, Dewi Iriani², Adlina Karisyah¹",
        publicationDetails: "Indonesian Journal of Cancer, Vol 14(3), 97-100, September 2020 · DOI: http://dx.doi.org/10.33371/ijoc.v14i3.723",
        affiliations: [
          "Department of Surgical Oncology, Dharmais Cancer Hospital - National Cancer Center, Jakarta, Indonesia",
          "Department of Anatomical Pathology, Dharmais Cancer Hospital - National Cancer Center, Jakarta, Indonesia"
        ],
        articleInfo: [
          ["Received", "16 March 2020"],
          ["Reviewed", "10 June 2020"],
          ["Accepted", "08 July 2020"]
        ],
        keywords: "breast cancer, metastasis, parotid gland, parotidectomy, systemic therapy",
        abstract: [
          "Introduction: Breast cancer metastasis at the parotid gland is uncommon. There were only 21 cases reported until the recent year, and none of them came from Indonesia. The reports showed that breast cancer metastasis is more often found at the liver, lung, bone, and brain. Therefore, any masses found on the parotid are usually considered as a double primer.",
          "Case Presentation: We report a case of a woman, firstly diagnosed with luminal A stage IIA breast cancer at 39 years old. The patient had undergone breast-conserving therapy (BCT), followed by adjuvant hormonal therapy before being diagnosed with bone metastasis four years later. She also complained about a painful mass on her left upper neck. Ultrasonography and CT-scan resulted in insignificant abnormality. After a year with increasing painful mass, we performed FNAB. The result showed metastatic adenocarcinoma with a suspicious breast cancer origin. We did total parotidectomy with facial nerve preservation to alleviate the pain. Pathology results showed a confirmed diagnosis of breast cancer metastasis. The patient was given radiotherapy as local control and was scheduled to receive chemotherapy as systemic therapy.",
          "Conclusions: Parotid mass with a clinical symptom in the patient with the history of breast cancer should be evaluated firstly by imaging and may be followed by cytology or pathology evaluation to confirm whether it is primary or secondary malignancy. If the parotid metastasis from breast cancer is confirmed, we should consider adding systemic therapy after completing the local control."
        ]
      },
      sections: [
        {
          title: "Introduction",
          body: [
            "Breast cancer is the most common malignancy found in women, not only in Indonesia but also around the world. Indonesian Ministry of Health in 2013 published a report mentioning the breast cancer prevalence in Indonesia of 0.5%. Breast cancer was the second most common malignancy in women after cervical cancer [1]. The number has been increasing over the years. GLOBOCAN in 2018 reported breast cancer as the first most common malignancy in women in Indonesia with 16.7% of new cases compared to cervical cancer with 9.3% of new cases [2,3].",
            "The high prevalence of breast cancer makes this malignancy one of the biggest health burdens in Indonesia. Patients who are diagnosed with breast cancer often neglect the mass until it enlarges, becomes painful, and even becomes an ulcer. They seek medical advice when their conditions have already become advanced with a high possibility of distant metastasis and an increased rate of mortality compared to the early stage [4]. Breast cancer metastasis is commonly found in regional axillary lymph nodes. It is also commonly found to metastasize to lungs, liver, brain, and bones [5,6]. Meanwhile, the parotid gland is a rare site for breast cancer metastasis. In salivary gland malignancies, metastases from other organs are counted less than 10%, which are often found from head and neck malignancies [7]. In this study, we report a case of parotid gland metastasis from breast cancer, a rare case with only 21 cases reported in the last 37 years."
          ]
        },
        {
          title: "Case presentation",
          body: [
            "A woman was firstly diagnosed with stage IIA (T2N0M0) breast cancer at 39 years old. Immunohistochemistry (IHC) results showed 30% positive ER, negative PR, negative HER2, and 3% of Ki67 detected. She came after completing breast-conserving surgery (BCS) in the previous hospital and was referred to our hospital for radiotherapy. After completing 25 sessions of radiotherapy, we gave her monthly injection of goserelin combined with 20 mg tamoxifen a day. We decided to do laparoscopic bilateral salpingo-oophorectomy (BSO) considering her age at that time which was still in the early 40s. Tamoxifen was switched to anastrozole after BSO. She continued oral hormonal therapy for the next three years without any significant complaint. Her first problem was pain in her right upper arm which was assessed as bone metastasis. We referred her to a radiooncologist to be given palliative radiotherapy. She was also given monthly bisphosphonate injection. We switched anastrozole to letrozole due to the progressivity of the disease. A few months later, she started complaining about a painful mass in her left upper neck. Initially, there was no facial asymmetry. We evaluated the mass using ultrasonography and CT-scan. The result showed parotid gland inflammation without any signs of malignancy.",
            "We decided to observe the progressivity of the mass while giving her a course of antibiotics. A year after diagnosed with bone metastasis in the humerus, the patient had other metastases to the sacrum and iliac bone. Biphosphonate injection was planned to be given for the next two years. Because the pain persisted after the course of antibiotics, we decided to do fine-needle aspiration biopsy (FNAB). The result indicated the presence of adenocarcinoma suspicious breast cancer metastasis. The tumor board recommended parotidectomy surgery. Figure 1 shows the parotid mass found during total parotidectomy, and Figure 2 shows the condition after total parotidectomy. The pathology result showed a confirmed diagnosis of breast cancer metastasis. Figure 4, 5 show the histopathological image under the microscope with 4x and 20x magnification. The patient was given radiotherapy as local control and was scheduled to receive chemotherapy as systemic therapy. The local condition a month after receiving the radiotherapy is shown in Figure 3."
          ],
          figures: [
            { src: "assets/articles/parotid-gland-metastasis-from-breast-cancer/figure-1.png", caption: "Figure 1. Parotid mass was found during total parotidectomy" },
            { src: "assets/articles/parotid-gland-metastasis-from-breast-cancer/figure-2.png", caption: "Figure 2. Post total thyroidectomy" },
            { src: "assets/articles/parotid-gland-metastasis-from-breast-cancer/figure-3.png", caption: "Figure 3. Tumor cells, some formed glandular structure, infiltrative in stroma (HE, 20x)" },
            { src: "assets/articles/parotid-gland-metastasis-from-breast-cancer/figure-4.png", caption: "Figure 4. Tumor cell infiltrating some of salivary gland (HE, 4x)" },
            { src: "assets/articles/parotid-gland-metastasis-from-breast-cancer/figure-5.png", caption: "Figure 5. A month after radiotherapy" }
          ]
        },
        {
          title: "Discussion",
          body: [
            "Parotid gland metastasis from other primary carcinoma contributed to less than 9-15% of the cases compared to primary carcinoma in parotid gland [7-9]. Furthermore, there is no valid data about the frequency of parotid gland metastases of breast cancer. Carcinoma can be metastasized through the lymphatic route, hematogenous, or direct invasion. Hematogenous metastases from infraclavicular primary carcinoma are usually found in the submandibular gland while, in the parotid gland, 2/3 cases of metastases are usually from head & neck cancer. Distant metastases from breast to parotid gland may occur through the thoracic duct or Batson’s paraspinal venous plexus avoiding pulmonary filter [7]. Ando et al. [10] in their study reported a relatively equal proportion of contralateral and ipsilateral parotid gland involvement in breast cancer metastasis cases. It supports the possibility of hematogenous spreading compared to the direct lymphatic route. Furthermore, Khurana et al. [11] in their case study also reported no axillary lymph node involvement in 25 lymph nodes dissected in the patient with parotid gland metastases of breast cancer. The patient in Khurana’s case also had been given infra and supraclavicular locoregional radiotherapy other than whole breast radiotherapy, so that she concluded that it was a hematogenous metastasis [11].",
            "In this patient with stage IIA breast cancer, the initial complaint indicating the problem in the parotid gland was a painful mass in the upper left neck. After the ultrasonography evaluation, we should evaluate the mass using a contrast CT scan of the skull base to clavicle and thorax. The next important examination is a fine-needle aspiration biopsy [12]. The study by Alath et al. [13] reported that 85% of FNA cytology could differentiate malignant from benign lesions and metastatic from primary malignancy in the parotid gland. The diagnostic process is indeed a challenge because of histopathology and IHC similarities between primary parotid malignancy and metastases of breast cancer. In IHC, primary salivary gland carcinoma shares similar positive results with breast cancer metastases for CK7, GCDFP-15, AR, HER2/neu staining, and, rarely, positive for ER (1%) and PR (5%). Therefore, Alath et al. [13] concluded that in the case of the positive history of malignancy in other organs, the parotid mass should be considered as metastatic from other primary until proven otherwise.",
            "The variety of biological characteristics in breast cancer brings out various clinical conditions. Thus, breast cancer treatment has to be tailored and individualized considering the stage, subtype, and personal medical condition [14]. We decided to do FNAB after evaluating a parotid CT scan in this patient. The result indicated the presence of adenocarcinoma suspicious breast cancer metastases. We treated the patient by doing total left parotidectomy. In addition, we referred the patient to do radiotherapy since there was visible residue left intraoperative. In the previous similar reports, single parotid gland metastasis from breast cancer was treated by doing superficial or total parotidectomy while preserving facial nerves to achieve a free margin [7,9,10]. Meanwhile, there is another distant metastasis reported by Cao et al. [8] in the study suggesting systemic therapy instead. The study recommended giving chemotherapy or hormonal therapy instead of surgery and radiotherapy for the patient with more than one distant metastasis [8]."
          ]
        },
        {
          title: "Conclusions",
          body: [
            "Parotid mass with a clinical symptom in the patient with the history of breast cancer should be evaluated firstly by imaging and may be followed by cytology or pathology evaluation to confirm whether it is primary or secondary malignancy. If parotid metastasis from breast cancer is confirmed, we should consider adding systemic therapy after completing local control."
          ]
        },
        {
          title: "Declarations",
          subsections: [
            { title: "Competing of Interest", body: ["The authors declare no competing interest in this study."] }
          ]
        }
      ],
      referencesTitle: "References",
      referencesOrdered: true,
      references: [
        "INFODATIN. Situasi Penyakit Kanker. Jakarta: Kementerian Kesehatan RI, 2015.",
        "Indonesia: Cancer Fact Sheet. United States: International Agency for Research on Cancer, 2018.",
        "Bray F, Ferlay J, Soerjomataram I, Siegel RL, Torre LA, Jemal A. Global Cancer Statistics 2018: GLOBOCAN Estimates of Incidence and Mortality Worldwide for 36 Cancers in 185 Countries. CA Cancer J Clin. 2018;68:394-424.",
        "Mardela AP, Manewat K, Sangchan H. Breast cancer awareness among Indonesian women at moderate-to-high risk. Nurs Health Sci. 2017;19:301-6.",
        "Barsky SH, Gradishar WJ, Recht A, Urist MM. The breast: comprehensive management of benign and malignant disease. Philadelphia: Elsevier Saunders; 2009.",
        "Dixon JM. ABC of breast disease. 3 ed. United Kingdom: Blackwell Publishing; 2006.",
        "Kmeid M, Kamar FG, Nasser S, Moukarzel N. Metachronous, Single Metastasis to the Parotid, from Primary Breast Cancer: A Case Report and Review of the Literature. Case Rep Oncol Med. 2015;2016:1-5.",
        "Cao X-S, Cong B-B, Yu Z-Y. Parotid gland metastasis from carcinoma of the breast detected by PET/CT. Medicine. 2018;97(21):1-4.",
        "Bohli M, Tebra S, Jaffel H, Bouaounia N. Parotid gland metastasis from breast origin. J Clin Case Rep. 2018;8(6):1-3.",
        "Ando K, Masumoto N, Sakamoto M, Teraoka K, Suzukia T, Kurihara T, et al. Parotid Gland Metastasis of Breast Cancer: Case Report and Review of the Literature. Breast Care. 2011;6:471-3.",
        "Khurana R, Azam M. An unusual case of solitary parotid metastasis from early stage breast carcinoma. Clinical Cancer Investigation Journal. 2016;5(3):250-2.",
        "NCCN clinical practice guidelines in oncology: head and neck cancers. Salivary gland tumors. United States: National Comprehensive Cancer Network; 2019.",
        "Alath P, Kapila K, Hussein S, Amanguno H, Hebbar HG, George SS, et al. Parotid gland metastasis of breast cancer diagnosed on fine needle aspiration cytology: case report and review of literature. Cuytopathology. 2014;25(5):346-8.",
        "Kurnia A, Brahma B, Hernowo B, Khambri D, Purwanto DJ, Suprabawati DGA, et al. Panduan petalaksanaan kanker payudara. Jakarta: PERABOI; 2015."
      ],
      promotion: {
        hook: "Parotid Gland Metastasis From Breast Cancer: A Case Report",
        teaser: [
          "Parotid mass with a clinical symptom in the patient with the history of breast cancer should be evaluated firstly by imaging and may be followed by cytology or pathology evaluation to confirm whether it is primary or secondary malignancy.",
          "If parotid metastasis from breast cancer is confirmed, we should consider adding systemic therapy after completing local control."
        ],
        cta: "Read the full case report at BAMedicale.com",
        hashtags: ["#BreastCancer", "#ParotidGland", "#BAMedicaleCom"]
      }
    }
  },
  ebooks: [
    { slug: "clinical-oncology-foundations", title: "Clinical Oncology Foundations", primaryAudience: "DOCTOR", audience: "Medical students and general physicians", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Cancer across organ systems", topics: ["Diagnosis", "Staging", "Biopsy"], contentType: "eBook", price: "Rp149.000", state: "Planned release", text: "A structured foundation for cancer terminology, diagnostic workup, staging, biopsy, and risk communication." },
    { slug: "practical-surgical-oncology", title: "Practical Surgical Oncology", primaryAudience: "DOCTOR", audience: "Residents and surgical learners", primaryDiseaseGroup: "cancer-neoplastic", diseaseCondition: "Solid tumor", topics: ["Surgery", "Treatment Planning"], contentType: "eBook", price: "Rp249.000", state: "Planned release", text: "A study pathway for surgical thinking, multidisciplinary planning, and perioperative oncology context." },
    { slug: "breast-cancer-clinical-guide", title: "Breast Cancer Clinical Guide", primaryAudience: "DOCTOR", audience: "Clinicians and advanced learners", primaryDiseaseGroup: "breast", secondaryDiseaseGroups: ["cancer-neoplastic"], diseaseCondition: "Breast cancer", topics: ["Diagnosis", "Treatment", "Patient Education"], contentType: "eBook", price: "Rp299.000", state: "Planned release", text: "A focused guide to breast symptoms, diagnostic pathways, treatment concepts, and patient education." }
  ],
  seminars: {
    "management-thyroid-nodules-2026": {
    id: "management-thyroid-nodules-2026",
    slug: "management-thyroid-nodules-2026",
    primaryAudience: "DOCTOR",
    primaryDiseaseGroup: "endocrine-metabolic",
    secondaryDiseaseGroups: ["cancer-neoplastic"],
    diseaseCondition: "Thyroid nodules",
    topics: ["Diagnosis", "Imaging", "Pathology", "Treatment Planning"],
    contentType: "Seminar",
    publishedDate: "2026-08-22",
    format: "Live webinar",
    title: "Management of Thyroid Nodules — How to Make an Accurate Diagnosis?",
    summary: "A free live webinar for general practitioners and specialists across Indonesia on thyroid nodule diagnosis, TIRADS ultrasound classification, BETHESDA classification, and therapy selection.",
    startDate: "2026-09-19T09:00:00+07:00",
    endDate: "2026-09-19T11:00:00+07:00",
    date: "Saturday, 19 September 2026",
    time: "09.00–11.00 WIB",
    location: "Zoom Meeting",
    attendanceMode: "Online",
    accreditationLabel: "Accreditation A — Ministry of Health",
    accreditation: "HK.02.02/F/3868/2023",
    isAccessibleForFree: true,
    maximumAttendeeCapacity: 1000,
    registration: "s.kemkes.go.id/WebinarMTN",
    contact: "Melati: 0821-236-6331 · support@bamedicale.com",
    quota: "Limited to 1,000 participants.",
    organizer: "Department of Head and Neck",
    host: "Hosted by Dharmais National Cancer Center Hospital.",
    audience: ["For general practitioners and specialists across Indonesia.", "Free registration. Participants must have a Plataran Sehat account.", "Limited quota: 1,000 participants."],
    faculty: [
      ["Keynote speech", "dr. Eniarti M.Sc., Sp.K.J., M.M.R., QHIA"],
      ["Speaker", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["Speaker", "dr. Achmad Fachri, Sp.Rad(K)"],
      ["Speaker", "dr. Vinesia Lestari Riddi, SpA, MPH"],
      ["Moderator", "dr. Adlina Karisyah, Sp.B"]
    ],
    sessions: [
      ["Current Diagnostic Approach and Therapy Selection for Thyroid Nodules", "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)"],
      ["Ultrasound Image and TIRADS Classification in Thyroid Nodules", "dr. Achmad Fachri, Sp.Rad(K)"],
      ["BETHESDA Classification in Thyroid Nodules", "dr. Vinesia Lestari Riddi, SpA, MPH"]
    ],
    outcomes: ["SKP credit — Ministry of Health", "Latest evidence-based topic", "Expert speakers", "Interactive Q&A session"],
    artwork: "assets/events/management-thyroid-nodules-sept19-2026.png",
    artworkWidth: 1054,
    artworkHeight: 1492,
    artworkAspectRatio: "1054 / 1492",
    detailUrl: "events/management-thyroid-nodules-2026.html",
    promotion: {
      hook: "What makes a thyroid nodule diagnosis accurate?",
      teaser: ["Join a focused doctor webinar on TIRADS ultrasound, BETHESDA classification, and therapy selection for thyroid nodules."],
      cta: "View the complete event program at BAMedicale.com",
      hashtags: ["#ThyroidNodules", "#MedicalEducation", "#BAMedicaleCom"]
    }
    }
  },
  profile: { name: "Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K)", role: "Surgical oncologist and BA Medicale physician educator", text: "BA Medicale is shaped around clear, responsible medical education: enough context to help people ask better questions, and enough structure to help doctors and healthcare workers continue learning across medical disciplines.", image: "assets/medical/oncology-cellular-hero.png" }
};
