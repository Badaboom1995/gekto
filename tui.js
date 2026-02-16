#!/usr/bin/env node
import * as p from '@clack/prompts'

async function main() {
  console.clear()

  p.intro('Test CLI')

  const name = await p.text({
    message: 'What is your name?',
    placeholder: 'John',
  })

  if (p.isCancel(name)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  const framework = await p.select({
    message: 'Pick a framework',
    options: [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte' },
    ],
  })

  if (p.isCancel(framework)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  const features = await p.multiselect({
    message: 'Select features',
    options: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'ESLint', value: 'eslint' },
      { label: 'Prettier', value: 'prettier' },
    ],
  })

  if (p.isCancel(features)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  p.outro(`Done! Name: ${name}, Framework: ${framework}, Features: ${features.join(', ')}`)
}

main()
