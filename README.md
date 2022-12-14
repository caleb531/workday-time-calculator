# Workday Time Calculator

*Copyright 2017-2022 Caleb Evans*  
*Released under the MIT license*

This application allows you to easily record and track what you've done (and
when) throughout the day.

You can view the app online at:  
https://projects.calebevans.me/workday-time-calculator/

## Setup

This project uses [pnpm][pnpm] (instead of npm) for package installation and
management.

[pnpm]: https://pnpm.io/

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

The app will then be accessible at http://localhost:5173.

## Usage

The app recognizes bulleted or numbered lists in a format like the following:

```
1. Category One
  a. 9 to 12:15
    i. Did this
2. Category Two
  a. 12:45 to 5
    i. Did that
```
