---
title: "ReportsPool"
description: "Database for missing and found people/properties"
link: http://reportspool.com
screenshot: no.jpg
date: '2017-06-21'
layout: 'portfolio'
---

Currently, I’m re-writing [ReportPools](http://reportspool.com) in Go and Vue.js; this is a database for missing and found people and properties reports. For missing or found people, I implemented Computer Vision (CV) to identify if the missing/found person's picture exists in the database (means, someone else must have submitted a counter-report). If it does, it would connect the reporter with the existing report/post.Otheriwse, it saved the report and keeps notifying the reporter whenever there is a relevant report. For non-human reports, it uses text processing to conduct matching of the new report against existing reports in the database.

