# ekamekas.dev

One Hugo source tree, two published sites.

| Site | URL | Host | Build |
| --- | --- | --- | --- |
| Profile landing | `ekamekas.dev` | Cloudflare Pages | `hugo --environment landing` |
| Blog | `blog.ekamekas.dev` | GitHub Pages | `hugo --environment blog` |

They are separate sites — separate domains, hosts, sitemaps and identities —
that happen to share a repository. Sharing it is what lets the landing page
list recent writing automatically instead of by hand.

`.github/workflows/hugo.yaml` builds both on every push to `main` and deploys
them in two independent jobs, so a failure on one host cannot take the other
site down.

## Layout

```
config/
  _default/   shared: language, timezone, author, socials, blogBaseURL
  blog/       blog.ekamekas.dev  — theme, mounts, taxonomies, menu
  landing/    ekamekas.dev       — mounts, cascade, landing params
content/      git submodule -> ekamekas/ssg-content
  engineering/  technical writing
  ulasan/       books, tools, courses
  catatan/      essays outside of work
  static/       diagrams and the public key
landing/      the landing page's own content, layout and CSS
themes/forkmybrain/
```

Writing lives in the `content` submodule, split by rubrik. A post's directory
becomes its URL: `content/engineering/foo.md` is published at
`blog.ekamekas.dev/engineering/foo/`.

Local development:

```sh
hugo server --environment blog
hugo server --environment landing
```

## Adding a rubrik

A rubrik is a URL, so it is cheap to add and expensive to rename. Four places:

1. `content/<name>/_index.md` in the submodule — title and description.
2. `config/blog/hugo.toml` — a `[[module.mounts]]` entry, `params.mainSections`,
   and a `[[menu.main]]` entry using `pageRef`.
3. `config/landing/hugo.toml` — a `[[params.topics]]` entry and a
   `[[module.mounts]]` entry.
4. The `cascade` target in `config/landing/hugo.toml`.

Both sites hide a rubrik that has no posts yet — the blog's nav drops it
(`layouts/_partials/menu-items.html`) and the landing page skips its whole
section — so a rubrik can be declared before anything is written in it.

Rubrik are mounted one directory at a time rather than mounting `content/`
wholesale. Mounting the whole thing also swept in `content/static`, which is
mounted separately as static, publishing every diagram and the public key
twice: once at `/` and once at `/static/`.

## How the landing page lists recent posts

The landing site mounts the blog's rubrik so its layout can range over them,
but it must not *publish* them — the posts live on the blog, and a second copy
under `ekamekas.dev/` would split their SEO weight and serve pages nobody links
to.

Two settings in `config/landing/hugo.toml` prevent that:

- `disableKinds` drops the section and taxonomy list pages.
- A `cascade` marks every post `build.render = 'link'`, so Hugo loads it into
  `.Site.RegularPages` and computes a permalink for it, but writes no HTML.

The layout then prefixes those relative permalinks with `params.blogBaseURL`.
A custom `landing/layouts/sitemap.xml` keeps the borrowed posts out of the
landing sitemap for the same reason.

The landing page runs on the blog's theme on purpose — same typography, same
palette, same light/dark behaviour. It overrides only `home.html` and
`sitemap.xml`, and layers `landing/assets/css/extra.css` on top of the theme's
stylesheet through the theme's `css/extra.css` hook.

## One-time setup

The blog already works. The landing page needs these done once. Until they are,
the `deploy-landing` job skips itself with a notice rather than failing the run.

**1. Create the Cloudflare Pages project.** Dashboard → Workers & Pages →
Create → Pages → *Direct Upload*. Name it **`ekamekas-dev`** — it must match
`--project-name` in the workflow. `wrangler pages deploy` cannot create a
project non-interactively, so this has to exist before the first CI run.

**2. Create an API token.** My Profile → API Tokens → Create Token → Custom
token with permission **Account › Cloudflare Pages › Edit**. Copy the Account
ID from the dashboard sidebar.

**3. Add GitHub secrets.** Repo Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

**4. Attach the domain.** In the Pages project → Custom domains → add
`ekamekas.dev`. The DNS record is created automatically because the zone is
already on Cloudflare.

**5. Redirect the old post URLs (optional but recommended).** Posts moved from
`/posts/` to `/engineering/`. Each one carries a Hugo `aliases` entry, so
`/posts/<slug>/` already serves a meta-refresh redirect to the new URL — links
do not break without any further action.

For a true `301` instead, add a Cloudflare Redirect Rule on the `ekamekas.dev`
zone (Rules → Redirect Rules → Create → *Wildcard pattern*):

- Request URL: `https://blog.ekamekas.dev/posts/*`
- Target URL: `https://blog.ekamekas.dev/engineering/${1}`
- Status: `301`, preserve query string

The edge rule fires before the request ever reaches GitHub Pages, so it takes
precedence over the aliases. The aliases stay as a fallback.
