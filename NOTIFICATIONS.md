Notifications setup

Slack Incoming Webhook

1. In Slack, go to Apps → "Incoming Webhooks" → Add to Workspace.
2. Choose the channel where you want to receive notifications and install the app.
3. Copy the webhook URL (it looks like `https://hooks.slack.com/services/XXX/YYY/ZZZ`).
4. In GitHub, go to your repository → Settings → Secrets and variables → Actions → New repository secret.
   - Name: `SLACK_WEBHOOK`
   - Value: the webhook URL from Slack

Notes
- The nightly workflow will send a short message with a link to the failing run when there is a failure.
- You can enhance the message payload to include details (artifact links, summary) by modifying the workflow step.
