# Agely Website

This folder contains the static public website for `agely.app`.

The Agely iOS app source lives in a separate private repository. The public website repository should
contain only public website assets and policy/contact content.

Published URLs:

- `https://agely.app/`
- `https://agely.app/privacy/`
- `https://agely.app/support/`

## GitHub Pages Setup

The repository uses `.github/workflows/pages.yml` to publish only this `Website/` folder with
GitHub Pages Actions.

Owner setup steps:

1. Push these files to `main`.
2. Open the GitHub repository.
3. Go to Settings > Pages.
4. Under Build and deployment, set Source to GitHub Actions.
5. Under Custom domain, enter `agely.app` and save.
6. After DNS is configured and GitHub provisions the certificate, enable Enforce HTTPS.

GitHub documents that apex domains should point to GitHub Pages with these `A` records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

For IPv6 support, GitHub also documents these `AAAA` records:

```text
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

For `www.agely.app`, add a `CNAME` record pointing to:

```text
davidwrightos.github.io
```

Do not add wildcard DNS records such as `*.agely.app`.

References:

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## Local Preview

From this folder:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```
