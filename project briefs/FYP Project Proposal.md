A data-driven personalised educational recommender system for computing learners Jaslyn Chan 

CM3070 Final Year Project Proposal Target pathways: Data Analyst | Machine Learning Engineer | Software Developer 

Online learners have access to thousands of computing learning resources across platforms such as Coursera, DataCamp, edX, Udemy, freeCodeCamp, YouTube, and university open courses. 

However, users face 3 problems: 

1. Too many resources to choose from 

2. Difficulty knowing what to study next 

3. Generic learning paths that may not match their current skill level or career goal 

Sources: Coursera (n.d.); edX (2023); freeCodeCamp (2014); DataCamp (2022). 

## Objectives: 

1. Review existing learning platforms and educational recommender systems. 

2. Curate a dataset of computing learning resources. 

3. Define skill maps for three computing career pathways. 

4. Build learner profiles using career goal, skill level, completed topics, and weak areas. 

5. Implement a popularity baseline, content-based recommender, and hybrid recommender. 

## Deliverables: 

   1. Curated learning resource dataset 

   2. Career pathway skill taxonomy 

   3. Learner profiling method 

   4. Recommendation engine prototype 5. Evaluation results 

   6. Final report and demo video 

6. Evaluate recommendation quality using ranking metrics and user feedback. 

7. Develop a working prototype that produces ranked recommendations with explanations. 

Sources: Google Developers (n.d.); Manouselis et al. (2010) 

|User Type<br>~~Re~~|Problem|
|---|---|
|Adult learners<br>~~Re~~|Want structured upskilling while working|
|Career switchers|Unsure what skills are needed for a new role|
|Self-directed computing learners|Need guidance without a teacher|
|Final-year students/graduates|Want career-aligned learning resources|



## Example: 

A learner wants to become a Data Analyst. They know basic Excel and Python but are weak in SQL and data visualisation. The system finds the skill gaps and recommends SQL, dashboarding, and statistics resources before advanced machine learning resources. 

**==> picture [823 x 103] intentionally omitted <==**

**----- Start of picture text -----**<br>
Learner Profile Skill Gap Analysis<br>Ranked Learning Resources<br>Target role: Data Analyst SQL = weak but important<br>1. Beginner SQL for Data Analysis<br>Current skills: Python, Excel Data Visualisation = weak but<br>2. Data Visualisation with Tableau<br>Weak skills: SQL, Data  important<br>3. Statistics for Data Analytics<br>Visualisation Statistics = medium gap<br>**----- End of picture text -----**<br>


Learning resources should not only be recommended by topic. They should also be recommended based on the learner's career goal 

Different careers require different skill priorities: 

|Career pathway|Important skills|
|---|---|
|Data Analyst|SQL, Excel, Python, statistics,<br>dashboards, data cleaning|
|Machine Learning Engineer|Python, machine learning, data<br>preprocessing, model evaluation,<br>deployment|
|Software Developer|Programming, OOP, APIs, databases,<br>testing, version control|



Skill importance weights will be informed by learning platform pathways, career platform job descriptions, and computing role skill frameworks. 

Sources: Coursera (n.d.); DataCamp (2022); LinkedIn (2025); MyCareersFuture Singapore (n.d.); SkillsFuture Singapore (2025). 

Platform: DataCamp Career tracks are structured, but platform-defined 

Platform: freeCodeCamp Free structured curriculum, but less personalised to career gaps 

Platform: Coursera Professional certificates support career learning, but follow fixed sequences 

Sources: DataCamp (2022); Coursera (n.d.); freeCodeCamp (2014). 

To strengthen the career-oriented aspect of the system, this project will review career platforms and job-market skill requirements for Data Analyst, Machine Learning Engineer, and Software Developer roles. 

