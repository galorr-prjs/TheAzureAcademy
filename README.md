# Azure Academy

An interactive learning platform for Azure, built from scratch and hosted on Azure. Lessons are laid out like an architecture diagram: every lesson is a resource you "deploy", and finishing a path completes the whole architecture.

**Live site:** [TheAzureAcademy](https://victorious-coast-0e2e4d00f.1.azurestaticapps.net)

![Azure Academy dashboard](screenshots/dashboard.png)

## Features

- **Learning map:** a dashboard styled like an architecture diagram, where each lesson shows as `PROVISIONED`, `DEPLOYING` or `NOT STARTED`
- **Lessons** with Azure service examples, analogies and hands-on lab prompts
- **Quizzes** with instant feedback and an explanation for every answer
- **Saved progress:** XP, daily streak, quiz scores and an activity log, stored in the browser
- **Content as data:** lessons and quizzes live in JSON files, so adding content doesn't require changing code

The first learning path, Azure Fundamentals (AZ-900), is in progress. One lesson with its quiz is complete, and more are being added.

## Tech stack

- HTML, CSS and vanilla JavaScript, with no framework or build step
- JSON files for lesson and quiz content
- Azure Static Web Apps (Free plan) for hosting
- GitHub Actions for automatic deployment on every push to `main`

## How it works

1. `data/lessons.json` and `data/quizzes.json` describe the learning paths, lessons and quizzes.
2. The pages (`index.html`, `lesson.html`, `quiz.html`) read that data and build themselves in the browser.
3. `js/progress.js` saves progress in `localStorage`, so there is no backend or database.
4. A GitHub Actions workflow publishes the `app/` folder to Azure Static Web Apps whenever `main` changes.

## Run it locally

```bash
git clone https://github.com/galorr-prjs/TheAzureAcademy.git
cd TheAzureAcademy
python -m http.server 8080 --directory app
```

Then open http://localhost:8080. The pages must be served over HTTP, because opening `index.html` directly blocks loading the JSON data.

## Project structure

```
app/
  index.html        dashboard (learning map)
  lesson.html       lesson page
  quiz.html         quiz page
  css/styles.css    blueprint-style design
  js/
    app.js          dashboard logic
    lesson.js       lesson page logic
    quiz.js         quiz logic
    progress.js     saved progress (XP, streak, scores)
  data/
    lessons.json    paths and lessons
    quizzes.json    quiz questions
docs/               early MkDocs lesson drafts (not published)
.github/workflows/  deployment to Azure Static Web Apps
```

## Roadmap

- [ ] Finish the Azure Fundamentals lessons and quizzes
- [ ] Add the Compute & Networking, Storage & Databases and Identity & Security paths
- [ ] Hands-on lab walkthroughs
- [ ] Certificate of completion for finished paths

## Author

Built by [Gal Orr](https://github.com/galorr-prjs).
