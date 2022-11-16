## Can We Play Together API

Simple API made with Express that receives two steam usernames and return what games they can play together.

This API is hosted in https://can-we-play-together.onrender.com/

## How to use

```
GET https://can-we-play-together.onrender.com/gamesInCommon/:username1/:username2
```

## Requirements

* Node 16.15
* Git

## Common setup

1. Clone the repo
```bash
git clone https://github.com/ferreirasara/can-we-play-together-api.git
cd the-example-app.nodejs
```

2. Install dependencies

```bash
yarn
```

3. Create a `.env` file and set your variables

```
PORT=8080
NODE_ENV=development
STEAM_API_KEY=<YOUR_STEAM_API_KEY>
SENTRY_DSN=<YOUR_SENTRY_DSN> # optional
ROLLBAR_TOKEN=<YOUR_ROLLBAR_TOKEN> # optional
```

4. Start the server

```
yarn start
```

Try to make a GET request for http://localhost:8080/gamesInCommon/:username1/:username2 :)