|Platform<br>~~i~~|Purpose in this project<br>~~ee~~|
|---|---|
|LinkedIn Jobs<br>~~i~~|Identify common role titles and<br>technical skills<br>~~ee~~|
|MyCareersFuture|Include Singapore-relevant job<br>requirements|
|SkillsFuture Jobs-Skills Portal|Support structured career and skill<br>mapping|



These insights will help define the skill importance weights used in the career pathway skill map. 

Sources: LinkedIn (2025); MyCareersFuture Singapore (n.d.); SkillsFuture Singapore (2025). 

Existing platforms are useful, but several gaps remain: 

- Many pathways are fixed and platform-defined. 

- Recommendations are often based on popularity, category, or platform activity. 

- Learners may not know which skill gap is blocking their progress. 

- Recommendations are not always explainable. 

- Resources from different platforms are rarely compared together. 

- Career pathway requirements are not always explicitly included in the recommendation logic. 

There is a need for an explainable, career-aware recommender system that combines learner skill gaps, learning resource metadata, and job-market skill requirements to recommend the next most suitable computing resources. 

## Important ideas from related work: 

- Learner context matters. 

- Learning sequence matters. 

- Content metadata can be used to match learners with resources. 

- Hybrid recommender systems can combine multiple signals. 

- Evaluation should compare the recommender against baselines. 

|Area<br>~~hhh~~|Relevance to Project<br>~~eee~~|
|---|---|
|Educational recommender systems<br>~~hhh~~|Supports personalised learning resource recommendation<br>~~eee~~|
|Learning analytics|Uses learner data to guide learning decisions|
|Content-based filtering|Matches learner needs to resource metadata|
|Hybrid recommendation|Combines career relevance, skill gaps, and content similarity|
|Explainable recommendation|Helps users understand why a resource was suggested|



Sources: Manouselis et al. (2010); Ricci, Rokach and Shapira (2010); Aggarwal (2016); Google Developers (n.d.). 

The system takes learner information and resource metadata as input, then produces ranked recommendations. 

Learner Profile: 

- Target pathway 

- Current skills 

• Completed topics 

- Weak areas 

Resource dataset: 

- Course title 

Skill Map: 

   - Topics Covered 

   - • Difficulty 

- Role requirements 

- Skill importance 

- • Prerequisites 

- Provider 

- • Duration 

Duration Ranked Recommendations — • SQL for Data Analysis • Tableau Dashboard Basics • Statistics for Beginners 

Recommendation Engine Compares learner profile, career skill gaps, and resource metadata to generate ranked suggestions. 

Recommendation Explanation “Recommended because SQL is a high-priority skill gap for the Data Analyst pathway.” 

Learner profile features: 

|Feature<br>~~ee~~|Example<br>~~ee~~|
|---|---|
|Resource title|Intro to SQL|
|Provider|Coursera|
|Topic|SQL|
|Skills covered|SELECT, JOIN, Aggregation|
|Difficulty|Beginner / Intermediate / Advanced|
|Duration|4hrs|
|Format|Course / tutorial / video / project|
|Prerequisites|Basic databases|
|Career relevance|Data Analyst, Software Developer|
|Cost|Free / paid|
|Rating / popularity|Optional if available|



|Feature<br>~~|~~|Example<br>~~|~~|
|---|---|
|Target pathway<br>~~|~~|Data Analyst<br>~~|~~|
|Current skill level|Beginner|
|Completed topics|Python basics, Excel;|
|Weak topics|SQL, visualisation|
|Preferred learning style|Hands-on projects|
|Available time|Short resources preferred|



Career platform data fields: 

|Feature<br>~~ee~~|Example<br>~~ee~~|
|---|---|
|Job title|Data Analyst|
|Required skills|SQL, Python, Tableau|
|Experience level|Entry-level / Junior|
|Source platform|LinkedIn Jobs / MyCareersFuture|
|Skill frequency|SQL appears often in job postings|



Sources: Google Developers (n.d.); Scikit-learn (2019); LinkedIn (2025); MyCareersFuture Singapore (n.d.). 

