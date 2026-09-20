# JUMI Apps Script deployment

JUMI uses the official repository-managed `@google/clasp` client. Authentication and the Apps Script project binding remain local and are ignored by Git.

One-time developer setup:

1. Run `npm run jumi:login` and authorize the Google account that owns the existing private JUMI Apps Script project.
2. Create the ignored root `.clasp.json` with the existing project Script ID and the fixed bundle directory:

   ```json
   {
     "scriptId": "EXISTING_JUMI_SCRIPT_ID",
     "rootDir": "scripts/jumi"
   }
   ```

Never use `clasp create`: the repository must stay bound to the existing JUMI project and existing web-app deployment.

Normal developer deployment:

```powershell
npm run jumi:deploy
```

The command runs the JUMI checks before mutation, verifies that clasp will sync only `Code.gs`, `Index.html`, and `appsscript.json`, verifies the bound project contains the production deployment ID from `jumi/config.js`, pushes the validated bundle, creates a version, and updates that same deployment in place. It does not alter Script Properties or web-app access settings.
