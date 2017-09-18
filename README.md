<!-- markdownlint-disable MD026 MD033 -->

# DiscordFeedback

This is the bot that powers the Discord Feedback server, developed by volunteers on their spare time.

## Table of Contents

- [Development](#development)
  - [Config](#config)
  - [Testing](#coming-soon)
- [Selfhosting](#selfhosting)
  - [Config Creation](#config-creation)
  - [Database Initalization](#database-initialization)
  - [Running the Bot](#running-the-bot)

## Development

You can find code style & other details for contributing (such as tools we use) in the [CONTRIBUTING.MD](DiscordFeedback/.github/CONTRIBUTING.md)

### Config

We like to keep things simple, when working on the bot you can change the following lines in constants.js, at the bottom of the file

```js

  Debugging: {
    enable: true, // This makes the bot not break when you're not working with production data
    mocking: {
      email: 'notdougley@example.com', // Put your "staging" uservoice email address here, otherwise anything relying on getMail will fail, as getMail is designed to only work on production by default
    }
  }

```

### Coming soon!

Tests! You can figure out if you broke something sending us a super cool feature with a simple `npm test`!

---

## Selfhosting

We don't (fully) support running your own copy of our bot, as its highly customized for usage on the Discord Feedback server. This doesn't mean you can't run it, just that we don't have the time to help you make it run (you know, with making this bot and all).

Now, if you do want to run an instance, you need the following:

- UserVoice API keys, these **must** be marked as "Trusted" inside the admin panel.
- Discord bot account
- [RethinkDB](https://www.rethinkdb.com)
- A Sentry DSN
- The bot to be installed (duh) `npm i`.
- Discord server (duh)
  - Server **must** have channels named `bot-log`, `admin-queue` and `bot-error`, and the bot **must** have write access to these channels.

### Config creation

Config creation is pretty straightforward, everything you need is provided for you in the example config file (`config.example.js`), all the values in there are placeholders, just replace them with your own data and then save the file as `config.js` in the project root. You'll also need to update the perms values in `constants.js`.

```js

  DefaultPerms: {
    users: {
      '107904023901777920': 10, // replace the role ID's with your own
      '110813477156720640': 10
    },
    roles: {
      '268815351360389121': 10,
      '268815286067527690': 10
    }
}

```

### Database initialization

We use a database to track things, so you gotta get RethinkDB setup with the tables and whatnot the bot needs. Luckly for you we made it super simple with our dbcreate script™. Just run the command `npm run-script dbcreate` in the project root (**While RethinkDB server is running!**) in order initialize RethinkDB with all those tables that is needed, and you're good to go!

### Running the Bot

Starting is also very simple, just run `npm start`. Do note there will be little to no console output, this program is highly reliant on [Sentry](https://sentry.io) for error reporting.

---

<p align="center">
  <a href="https://discord.gg/discord-feedback"><img src="https://discordapp.com/api/v7/guilds/268811439588900865/widget.png?style=banner3"></a>
</p>
