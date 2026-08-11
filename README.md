# Livbouldr

A **parody** static website for a fictional bouldering-habit coaching brand, built to practise a full marketing-automation stack (Make.com + Brevo + GA4/GTM).

> Livbouldr is NOT a real company, product, or offer. Nothing is for sale and nothing here is real advice. Every page carries a visible disclaimer.

## What's here

```
Livbouldr/
  index.html            Home
  coaching.html         Fictional coaching packages
  about.html            Fictional brand story
  contact.html          Main lead form
  blog/
    index.html          Blog listing
    post-send-it-daily.html
    post-crimp-your-routine.html
  assets/
    css/style.css
    js/main.js          dataLayer events + Make webhook form handler
  README.md
```

No build step. It's plain HTML/CSS/JS and can be served as-is.

## 1. Deploy on GitHub Pages

1. Create a new GitHub repo (e.g. `livbouldr`) and push the contents of this folder to it.
2. In the repo: **Settings -> Pages**.
3. Under "Build and deployment", set **Source = Deploy from a branch**, **Branch = main**, **Folder = / (root)**, then Save.
4. Wait a minute; your site appears at `https://<your-username>.github.io/livbouldr/`.

Because links are relative, it works both at a repo subpath and at a custom domain.

## 2. Add your GTM container

1. Create a container at [tagmanager.google.com](https://tagmanager.google.com) (type: Web). You'll get an ID like `GTM-ABC1234`.
2. Find every `GTM-XXXXXXX` in the project and replace it with your real ID. It appears twice per page (the head script and the `<noscript>` iframe), across all 7 HTML files.

Quick find/replace count: 7 pages x 2 = 14 occurrences.

## 3. Connect GA4 through GTM

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com); copy the **Measurement ID** (`G-XXXXXXX`).
2. In GTM, add a **Google tag** (Google Analytics: GA4 Configuration) with that Measurement ID, triggered on **All Pages**. This covers `page_view`.
3. Publish the container.

## 4. Wire the custom events (the "track everything" part)

`assets/js/main.js` already pushes these to the `dataLayer`. In GTM you turn each into a GA4 **event tag** fired by a matching **Custom Event trigger**.

| dataLayer event        | When it fires                                  | Useful GA4 params                          |
|------------------------|------------------------------------------------|--------------------------------------------|
| `form_start`           | First interaction with any lead form           | `form_name`                                |
| `form_submit`          | Lead form successfully POSTs to Make            | `form_name`, `form_destination`            |
| `form_submit_error`    | Form POST failed                               | `form_name`, `error`                       |
| `cta_click`            | Any link/button with a `data-cta` attribute    | `cta_name`, `link_url`                      |
| `outbound_click`       | Click on a link to another domain              | `link_url`, `link_domain`                  |
| `scroll_depth`         | Page scrolled past 25/50/75/100%               | `percent`                                  |

Setup pattern for each row:

1. **Variables**: create a Data Layer Variable for each param name above (e.g. `dlv - form_name`).
2. **Trigger**: Custom Event, Event name = the exact string in the table (e.g. `form_submit`).
3. **Tag**: GA4 Event tag, Event name = same, add the params as fields using the DLV variables, fire on that trigger.

Mark `form_submit` as a **key event** (conversion) in GA4 so you can optimise against it.

Tip: turn on GTM **Preview** mode and click around the site to confirm each event shows up before publishing.

## 5. Point the forms at Make.com

1. In Make, create a scenario starting with a **Custom webhook** module. Copy its URL.
2. Open `assets/js/main.js` and set `MAKE_WEBHOOK_URL` to that URL.
3. Submit a form once so Make can capture the payload shape. Fields sent:
   `name`, `email`, `goal`, `message`, `form_name`, `page_path`, `page_title`, `submitted_at` (not every form has every field).

### Suggested Make fan-out (build after the site is live)

```
Webhook (form submit)
  -> Brevo: Create/Update contact + add to a list
  -> Brevo: enrol contact in an automation (welcome / nurture)
  -> Google Sheet: append a row (your raw lead log / audit trail)
  -> Router by form_name for different follow-ups per source
```

Brevo is the anchor: its free plan gives unlimited contacts, 300 emails/day (~9,000/month), marketing automation, landing pages, forms, SMS, and a built-in CRM with a sales pipeline, and it has a native Make module. Because the CRM is bundled, you don't need a separate CRM tool. The optional Google Sheet is just a raw audit log of every submission.

## Local preview

Open `index.html` directly, or serve the folder:

```
python -m http.server 8000
# then visit http://localhost:8000
```

Forms won't succeed locally until `MAKE_WEBHOOK_URL` is set, but you can still watch the dataLayer events in GTM Preview.

## Disclaimer

This project is fictional and exists only to practise marketing automation. Livbouldr is not a real company; it sells nothing and offers no real coaching, health, fitness, or lifestyle advice. Do not submit real payment details or sensitive personal information through the forms.
