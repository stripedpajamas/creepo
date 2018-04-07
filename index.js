#!/usr/bin/env node
const fs = require('fs')
const os = require('os')
const child = require('child_process')
const path = require('path')
const c = require('clorox')
const fetch = require('node-fetch')
const prompts = require('prompts')

const createRepo = ({ name, description, username, token }) => {
  const auth = Buffer.from(`${username}:${token}`).toString('base64')
  return fetch('https://api.github.com/user/repos', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
}

// begin
let config = {}
const configDir = path.join(os.homedir(), '.creepo')
const configFilePath = path.join(configDir, 'config.json')
const configDirExists = fs.existsSync(configDir)
const configFileExists = fs.existsSync(configFilePath)
const currentFolder = process.cwd().split(path.sep).slice(-1)[0]

if (configFileExists) {
  config = require(configFilePath)
}

const questions = [
  {
    type: () => configFileExists ? null : 'text',
    message: 'What\'s your GitHub username?',
    name: 'username'
  },
  {
    type: () => configFileExists ? null : 'text',
    message: 'What\'s your GitHub API Token (from https://github.com/settings/tokens)?',
    name: 'token'
  },
  {
    type: () => configFileExists ? null : 'confirm',
    message: 'Is it alright if I write that data to a config so I don\'t have to ask next time?',
    initial: true,
    name: 'writeOk'
  },
  {
    type: 'confirm',
    message: `Create repo named ${c.underline(currentFolder)}?`,
    initial: true,
    name: 'useCurrentFolder'
  },
  {
    type: prev => prev ? null : 'text',
    message: 'What do you want to name the repo?',
    name: 'repoName'
  },
  {
    type: 'text',
    message: 'A description for the repo, if you want:',
    name: 'description'
  }
]

const main = async () => {
  const answers = await prompts(questions)
  if (!configFileExists) {
    config.username = answers.username
    config.token = answers.token
    if (answers.writeOk) {
      if (!configDirExists) {
        fs.mkdirSync(configDir)
      }
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4))
      console.log(`${c.bold(`Config file saved to ${c.underline(configFilePath)}`)}`)
    }
  }

  let name
  if (answers.useCurrentFolder) {
    name = currentFolder
  } else {
    name = answers.repoName
  }

  if (name && config.username && config.token) {
    console.log(`  ${c.bold(`Creating repo ${c.underline(name)}`)}`)
    const res = await createRepo({
      name,
      user: config.username,
      description: answers.description,
      token: config.token
    }).catch((e) => {
      console.log(`  ${c.red.bold('Repo creation failed :(')}`, e.message || e)
      process.exit(1)
    })

    if (!res.clone_url) {
      console.log(`  ${c.red.bold('Something went wrong :(')}`)
      process.exit(1)
    }

    console.log(`  ${c.bold('Repo created successfully!')}`, `${c.italic(res.clone_url)}`)

    const runGit = await prompts({
      type: 'confirm',
      initial: true,
      message: 'Would you like me to configure this directory to use the new repo?'
    })

    if (runGit) {
      const gitCmds = ['git init', `git remote add origin ${res.clone_url}`]
      if (fs.existsSync(path.join(process.cwd(), '.git'))) {
        // git has already been initialized
        gitCmds.shift()
      }
      gitCmds.forEach(cmd => {
        try {
          child.execSync(cmd)
        } catch (e) { }
      })
      console.log(`  ${c.bold('All done! 🐹')}`)
    }
  }
}

main()
