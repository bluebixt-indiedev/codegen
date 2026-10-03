![logo](assets/background.jpg)

# Code Complainer (Codegen)

[![Please don't upload to GitHub](https://nogithub.codeberg.page/badge.svg)](https://nogithub.codeberg.page)

Build. Complain. Ship.

## What is Code Complainer?
Code Complainer (Codegen) is a git platform written on [Rust](https://rust-lang.org/). The protocol is under Git Protocol. When Creating a new file, lfs or other it goes to `forgejo/data/data/` folder with all the each folder have a file named `.gitkeep`. Codegen is Free/Libre git platform perfect for non-credit users.

## Why We Build Codegen 
We Know GitHub Right? So were talking about GitHub.

### GitHub Copilot 
What is **GitHub Copilot**?
GitHub Copilot is GitHub's Ai (**Artificial Intelligence**). We know know the Copilot learn from billions of code. but we know LLMs (so-called **Ai**) need be **trained**. 

#### Why it named GitHub Copilot?
It's an aviation metaphor — and GitHub says it on purpose.

You are the pilot, it's the co-pilot.

When they announced it in 2021 as "Your AI pair programmer", the idea was:  
In an airplane the copilot can help with several "standard" tasks, which allows the pilot to focus on getting the plane to its destination.  
So the name is meant to communicate 3 things:

### 1. You're in command.
It's not Autopilot. The official line has always been "It is, it is the copilot. It is. It is not the pilot". You decide architecture, logic, and if the code is correct. 2. It's assistance, not replacement. The term "Copilot" draws inspiration from the aviation industry, where a copilot assists the pilot in operating the aircraft smoothly and safely. Just like real autopilots didn't replace pilots 60+ years ago, they made flying safer and reduced workload.   3. It's pair programming. GitHub + OpenAI described it as an "AI-powered pair programmer" — that second person sitting next to you, suggesting functions, completing lines, like Gmail's Smart Compose but for code.   
That's why Microsoft kept reusing it — Copilot for Microsoft 365, Windows Copilot, etc. The name tested well: you're still the captain, you just get a second pair of eyes that never gets tired of writing boilerplate. Read [No-Github Website](https://nogithub.codeberg.page/).

## Why **GitHub Inc.** acquired **Microsoft**?
On June 4, 2018, Microsoft announced it would buy GitHub for $7.5 billion in stock, and closed the deal in October 2018. GitHub became a wholly-owned subsidiary.  

Why keep it as GitHub, Inc. operating independently instead of absorbing it into Microsoft?

### 1. Trust and neutrality
   
GitHub is the world's largest neutral hub for open-source code. Developers from Google, Amazon, Meta, and startups all host code there. If Microsoft made it "Microsoft GitHub," competitors would leave. Microsoft said from day one its intent is to keep GitHub platform- and language-independent and operate as an open platform for all developers in all industries.  

This is the same playbook Microsoft uses for LinkedIn and Minecraft's Mojang - let it run mostly independently.  

### 2. Developer relationships

CEO Satya Nadella framed it as: "Microsoft is a developer-first company, and by joining forces with GitHub we strengthen our commitment to developer freedom, openness and innovation". Owning GitHub gives Microsoft direct access to 100M+ developers.  

### 3. Business strategy
• Enterprise funnel: The deal aimed to increase enterprise use of GitHub and bring Microsoft's developer tools and services to new audiences. Today GitHub is part of Microsoft's enterprise services, which generated $7.4 billion in revenue in 2022.   • Azure growth: GitHub's capabilities contribute to the growth and adoption of Azure - if your code is on GitHub, it's one click to deploy on Azure, use GitHub Copilot, Actions, Codespaces, etc. • Data and insights: Seeing what languages, frameworks and tools are trending helps Microsoft inform its own product development.

### No GitHub Story 
The "No GitHub" / "Give up GitHub" movement isn't one person - it's a growing developer backlash. And the reasons people cite right now are pretty consistent:

1. Reliability has tanked
In 2026 there were 10 outages in April, 9 in May, 6 in June, plus a squash-merge bug on April 23rd that reversed commits in 658 repos and 2,092 PRs, and a search outage on April 26th. People joke "GITHUB PLEASE BRO" but also say they can't deploy because CI is down. The satire graphic that went around was literally "GITHUB KEEPS GOING DOWN. ALL THANKS TO VIBE CODING."  

2. Microsoft ownership = trust issue
Since Microsoft bought GitHub in 2018, a lot of FOSS folks say the culture shifted from solving hard infra problems to chasing FAANG metrics and stack-ranking. The common comment is just: "Microsoft. Microsoft happened to GitHub." The Software Freedom Conservancy even ran a "Give up GitHub" campaign encouraging migration, and projects like Luxtorpeda, Ghostty and Gentoo have publicly left for Codeberg.  

3. Forced AI everywhere
The biggest complaint in 2025-2026: Copilot creating auto-issues/PRs, using public code to train LLMs, and not letting you block it. As one dev put it: "Copilot is also using your code to train your LLMs... pretty dumb to trust your code to something designed to devalue your labor". People with a "no LLM / no AI" rule are moving to Codeberg specifically to avoid forced AI suggestions.  

4. Vibe-coding overload
Generative AI created a stat explosion: 1.4B commits, 90M PRs merged, 20M new repos per month in 2026. Developers blame "millions of file changes PRs from vibe coding" for overloading search, webhooks, and Actions. GitHub itself said it has to prioritize availability over features and move webhooks out of MySQL because of bot traffic.

5. Platform lock-in and philosophy
Git is distributed, so git push to another remote is trivial, but GitHub Actions lock-in keeps people stuck. The anti-GitHub argument is ideological too: "Stop pushing to GitHub. Stop giving your code away," as ThePrimeagen ranted in his "ALL MY HOMIES HATE GITHUB" / self-hosting push. Other grievances that pop up: ICE contracts, CEO telling devs to "embrace AI or get out," bloated JS, and inconsistent notifications and search.  

So it's not that GitHub hates GitHub - it's that a vocal chunk of devs hate what GitHub became: less stable, more Microsoft-corporate, AI-first instead of git-first, and hard to leave even if you want to. Alternatives people actually mention over and over: self-hosted GitLab, Forgejo/Gitea, and Codeberg, the German non-profit.  

## Motto of Codegen

> Build. Complain. Ship.

### Build
Build means it working to your repository, migration, and organizations. 
### Complain
Complain means complete the repository, migration, and organizations.
### Ship
Ship means it is given to a CLI or a boat was moving.

## License 
License is Under MIT License
See [License](./LICENSE)

## Full Anti-Bot
The Anti-bot.js is a anti bot file that peoples use it. with honeypot.

## Code Of Conduct 
Code Of Conduct is a rules for developers and contributors. is like the guidelines file. See [Code of Conduct](./CODE_OF_CONDUCT.md)

## Contributing
Thanks Contributing to our repository. See [Contributing](./CONTRIBUTING.md)

## Join Our Discord Server 
Join **Discord** Server by tapping the Blue Highlight. [Join The Server Now!](https://discord.gg/3skm5GSQmT).

## Join Our Libera Channel
Join **Libera** Channel by tapping the Blue Highlight. [Join The Channel Now!](https://web.libera.chat/#BlueBixt)

## Its Countries Home
The Codegen Countries Home is in the **Baguio, Philippines**.

## Why Written on Rust?
Rust is the most or #1 loved programming language in the world. Rust also combines with faster code like C++. To make Rust born, It combined C++ and C to make Rust.

## Mascot 
The Mascot is **Ming Ming**, a blue cat loves program with you.

## No-Github Supported
We Added **No-Github** because my GitHub account was flagged and it cannot appeal me. for more information visit [No-Github Website](https://nogithub.codeberg.page/).

## Requirements 
### Sign-off-by First the DCO First before Creating something.
Why DCO Sign-Off Must Come FIRST Before Creating Anything
1. To Avoid Waste and Rework
If we create first and DCO rejects later, all effort, time, and files are wasted. Sign-off first saves double work.

2. DCO is the Gatekeeper of Standards
DCO controls naming, format, version, template, and compliance. If you create without DCO, you will likely create the wrong version or wrong format.

3. To Prevent Duplication
DCO knows what already exists. Without checking DCO first, you might create something that already exists.

4. For Traceability and Control
Once DCO signs, it gets a Document No. / Control No. / Record in the system. No sign-off = no record = considered unofficial and will not be recognized.

5. For Accountability
DCO sign-off means management is aware and has approved the need. Creating without it is considered unauthorized creation.

Simple Logic:
No DCO approval = No official document/design. If it's not controlled by DCO, it doesn't exist.
Correct Flow:
REQUEST -> DCO REVIEW -> DCO SIGN-OFF -> CREATE

Wrong Flow:
CREATE -> Ask DCO to approve -> Rejected -> Redo

Version of the README: v2 long v.

© Copyright BlueBix 2026, All Rights Reserved.