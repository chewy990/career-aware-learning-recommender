# Demo Guide

This guide explains how to show the project as software. The demo is now a dynamic learning pathway prototype rather than a static recommendation table.

## 1. Run The Data Pipeline

From the project folder:

```powershell
cd 'C:\Users\Admin\Documents\mods\FYP'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' src\run_pipeline.py
```

This creates the output CSV files and `outputs/report.html`.

## 2. Install Streamlit If Needed

If Streamlit is not installed:

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install streamlit
```

## 3. Start The Demo App

```powershell
cd 'C:\Users\Admin\Documents\mods\FYP'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m streamlit run src\app.py
```

Streamlit will show a local URL such as:

```text
http://localhost:8501
```

Open that URL in a browser.

## 4. What To Demonstrate

For the demo video or supervisor review:

1. Select a learner profile.
2. Switch to "Build custom learner" and rate a few skills from 0-3.
3. In Learner View show the learner summary and staged custom learning path.
4. Open "View skill gaps" only if you want to explain the calculation.
5. Show the staged path: learn just enough, start a practical project, deepen later.
6. Mark a recommended resource as completed.
7. Show that skill levels update and the visible path stays stable instead of reshuffling.
8. Read one short explanation aloud.
9. Switch to Research View and show the model comparison table.
10. Explain that the hybrid model has the strongest NDCG@5 score.
11. Mention that full career tracks are optional references, while the main path recommends targeted modules.

## 5. Suggested Demo Script

This prototype recommends educational resources based on a learner's target career pathway and changing skill profile. For example, when the learner selects the Data Analyst pathway and has weak SQL and data visualisation skills, the system prioritises targeted modules and practical dashboard work instead of forcing the learner into a broad fixed track.

The learner can then mark a resource as completed. The system updates the learner's skills, shows simple skill increases, and keeps the current visible recommendations stable so the learner does not lose their place during the demo. The system compares three models: a popularity baseline, a content-based recommender, and a hybrid recommender. The hybrid model combines career relevance, skill-gap match, job-skill alignment, difficulty match, prerequisites, resource quality, and text similarity. The evaluation shows that the hybrid model has the best NDCG@5, meaning it places relevant resources higher in the ranked list.

The demo should emphasise that the system does not simply recommend a whole fixed career track. Broad tracks are treated as optional structured references, while the personalised path prioritises smaller modules that match the learner's current gaps.

The demo should stay focused on precise learning steps and practical progress rather than extra content that is hard to verify reliably.