• Each career pathway will have a skill map. Each skill can be assigned an importance weight. 

|Skill<br>~~ee~~|Data Analyst<br>~~ee~~|ML Engineer<br>~~ee~~<br>~~ee~~|Software Developer<br>~~ee~~<br>~~eee~~|
|---|---|---|---|
|Python|High|High<br>~~ee~~|Medium<br>~~eee~~|
|SQL|High|Medium|Medium|
|Statistics|High|Medium|Medium|
|Machine Learning|Medium|High|Low|
|APIs|Low|Medium|High|
|Testing|Low|Medium|High|
|Data visualisation|High|Medium|Low|
|OOP|Low|Medium|High|



The system compares the learner’s current skill profile with the target pathway skill map to calculate skill gaps. 

Formula: Skill gap = required pathway level − learner current level 

Sources: Coursera (n.d.); DataCamp (2022); LinkedIn (2025); MyCareersFuture Singapore (n.d.); SkillsFuture Singapore (2025). 

|Method|Purpose|How it works|
|---|---|---|
|Popularity baseline|Simple comparison model|Recommends generally popular or highly<br>rated resources|
|Content-based recommender|Matches learner needs to resource<br>metadata|Uses topics, skills, difficulty, pathway<br>relevance, and prerequisites|
|Hybrid recommender|Main proposed model|Combines career relevance, skill gaps,<br>difficulty match, prerequisite match, and<br>popularity|



Final recommendation score = career relevance + job-skill alignment + skill gap match + difficulty match + prerequisite match + resource quality 

The hybrid approach is expected to provide more personalised recommendations than a simple popularity-based model because it considers both the learner’s current skill gaps and the skills commonly needed in the target career pathway. 

Job-skill alignment checks whether a resource teaches skills that often appear in job or career platform requirements. 

Sources: Google Developers (n.d.); Aggarwal (2016); Scikit-Learn (2019); Kula and Chen (2020). 

SQL for Data Analysis: 

Why recommended: 

Provider: Coursera / DataCamp / edX 

- Target pathway: Data Analyst 

Difficulty: Beginner 

- SQL is a high-priority skill for this pathway 

- Learner rated SQL as weak 

- Resource difficulty matches learner level 

- Resource supports the next step in the learning path 

Explainability helps learners understand why a resource is useful and how it connects to their career goal. 

Sources: Manouselis et al. (2010); Ricci, Rokach and Shapira (2010); Aggarwal (2016). 

|Evaluation area<br>~~Cf~~|How it will be measured<br>~~Cf~~|
|---|---|
|Recommendation relevance|Precision@K, Recall@K|
|Ranking quality|NDCG@K|
|Model comparison|Baseline vs content-based vs hybrid|
|User usefulness|Learner feedback survey|
|Explainability|Users rate whether explanations are clear|



The hybrid recommender will be compared against simpler methods to check whether it gives more relevant recommendations. 

Sources: Google Developers (n.d.); Aggarwal (2016); Scikit-Learn (2019). 

## Prototype features: 

- Select target career pathway 

- Enter current skills and completed 

   - topics 

- Identify skill gaps 

## Planned tools: 

- Python 

- Pandas 

- Scikit-learn 

- Streamlit or Flask 

- TF-IDF / text similarity 

- Matplotlib or Plotly for evaluation 

Visual mock-up: [Choose pathway: Data Analyst] [Skill: SQL - Beginner] [Completed: Python Basics] 

→ Recommended Resources 1. SQL for Data Analysis 

   2. Tableau Basics 

- Generate Top-N recommended 

**==> picture [191 x 16] intentionally omitted <==**

**----- Start of picture text -----**<br>
3. Statistics for Beginners<br>**----- End of picture text -----**<br>


resources 

- Show explanation for each 

recommendation 

Sources: Python Software Foundation (n.d.); Pandas (n.d.); Scikit-Learn (2019); Streamlit (n.d.). 

