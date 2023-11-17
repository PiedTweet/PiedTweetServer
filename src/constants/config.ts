import argv from 'minimist'

const option = argv(process.argv.slice(2))

export const isProduction = Boolean(option.production)
