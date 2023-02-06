#!/usr/bin/env node

import {program} from 'commander'
import init from './commands/init.mjs'
import sam_router from './commands/sam-router.mjs'

program
    .command('init')
    .description('Initiates sam router')
    .action(init)

program
    .command('start')
    .description('start sam router')
    .action(sam_router)

program.parse()
