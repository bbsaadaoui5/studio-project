CI Secrets template for Playwright + axe tests

Add these repository secrets in GitHub Settings → Secrets & variables → Actions.

Required (for authenticated tests):
- TEST_PARENT_EMAIL
  - Example: test-parent@example.com
- TEST_PARENT_PASSWORD
  - Example: S3cureT3st!

Firebase (if your tests initialize the Firebase client in CI):
- FIREBASE_API_KEY
  - Example: AIzaSyA-EXAMPLE-KEY
- FIREBASE_AUTH_DOMAIN
  - Example: your-project.firebaseapp.com
- FIREBASE_PROJECT_ID
  - Example: your-project-id
- FIREBASE_APP_ID
  - Example: 1:1234567890:web:abcdef123456

Optional (test-only keys):
- TEST_ANALYTICS_KEY
  - Use only test environment keys, not production credentials.

Security notes:
- Use dedicated test accounts and limit their permissions.
- Rotate test credentials periodically and avoid storing production credentials in CI.
- Limit repository secrets access to necessary workflows only.