|Scope / Limitation|How I will manage it|
|---|---|
|Only 3 career pathways|Focus on Data Analyst, ML Engineer, Software<br>Developer|
|Limited learner data|Use content-based and hybrid methods|
|Self-rated skills may be subjective|Use simple skill questions or confidence ratings|
|Resource metadata may be inconsistent|Clean and standardise the dataset|
|Small user testing sample|Combine user feedback with ranking metrics|



The project focuses on building and evaluating a working prototype, not a full commercial learning platform. 

This project is expected to contribute: 

- A curated dataset of computing learning resources across multiple platforms. 

- A career pathway skill map for Data Analyst, Machine Learning Engineer, and Software Developer roles. 

- A learner profiling method based on current skills, completed topics, weak areas, and target career pathway. 

- A hybrid recommendation approach combining skill gaps, career relevance, difficulty level, prerequisites, and resource metadata. 

- Explainable recommendation outputs showing why each resource is suggested. 

- Evaluation results comparing popularity-based, content-based, and hybrid recommendation methods 

Aggarwal, C.C. (2016). _Recommender Systems: The Textbook_ . [online] Available at: https://pzs.dstu.dp.ua/DataMining/recom/bibl/1aggarwal_c_c_recommender_systems_the_textbook.pdf (Accessed: 12 May 2026). 

Coursera. (n.d.). _Coursera | Online Professional Certificate Programs_ . [online] Available at: https://www.coursera.org/professional-certificates (Accessed: 12 May 2026). 

DataCamp. (2022). _Career-building data science learning paths | DataCamp_ . [online] Available at: https://www.datacamp.com/tracks/career (Accessed: 12 May 2026). 

edX. (2023). _Learn Computer Science with Online Courses and Programs_ . [online] Available at: https://www.edx.org/learn/computer-science (Accessed: 12 May 2026). freeCodeCamp. (2014). _Learn to code | freeCodeCamp.org_ . [online] Available at: https://www.freecodecamp.org/ (Accessed: 12 May 2026). 

Google Developers. (n.d.). _Recommendation Systems Overview_ . [online] Available at: https://developers.google.com/machine-learning/recommendation/overview/types (Accessed: 12 May 2026). 

Kula, M. and Chen, J. (2020). _Introducing TensorFlow Recommenders_ . [online] TensorFlow Blog. Available at: https://blog.tensorflow.org/2020/09/introducing-tensorflow-recommenders.html (Accessed: 12 May 2026). LinkedIn. (2025). _LinkedIn Jobs_ . [online] Available at: https://www.linkedin.com/jobs/ (Accessed: 12 May 2026). 

Manouselis, N., Drachsler, H., Vuorikari, R., Hummel, H. and Koper, R. (2010). ‘Recommender Systems in Technology Enhanced Learning’, _Recommender Systems Handbook_ , pp. 387–415. doi: https://doi.org/10.1007/978-0-387-85820-3_12. (Accessed: 12 May 2026). 

MyCareersFuture Singapore. (n.d.). _MyCareersFuture Singapore_ . [online] Available at: https://www.mycareersfuture.gov.sg/ (Accessed: 12 May 2026). 

- Ricci, F., Rokach, L. and Shapira, B. (2010). _‘Introduction to Recommender Systems Handbook’, Recommender Systems Handbook_ , pp. 1–35. doi: https://doi.org/10.1007/978-0-387-858203_1. (Accessed: 12 May 2026). 

- Scikit-learn. (2019). _User guide: contents — scikit-learn documentation_ . [online] Available at: https://scikit learn.org/stable/user_guide.html (Accessed: 12 May 2026). 

SkillsFuture Singapore. (2025). _Sector Information | Jobs-Skills Portal_ . [online] Available at: https://jobsandskills.skillsfuture.gov.sg/frameworks/sector-information (Accessed: 12 May 2026). 

