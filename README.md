# GitHub Action: Telegram Event Notifier

This GitHub Action sends GitHub events as messages to a Telegram chat or channel or group or a specific topic in a group or thread.

## Usage

To use this GitHub Action, you need to have a Telegram bot token and a chat ID.

1. Create a new Telegram bot by talking to the [BotFather](https://t.me/BotFather) on Telegram and follow the instructions to obtain the bot token.

2. Find out the chat ID where you want to receive the event messages. You can use the [getUpdates](https://core.telegram.org/bots/api#getupdates) API method or search for the bot username in the Telegram app to get the chat ID.

3. In your GitHub repository, create a new workflow file (e.g., `.github/workflows/telegram-event-notifier.yml`) and define the following:

```yaml
name: Telegram Gate

on:
  issue_comment:
    types: [created]
  issues:
    types: [opened, edited, pinned, closed, reopened, assigned, labeled]
  pull_request:
    types:
      [opened, closed, edited, ready_for_review, review_requested, reopened]
  pull_request_review_comment:
    types: [created]
  push:

jobs:
  build:
    name: Telegram Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout pull request 🏁
        uses: actions/checkout@v3
        with:
          ref: refs/pull/${{ github.event.issue.number }}/head
      - name: Notifier
        uses: ethyaan/tgate-action@v1.0.0
        if: always()
        with:
          token: ${{ secrets.token }} # savethe bot token at settings/secrets with name: token
          to: ${{ secrets.to }} # save your chat id at settings/secrets with name: chat
          thread_id: ${{secrets.threadid}} # set this for sending message in thread or group topic
          disable_web_page_preview: false # set this to true to disable link previw in telegram
          disable_notification: false # set tjis true to send message in silet mode
```
