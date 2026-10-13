# Hallboard Portfolio

The Angular monolith application lives in [`client/`](client/). See its
[README](client/README.md) for development, build, and test instructions.

## Deploying

The VPS is configured to serve the static Angular browser bundle from
`/var/www/hallboard.ir`. After making changes, run:

```bash
./deploy.sh
```

The script installs the locked dependencies, creates a production build, and
syncs `client/dist/web/browser/` to the VPS through the existing `ssh team`
host alias. It uses `rsync --delete`, so files removed from the build are also
removed from the website directory.

The defaults can be overridden without editing the script:

```bash
DEPLOY_SSH_HOST=team DEPLOY_REMOTE_DIR=/var/www/hallboard.ir ./deploy.sh
```
