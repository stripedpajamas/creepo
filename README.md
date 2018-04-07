# creepo

a small cli to help create GitHub repos remotely.

i hate going to the website to create a repo after i've written some code.

![creepo in action](https://cldup.com/w0PROnR3Qt.png)

## usage

```bash
$ npm i -g creepo
$ creepo

OR

$ npx creepo
```

to run, you need to have an API token from GitHub with at least 'public_repo' permissions. you can make one here: https://github.com/settings/tokens

on first run, `creepo` will ask for your GitHub username and token and (if you let it), save those in `~/.creepo/config.json` for the future.


